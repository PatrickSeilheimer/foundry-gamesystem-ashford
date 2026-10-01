import { REST_ACTIVITIES, restActivityByKey } from "../rules/activities.mjs";
import { advanceWorldClock } from "./world-clock.mjs";

const TEMPLATE = "systems/ashford/templates/apps/rest.hbs";
const SESSION_KEY = "restSession";
const SOCKET = "system.ashford";

/**
 * Group rest ("Rast"): the whole party rests together, and each character independently queues
 * minutes-costed activities (module/rules/activities.mjs) for themselves while everyone watches the
 * shared duration update live. The session itself lives in a single WORLD setting (`restSession`) —
 * Foundry replicates every change to all connected clients via its own Setting-document machinery,
 * which is also what re-renders everyone's panel (see the `updateSetting` hook below).
 *
 * World settings can only be WRITTEN by a user with the Settings-modify permission (normally GM-only
 * in Foundry) — so a player's own actions (queue an activity, toggle ready, …) are relayed over a
 * plain socket message to the GM's client, which performs the actual write after validating it. The
 * GM's own actions skip the relay and write directly. This is the standard pattern for "shared,
 * player-writable state" in Foundry systems that don't want to depend on a module like socketlib.
 */

/** `default: null` on a `type: Object` setting gets rejected by Foundry's own settings validation —
 * so "no active rest" is its own plain object (`active: false`) instead of null. */
const IDLE_SESSION = { active: false, fireMade: false, participants: {} };

function emptySession() {
  const participants = {};
  for (const actor of game.actors.filter(a => a.type === "character")) {
    participants[actor.id] = { queue: [], ready: false };
  }
  return { active: true, fireMade: false, participants };
}

function getSession() {
  return game.settings.get("ashford", SESSION_KEY);
}

function computeGroupDuration(session) {
  const fireBase = session.fireMade ? 30 : 0;
  const maxQueue = Object.values(session.participants).reduce((max, p) => {
    const total = p.queue.reduce((sum, a) => sum + a.minutes, 0);
    return Math.max(max, total);
  }, 0);
  return fireBase + maxQueue;
}

/** GM or the actor's own owner may add/remove/ready THAT actor's row. */
function canControl(actor) {
  return !!(game.user.isGM || actor?.isOwner);
}

/** Static catalog entries (fire-gated) + one dynamic "Herstellen: X" entry per craftable item this
 * actor currently owns (also fire-gated) — what shows up in that actor's "+ Aktivität" picker. */
function availableActivitiesFor(session, actor, participant) {
  const restHpCount = participant.queue.filter(a => a.key === "rest-hp").length;
  const options = REST_ACTIVITIES.filter(a => !a.requiresFire || session.fireMade).filter(
    a => a.key !== "rest-hp" || restHpCount < a.maxCount
  ).map(a => ({ key: a.key, label: a.label, minutes: a.minutes, itemId: "" }));

  const recipes = actor.items
    .filter(i => i.system.recipe?.craftable && (!i.system.recipe.requiresFire || session.fireMade))
    .map(i => ({
      key: "craft",
      label: `Herstellen: ${i.name}`,
      minutes: i.system.recipe.minutes,
      itemId: i.id
    }));

  return [...options, ...recipes];
}

async function sendRestAction(payload) {
  if (game.user.isGM) return handleRestSocketAction(payload);
  game.socket.emit(SOCKET, payload);
}

/** Only ever runs on the GM's client (see the socket listener + sendRestAction above). */
async function handleRestSocketAction(payload) {
  if (!game.user.isGM) return;
  const session = getSession();
  if (!session?.active) return;
  const updated = foundry.utils.deepClone(session);
  const participant = updated.participants[payload.actorId];
  if (!participant) return;

  switch (payload.action) {
    case "addActivity":
      participant.queue.push(payload.activity);
      participant.ready = false; // neue Aktivität -> die eigene Bereit-Markierung verfällt
      break;
    case "removeActivity":
      participant.queue.splice(payload.index, 1);
      participant.ready = false;
      break;
    case "toggleFire":
      updated.fireMade = !updated.fireMade;
      break;
    case "setReady":
      participant.ready = payload.ready;
      break;
    default:
      return;
  }

  await game.settings.set("ashford", SESSION_KEY, updated);
  if (Object.values(updated.participants).every(p => p.ready)) await resolveRest(updated);
}

/**
 * Consumes `ingredient.quantity` NAME-matched ("by name" rather than UUID — simplest, works across
 * compendium-sourced and hand-made items alike) items from across as many stacks as necessary, same
 * pattern as AshfordActor#_consumeLooseAmmo. Only called for `consumed: true` ingredients.
 */
