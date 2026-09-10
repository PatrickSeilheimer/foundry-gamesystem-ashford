const TEMPLATE = "systems/ashford/templates/chat/heal-confirm-card.hbs";

/**
 * Applies a pending heal (module/documents/actor.mjs#rollConsumableHeal) to its target — GM-only,
 * because this is the one place the actual Actor#update happens. Doing it here, on the GM's own
 * client, is also what fixes the permission error a player got trying to raise ANOTHER player's
 * HP directly: a player rarely has OWNER on someone else's character sheet, but the GM always does.
 */
async function applyPendingHeal(message, button) {
  if (!game.user.isGM) return;
  const data = message.getFlag("ashford", "healConfirm");
  if (!data || data.resolved) return;

  const targetActor = await fromUuid(data.targetUuid);
  if (!targetActor) {
    ui.notifications?.warn("Ziel nicht mehr vorhanden.");
    return;
  }

  const multiplier = Number(button.dataset.multiplier) || 1;
  const appliedAmount = Math.round(data.amount * multiplier);
  const appliedLabel = multiplier === 2 ? "doppelt" : multiplier === 0.5 ? "halbiert" : "normal";
  await targetActor.applyHealthDelta(appliedAmount);

  const newData = { ...data, resolved: true, appliedAmount, appliedLabel };
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
    itemName: data.itemName,
    targetName: data.targetName,
    amount: data.amount,
    resolved: true,
    appliedAmount,
    appliedLabel
  });
  await message.update({ content, "flags.ashford.healConfirm": newData });
}

/** Hides the GM-confirm buttons from players and wires up the three multiplier buttons for the GM. */
function decorateHealCard(message, root) {
  if (!root || root.dataset.ashfordHealBound) return;
  const card = root.querySelector(".ashford-heal-card");
  if (!card) return;
  root.dataset.ashfordHealBound = "1";

  if (!game.user.isGM) {
    root.querySelector(".heal-gm-actions")?.remove();
    return;
  }
  root.querySelectorAll(".ashford-heal-apply").forEach(btn => {
    btn.addEventListener("click", () => applyPendingHeal(message, btn));
  });
}

/** Wires the heal-confirm chat card up for both the ApplicationV2 chat log (v13+, HTMLElement) and
 * the legacy jQuery-based hook, in case either fires for a given Foundry version. */
export default function registerHealConfirmChatControls() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    decorateHealCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
  Hooks.on("renderChatMessage", (message, html) => {
    decorateHealCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
}
