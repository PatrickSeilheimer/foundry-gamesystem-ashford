const { DialogV2 } = foundry.applications.api;

/**
 * Small confirm step for consumables that carry a `healFormula` (e.g. Adrenalin-Spritze): the
 * inventory button ("Injizieren") opens this instead of using the item directly, and the actual
 * roll+heal+use only happens once the player clicks "Heilen" inside the dialog. Keeps the backpack
 * row down to a single button per item while still making the healing step an explicit, separate
 * action (matches the confirm-before-consuming pattern the item's own action label implies).
 */
export default class AshfordConsumablePrompt {
  static async prompt(actor, item) {
    const description = item.system.description || `<p>${item.name}</p>`;
    const content = `
      <div class="ashford-consumable-prompt">
        ${description}
        <p class="hint">Ziel: aktuell anvisiertes Token, sonst ${actor.name} selbst.</p>
      </div>
    `;

    return DialogV2.wait({
      window: { title: item.name, icon: "fa-solid fa-syringe" },
      content,
      buttons: [
        {
          action: "heal",
          label: game.i18n.localize("ASHFORD.Sheet.rollHeal"),
          icon: "fas fa-dice-d6",
          default: true,
          callback: () => actor.rollConsumableHeal(item.id)
        },
        { action: "cancel", label: "Abbrechen" }
      ]
    });
  }
}
