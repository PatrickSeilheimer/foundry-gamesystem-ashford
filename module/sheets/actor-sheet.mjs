export default class AshfordActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ashford", "sheet", "actor"],
      width: 640,
      height: 720,
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
    context.gear = this.actor.items.filter(i => !["trait", "talent"].includes(i.type));

    const talents = this.actor.items.filter(i => i.type === "talent");
    context.talentTiers = [1, 2, 3].map(stufe => ({
      stufe,
      talents: talents
        .filter(t => t.system.stufe === stufe)
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
    }));
    context.hasTalents = talents.length > 0;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ashford-roll-pool").on("click", () =>
      this.actor.quickRollPool({ label: this.actor.name, basePool: this.actor.system.attackPool ?? 3 })
    );
    html.find(".ashford-roll-talent").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.rollTalent(itemId);
    });
    html.find(".ashford-init-talents").on("click", () => this.actor.ensureCanonicalTalents());
    html.find(".talent-field").on("change", ev => {
      const el = ev.currentTarget;
      const itemId = el.closest("[data-item-id]").dataset.itemId;
      const field = el.dataset.field;
      const item = this.actor.items.get(itemId);
      item?.update({ [`system.${field}`]: Number(el.value) });
    });
    html.find(".weapon-equipped").on("change", ev => {
      const el = ev.currentTarget;
      const itemId = el.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.equipped": el.checked });
    });
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
