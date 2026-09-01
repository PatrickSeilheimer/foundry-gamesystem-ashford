export default class AshfordItem extends Item {
  /** Ticks down `usesRemaining` and posts a short flavor message — the inventory "Benutzen/Essen/Trinken" action. */
  async useConsumable() {
    if (this.type !== "consumable") return null;
    const remaining = this.system.usesRemaining;
    if (remaining <= 0) {
      ui.notifications?.warn(`${this.name} ist aufgebraucht.`);
      return null;
    }
    await this.update({ "system.usesRemaining": remaining - 1 });
    const verb = this.system.actionLabel || "benutzt";
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${this.name}</strong> — ${verb}.</p>`
    });
  }
}
