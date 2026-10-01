const TEMPLATE = "systems/ashford/templates/apps/combat-hud.hbs";

/**
 * A Baldur's-Gate-3/Divinity-Original-Sin-2-style turn-order bar: a row of portraits fixed to the
 * top-center of the screen while a Combat is active, current turn's portrait enlarged/highlighted,
 * everyone else smaller and dimmed. Deliberately NOT a Foundry ApplicationV2 window — no title bar,
 * no drag handle, no close button; it's a passive HUD overlay that shows/hides itself, not something
 * the user opens or positions. Plain DOM + Handlebars instead, appended once to <body>.
 */
class AshfordCombatHud {
  /** @type {AshfordCombatHud|null} */
  static #instance = null;

  /** @type {HTMLElement|null} */
  element = null;

  static get instance() {
    AshfordCombatHud.#instance ??= new AshfordCombatHud();
    return AshfordCombatHud.#instance;
  }

  ensureElement() {
    if (this.element) return this.element;
    const el = document.createElement("div");
    el.id = "ashford-combat-hud";
    el.hidden = true;
    document.body.appendChild(el);
    // Klick auf ein Portrait: springt mit der Kamera zum zugehörigen Token und wählt es aus --
    // reine Ansichts-Bequemlichkeit, verändert keinen Spielzustand (kein Zug-Skip o.ä.).
    el.addEventListener("click", ev => {
      const portrait = ev.target.closest("[data-combatant-id]");
      if (!portrait) return;
      const combatant = game.combat?.combatants.get(portrait.dataset.combatantId);
      const token = combatant?.token?.object;
      if (!token) return;
      token.control({ releaseOthers: true });
      canvas.animatePan({ x: token.center.x, y: token.center.y });
    });
    this.element = el;
    return el;
  }

  /** Rebuilds the whole bar from the currently-viewed Combat's turn order; hides itself when there's none. */
  async render() {
    const el = this.ensureElement();
    const combat = game.combat;
    const turns = combat?.turns ?? [];

    const combatants = turns
      .filter(c => !c.hidden || game.user.isGM) // versteckte Kämpfer bleiben für Spieler unsichtbar, wie im Standard-Tracker
      .map(c => {
        const health = c.actor?.system?.resources?.health;
        const healthPct = health?.max ? Math.max(0, Math.min(100, Math.round((health.value / health.max) * 100))) : 100;

        // Die "aktive" Waffe fürs HUD: die erste aktuell geführte Waffe — bei mehreren gleichzeitig
        // geführten Waffen (Pistole + Messer o.ä.) zeigt die kompakte Leiste bewusst nur eine, den
        // Rest sieht man im Detail auf dem Charakterbogen.
        const weapon = c.actor?.items.find(i => i.type === "weapon" && i.system.equipped) ?? null;
        let shotDots = [];
        let ammoLabel = null;
        if (weapon) {
          const tracker = weapon.getFlag("ashford", "shotTracker");
          shotDots = Array.isArray(tracker) && tracker.length === weapon.system.shotsPerRound
            ? tracker
            : Array(weapon.system.shotsPerRound).fill("available");
          // Munitionsstand ist Spielleiter-Wissen — Spieler sehen ihn nur auf dem eigenen Charakterbogen,
          // nicht im HUD für alle sichtbar (gilt auch für die eigene Waffe, aus Konsistenzgründen).
          if (game.user.isGM) {
            if (weapon.system.feedType === "internal") {
              ammoLabel = `${weapon.system.ammoRemaining}/${weapon.system.capacity}`;
            } else if (weapon.system.feedType === "magazine") {
              const mag = weapon.system.loadedMagazineId ? c.actor.items.get(weapon.system.loadedMagazineId) : null;
              ammoLabel = mag ? `${mag.system.roundsLoaded}/${mag.system.capacity}` : "kein Magazin";
            }
          }
        }

        return {
          id: c.id,
          name: c.name,
          img: c.img || c.actor?.img || "icons/svg/mystery-man.svg",
          active: c.id === combat?.combatant?.id,
          defeated: !!c.isDefeated,
          healthPct,
          shotDots,
          ammoLabel
        };
      });

    if (!combatants.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.innerHTML = await foundry.applications.handlebars.renderTemplate(TEMPLATE, { combatants });
    el.hidden = false;
  }
}

/** Wires the HUD up to every Combat/Combatant lifecycle event, plus mid-fight HP changes. Called once at module load. */
export default function registerCombatHudControls() {
  const rerender = () => AshfordCombatHud.instance.render();

  Hooks.on("ready", () => {
    game.ashford ??= {};
    game.ashford.combatHud = AshfordCombatHud.instance;
    rerender();
  });

  Hooks.on("createCombat", rerender);
  Hooks.on("deleteCombat", rerender);
  Hooks.on("createCombatant", rerender);
  Hooks.on("updateCombatant", rerender);
  Hooks.on("deleteCombatant", rerender);

  Hooks.on("updateCombat", async (combat, changed) => {
    rerender();
    // Neuer Zug (Runde ODER Kämpfer gewechselt) -> die Schüsse-pro-Zug-Tracker des jetzt aktiven
    // Kämpfers zurücksetzen. Nur der GM-Client schreibt, damit nicht jeder verbundene Client
    // dieselbe Reset-Anfrage gleichzeitig abschickt.
    if (!game.user.isGM) return;
    if (!("turn" in changed) && !("round" in changed) && !("started" in changed)) return;
    const actor = combat.combatant?.actor;
    if (actor) await actor.resetShotTrackersForTurn();
  });

  // Lebensbalken + Munition/Schüsse unter den Portraits sollen live mitgehen, wenn im Kampf etwas passiert.
  Hooks.on("updateActor", actor => {
    if (game.combat?.combatants.some(c => c.actor?.id === actor.id)) rerender();
  });
  Hooks.on("updateItem", item => {
    if (item.actor && game.combat?.combatants.some(c => c.actor?.id === item.actor.id)) rerender();
  });
}
