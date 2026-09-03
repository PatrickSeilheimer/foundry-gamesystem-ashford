export default class AshfordItem extends Item {
  /** Ticks down `usesRemaining` and posts a short flavor message — the inventory "Benutzen/Essen/Trinken" action.
   * Combi-Items (system.comboItems non-empty, e.g. Erste-Hilfe-Kasten) instead spawn their contents as new
   * Consumables on the actor and delete themselves entirely — "der Kasten selbst ist danach aufgebraucht". */
  async useConsumable() {
    if (this.type !== "consumable") return null;

    const combo = this.system.comboItems ?? [];
    if (combo.length) {
      if (!this.actor) {
        ui.notifications?.warn(`${this.name} muss auf einem Charakter liegen, um geöffnet zu werden.`);
        return null;
      }
      await this.actor.createEmbeddedDocuments(
        "Item",
        combo.map(entry => ({
          name: entry.name,
          type: "consumable",
          system: { quantity: entry.quantity, usesRemaining: 1, category: "medizin", actionLabel: "Anwenden" }
        }))
      );
      const contents = combo.map(c => `${c.quantity}× ${c.name}`).join(", ");
      await this.delete();
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<p><strong>${this.name}</strong> geöffnet: ${contents}.</p>`
      });
    }

    const remaining = this.system.usesRemaining;
    if (remaining <= 0) {
      ui.notifications?.warn(`${this.name} ist aufgebraucht.`);
      return null;
    }
    await this.update({ "system.usesRemaining": remaining - 1 });
    // Wirkt direkt auf den (für Spieler unsichtbaren) Infektionswert, ganz ohne GM — der Effekt bleibt
    // aus der Chat-Nachricht heraus, damit dort nie eine konkrete Zahl für Spieler sichtbar wird.
    if (this.system.infectionDelta) await this.actor?.applyInfectionDelta(this.system.infectionDelta);
    const verb = this.system.actionLabel || "benutzt";
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${this.name}</strong> — ${verb}.</p>`
    });
  }
}
