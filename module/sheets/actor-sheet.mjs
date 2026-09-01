import { ARMOR_SLOTS } from "../models/gear.mjs";

const ARMOR_SLOT_ICONS = {
  head: "fas fa-hard-hat",
  chest: "fas fa-shirt",
  hands: "fas fa-hand-paper",
  legs: "fas fa-socks",
  feet: "fas fa-shoe-prints"
};

export default class AshfordActorSheet extends ActorSheet {
  /** UI-only toggle for the character sheet: gates the "Leveln" fields (base data, talent points) behind an explicit edit mode. Resets to closed on every re-open. */
  _editMode = false;

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
    context.editMode = this._editMode;
    context.traits = this.actor.items.filter(i => i.type === "trait");
    const gear = this.actor.items.filter(i => !["trait", "talent"].includes(i.type));
    context.gear = gear;

    const talents = this.actor.items.filter(i => i.type === "talent");
    context.talentTiers = [1, 2, 3].map(stufe => ({
      stufe,
      talents: talents
        .filter(t => t.system.stufe === stufe)
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
    }));
    context.hasTalents = talents.length > 0;

    // Ausrüstungsslots (Kopf/Brust/Hand/Bein/Fuß + Waffen) — alles andere landet im Rucksack.
    const equippedWeapons = gear.filter(i => i.type === "weapon" && i.system.equipped);
    context.armorSlots = ARMOR_SLOTS.map(slot => ({
      key: slot,
      label: game.i18n.localize(`ASHFORD.Sheet.slot${slot.charAt(0).toUpperCase()}${slot.slice(1)}`),
      icon: ARMOR_SLOT_ICONS[slot],
      item: gear.find(i => i.type === "armor" && i.system.equipped && i.system.slot === slot) ?? null
    }));
    context.equippedWeapons = equippedWeapons;
    const slottedIds = new Set([
      ...context.armorSlots.filter(s => s.item).map(s => s.item.id),
      ...equippedWeapons.map(i => i.id)
    ]);
    context.backpack = gear.filter(i => !slottedIds.has(i.id));

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ashford-toggle-edit").on("click", () => {
      this._editMode = !this._editMode;
      this.render();
    });
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
    html.find(".armor-equipped").on("change", ev => {
      const el = ev.currentTarget;
      const itemId = el.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.equipped": el.checked });
    });
    html.find(".armor-slot-select").on("change", ev => {
      const el = ev.currentTarget;
      const itemId = el.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.slot": el.value });
    });
    html.find(".slot-unequip").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.equipped": false });
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