async function consumeIngredient(actor, name, quantityNeeded) {
  const stacks = actor.items.filter(i => i.name === name && i.system.quantity > 0).sort((a, b) => a.system.quantity - b.system.quantity);
  let remaining = quantityNeeded;
  const updates = [];
  const deletions = [];
  for (const stack of stacks) {
    if (remaining <= 0) break;
    const take = Math.min(stack.system.quantity, remaining);
    remaining -= take;
    const newQty = stack.system.quantity - take;
    if (newQty <= 0) deletions.push(stack.id);
    else updates.push({ _id: stack.id, "system.quantity": newQty });
  }
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
  if (deletions.length) await actor.deleteEmbeddedDocuments("Item", deletions);
}

/** Crafts one item from its own recipe — ingredients come ONLY from the crafting actor's own
 * inventory (not pooled across the party, to keep "who loses what" unambiguous). */
async function craftRecipe(actor, itemId) {
  const source = actor.items.get(itemId);
  const recipe = source?.system.recipe;
  if (!recipe?.craftable) return `${source?.name ?? "Rezept"}: nicht (mehr) herstellbar.`;

  for (const ing of recipe.ingredients) {
    const have = actor.items.filter(i => i.name === ing.name).reduce((sum, i) => sum + (i.system.quantity ?? 0), 0);
    if (have < ing.quantity) return `${source.name}: fehlende Zutat "${ing.name}" (${have}/${ing.quantity}).`;
  }
  for (const ing of recipe.ingredients.filter(i => i.consumed)) {
    await consumeIngredient(actor, ing.name, ing.quantity);
  }
  const current = actor.items.get(itemId);
  if (current) await current.update({ "system.quantity": current.system.quantity + recipe.yield });
  return `${source.name}: ${recipe.yield}x hergestellt.`;
}

/**
 * Applies every queued activity's effect for every participant, advances the world clock by the
 * final group duration, posts one consolidated summary chat message, and clears the session. Only
 * ever runs on the GM's client (triggered either by everyone going ready, or the GM's "erzwingen"
 * button) — every embedded-document write below needs GM-level permission on OTHER players' actors
 * anyway (e.g. crafting, healing), so there'd be nothing to gain from letting a player's client do it.
 */
async function resolveRest(session) {
  const groupDuration = computeGroupDuration(session);
  const lines = [];
  if (session.fireMade) lines.push("🔥 Ein Feuer wurde gemacht.");

  for (const [actorId, participant] of Object.entries(session.participants)) {
    const actor = game.actors.get(actorId);
    if (!actor) continue;

    // Restzeit automatisch mit Ausruhen auffüllen, bis entweder die Zeit oder die 4x15min-Obergrenze
    // erreicht ist — der Entwurf des Spielers: "wird bei Bestätigen automatisch mit ausruhen aufgefüllt".
    const queue = foundry.utils.deepClone(participant.queue);
    let ownTotal = queue.reduce((sum, a) => sum + a.minutes, 0);
    let restHpCount = queue.filter(a => a.key === "rest-hp").length;
    while (groupDuration - ownTotal >= 15 && restHpCount < 4) {
      queue.push({ key: "rest-hp", minutes: 15, auto: true });
      ownTotal += 15;
      restHpCount++;
    }

    const actorLines = [];
    for (const activity of queue) {
      switch (activity.key) {
        case "first-aid": {
          const wound = actor.system.activeConditions.find(c => c.system.category === "verletzungen");
          if (wound) {
            await wound.update({ "system.active": false });
            actorLines.push(`Erste Hilfe: "${wound.name}" versorgt.`);
          } else {
            actorLines.push("Erste Hilfe: keine offene Wunde gefunden.");
          }
          break;
        }
        case "rest-hp": {
          const stillWounded = actor.system.activeConditions.some(c => c.system.category === "verletzungen");
          if (stillWounded) {
            actorLines.push("Ausruhen: Wunden noch nicht versorgt, keine Heilung.");
          } else {
            await actor.applyHealthDelta(1);
            actorLines.push("Ausruhen: +1 Gesundheit.");
          }
          break;
        }
        case "refill-ammo": {
          for (const weapon of actor.items.filter(i => i.type === "weapon" && i.system.feedType === "internal")) {
            await actor.reloadWeapon(weapon.id);
          }
          for (const magazine of actor.items.filter(i => i.type === "magazine")) {
            await actor.refillMagazine(magazine.id);
          }
          actorLines.push("Munition & Magazine aufgefüllt.");
          break;
        }
        case "clean-infection": {
          await actor.applyInfectionDelta(-1);
          actorLines.push("Infektionsstelle gereinigt (-1 Infektion).");
          break;
        }
        case "craft": {
          actorLines.push(await craftRecipe(actor, activity.itemId));
          break;
        }
        case "cook-food":
          actorLines.push("Essen zubereitet.");
          break;
        case "boil-water":
          actorLines.push("Wasser abgekocht.");
          break;
        case "stand-watch":
          actorLines.push("Hat Wache gehalten.");
          break;
        case "maintain-gear":
          actorLines.push("Ausrüstung gewartet.");
          break;
        case "forage":
          actorLines.push("Nahrung/Wasser gesammelt.");
          break;
        default:
          break;
      }
    }
    if (actorLines.length) lines.push(`<strong>${actor.name}</strong>: ${actorLines.join(" ")}`);
  }

  await advanceWorldClock(groupDuration);
  await ChatMessage.create({
    content: `<p>🏕️ <strong>Rast beendet</strong> (${groupDuration} min)</p><p>${lines.join("</p><p>")}</p>`
  });
  await game.settings.set("ashford", SESSION_KEY, IDLE_SESSION);
}

