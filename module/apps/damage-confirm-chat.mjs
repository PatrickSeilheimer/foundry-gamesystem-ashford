const TEMPLATE = "systems/ashford/templates/chat/damage-confirm-card.hbs";

async function renderCard(data) {
  return foundry.applications.handlebars.renderTemplate(TEMPLATE, data);
}

/**
 * Applies the pending damage to its target — runs automatically as soon as a GM client renders
 * the card, no click needed (unlike the heal-confirm flow, which needs an explicit GM choice
 * between normal/doppelt/halbiert; a landed, already-armor-reduced hit just applies). This is
 * what fixes the same permission problem heal-confirm-chat.mjs solves: a player's client usually
 * lacks OWNER on the target (a GM's NPC/creature, or another player's character), so the actual
 * Actor#update has to run on the GM's own client. `data.resolved`, re-read from the message on
 * every call, is what keeps a second render (e.g. a reconnecting GM) from double-applying.
 */
async function applyPendingDamage(message) {
  const data = message.getFlag("ashford", "damageConfirm");
  if (!data || data.resolved) return;

  const targetActor = await fromUuid(data.targetUuid);
  if (!targetActor) {
    ui.notifications?.warn("Ziel nicht mehr vorhanden.");
    return;
  }
  // Snapshot statt Delta: applyHealthDelta klemmt auf [0, max], d.h. bei einem Treffer, der mehr
  // Schaden macht als der Zielpunkt noch LP hat, wäre "+finalDamage" beim Rückgängigmachen zu viel.
  // Den exakten Vorher-Wert zu sichern macht "Rückgängig machen" immer korrekt, egal wie geklemmt wurde.
  const previousHealthValue = targetActor.system.resources?.health?.value ?? 0;
  await targetActor.applyHealthDelta(-data.finalDamage);

  const newData = { ...data, resolved: true, previousHealthValue };
  const content = await renderCard({ ...data, resolved: true, reverted: false });
  await message.update({ content, "flags.ashford.damageConfirm": newData });
}

/** Reverts one already-applied card: restores the target's HP and, if this damage came through the
 * full Treffer→Schaden-Pipeline (AshfordActor#rollWeaponAttack) rather than the standalone
 * "Schaden"-Button, whichever Item actually held the consumed round count too — "Schaden UND
 * Munition rückgängig". That's the weapon's own ammoRemaining for feedType "internal", or a
 * separate loaded AshfordMagazine Item's roundsLoaded for feedType "magazine" (see
 * AshfordActor#rollWeaponAttack) — both live on the attacker's own actor, so a generic
 * `items.get(id).update({[field]: value})` handles either case identically. */
async function undoDamage(message) {
  if (!game.user.isGM) return;
  const data = message.getFlag("ashford", "damageConfirm");
  if (!data || !data.resolved || data.reverted) return;

  const targetActor = await fromUuid(data.targetUuid);
  if (targetActor && data.previousHealthValue != null) {
    await targetActor.update({ "system.resources.health.value": data.previousHealthValue });
  }

  if (data.ammoRestoreValue != null && data.ammoRestoreItemId && data.ammoRestoreField && data.attackerUuid) {
    const attacker = await fromUuid(data.attackerUuid);
    const restoreItem = attacker?.items.get(data.ammoRestoreItemId);
    if (restoreItem) await restoreItem.update({ [data.ammoRestoreField]: data.ammoRestoreValue });
  }

  const newData = { ...data, reverted: true };
  const content = await renderCard({ ...data, resolved: true, reverted: true });
  await message.update({ content, "flags.ashford.damageConfirm": newData });
}

/** GM-only: auto-applies on first render (guarded by the `resolved` flag, safe to call every
 * render) and wires the undo button once it exists (only appears after the card re-renders in the
 * "resolved" state, so the listener has to be attached freshly each render, not just once). */
function decorateDamageCard(message, root) {
  if (!root || !game.user.isGM) return;
  if (!root.querySelector(".ashford-damage-card")) return;

  applyPendingDamage(message);

  const undoBtn = root.querySelector(".ashford-damage-undo");
  if (undoBtn && !undoBtn.dataset.ashfordBound) {
    undoBtn.dataset.ashfordBound = "1";
    undoBtn.addEventListener("click", () => undoDamage(message));
  }
}

/** Wires the damage-confirm chat card up for both the ApplicationV2 chat log (v13+, HTMLElement)
 * and the legacy jQuery-based hook, in case either fires for a given Foundry version. */
export default function registerDamageConfirmChatControls() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    decorateDamageCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
  Hooks.on("renderChatMessage", (message, html) => {
    decorateDamageCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
}
