export default class AshfordActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ashford", "sheet", "actor"],
      width: 620,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  get template() {
    return `systems/ashford/templates/actor/${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    context.system = this.actor.system;
    context.items = this.actor.items;
    context.traits = this.actor.items.filter(i => i.type === "trait");
    context.talents = this.actor.items.filter(i => i.type === "talent");
    context.gear = this.actor.items.filter(i => !["trait", "talent"].includes(i.type));
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ashford-roll-pool").on("click", () => this.actor.rollPool({ label: this.actor.name }));
    html.find(".item-create").on("click", ev => this._onItemCreate(ev));
    html.find(".item-edit").on("click", ev => {
      const item = this.actor.items.get(ev.currentTarget.closest("[data-item-id]").dataset.itemId);
      item?.sheet.render(true);
    });
    html.find(".item-delete").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.delete();
    });
  }

  async _onItemCreate(event) {
    const type = event.currentTarget.dataset.type ?? "equipment";
    return this.actor.createEmbeddedDocuments("Item", [
      { name: `Neu: ${type}`, type }
    ]);
  }
}