class AshfordRestHud {
  static #instance = null;
  element = null;

  static get instance() {
    AshfordRestHud.#instance ??= new AshfordRestHud();
    return AshfordRestHud.#instance;
  }

  ensureElement() {
    if (this.element) return this.element;
    const el = document.createElement("div");
    el.id = "ashford-rest-hud";
    el.hidden = true;
    document.body.appendChild(el);

    el.addEventListener("click", ev => {
      if (ev.target.closest(".rest-start")) return game.user.isGM && game.settings.set("ashford", SESSION_KEY, emptySession());
      if (ev.target.closest(".rest-cancel")) return game.user.isGM && game.settings.set("ashford", SESSION_KEY, IDLE_SESSION);
      if (ev.target.closest(".rest-force-resolve")) {
        const session = getSession();
        return game.user.isGM && session?.active && resolveRest(session);
      }
      if (ev.target.closest(".rest-fire-toggle")) return sendRestAction({ action: "toggleFire" });

      const removeBtn = ev.target.closest(".rest-activity-remove");
      if (removeBtn) {
        const row = removeBtn.closest("[data-actor-id]");
        return sendRestAction({ action: "removeActivity", actorId: row.dataset.actorId, index: Number(removeBtn.dataset.index) });
      }

      const addBtn = ev.target.closest(".rest-activity-add");
      if (addBtn) {
        const row = addBtn.closest("[data-actor-id]");
        const select = row.querySelector(".rest-activity-picker");
        const opt = select?.selectedOptions[0];
        if (!opt?.value) return;
        const activity = { key: opt.dataset.key, minutes: Number(opt.dataset.minutes), label: opt.dataset.label };
        if (opt.dataset.itemId) activity.itemId = opt.dataset.itemId;
        return sendRestAction({ action: "addActivity", actorId: row.dataset.actorId, activity });
      }

      const readyBox = ev.target.closest(".rest-ready-toggle");
      if (readyBox) {
        const row = readyBox.closest("[data-actor-id]");
        return sendRestAction({ action: "setReady", actorId: row.dataset.actorId, ready: readyBox.checked });
      }
    });
    this.element = el;
    return el;
  }

  async render() {
    const el = this.ensureElement();
    const session = getSession();
    if (!session?.active) {
      el.innerHTML = game.user.isGM
        ? await foundry.applications.handlebars.renderTemplate(TEMPLATE, { active: false, isGM: true })
        : "";
      el.hidden = !game.user.isGM;
      return;
    }

    const groupDuration = computeGroupDuration(session);
    const participants = Object.entries(session.participants).map(([actorId, participant]) => {
      const actor = game.actors.get(actorId);
      const own = participant.queue.reduce((sum, a) => sum + a.minutes, 0);
      return {
        actorId,
        name: actor?.name ?? "?",
        img: actor?.img,
        ready: participant.ready,
        own,
        queue: participant.queue.map((a, index) => ({ ...a, index, displayLabel: a.label ?? restActivityByKey(a.key)?.label ?? a.key })),
        canControl: actor ? canControl(actor) : false,
        options: actor ? availableActivitiesFor(session, actor, participant) : []
      };
    });

    el.innerHTML = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
      active: true,
      isGM: game.user.isGM,
      fireMade: session.fireMade,
      groupDuration,
      participants
    });
    el.hidden = false;
  }
}

export default function registerRestControls() {
  game.settings.register("ashford", SESSION_KEY, { scope: "world", config: false, type: Object, default: IDLE_SESSION });

  const rerender = () => AshfordRestHud.instance.render();

  Hooks.on("ready", () => {
    game.ashford ??= {};
    game.ashford.rest = AshfordRestHud.instance;
    game.socket.on(SOCKET, payload => handleRestSocketAction(payload));
    rerender();
  });

  Hooks.on("updateSetting", setting => {
    if (setting.key === `ashford.${SESSION_KEY}`) rerender();
  });
}
