import { TALENTS, WEAPON_TALENT_KEYS } from "../rules/talents.mjs";
import { EQUIP_SLOTS, ITEM_CATEGORIES, ITEM_CATEGORY_LABELS } from "../models/gear.mjs";
import { CONDITION_CATEGORIES, CONDITION_SEVERITIES, CONDITION_DURATION_TYPES } from "../rules/conditions.mjs";

export default class AshfordItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ashford", "sheet", "item"],
      width: 480,
      height: 520,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
  }

  /** @override */
  get template() {
    return "systems/ashford/templates/item/item-sheet.hbs";
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    context.system = this.item.system;
    context.isCanonicalTalent = this.item.type === "talent" && !!this.item.system.talentKey;
    if (this.item.type === "talent") {
      context.diceCount = this.item.system.diceCount;
      context.pointDelta = this.item.system.pointDelta;
    }
    context.weaponSkillOptions = WEAPON_TALENT_KEYS.map(key => ({
      key,
      name: TALENTS.find(t => t.key === key)?.name ?? key
    }));
    context.equipSlotOptions = EQUIP_SLOTS.map(key => ({
      key,
      name: game.i18n.localize(`ASHFORD.Sheet.slot${key.charAt(0).toUpperCase()}${key.slice(1)}`)
    }));
    context.itemCategoryOptions = ITEM_CATEGORIES.map(key => ({ key, name: ITEM_CATEGORY_LABELS[key] ?? key }));
    context.conditionCategories = CONDITION_CATEGORIES;
    context.conditionSeverities = CONDITION_SEVERITIES;
    context.conditionDurationTypes = CONDITION_DURATION_TYPES;
    context.talentOptions = TALENTS.map(t => ({ key: t.key, name: t.name }));
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ashford-effect-add").on("click", () => {
      const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
      effects.push({ mode: "note", key: "", value: 0, label: "" });
      this.item.update({ "system.effects": effects });
    });
    html.find(".ashford-effect-remove").on("click", ev => {
      const index = Number(ev.currentTarget.dataset.index);
      const effects = foundry.utils.deepClone(this.item.system.effects ?? []);
      effects.splice(index, 1);
      this.item.update({ "system.effects": effects });
    });
    html.find(".ashford-talentbonus-add").on("click", () => {
      const talentBonuses = foundry.utils.deepClone(this.item.system.talentBonuses ?? []);
      talentBonuses.push({ talentKey: "", value: 1 });
      this.item.update({ "system.talentBonuses": talentBonuses });
    });
    html.find(".ashford-talentbonus-remove").on("click", ev => {
      const index = Number(ev.currentTarget.dataset.index);
      const talentBonuses = foundry.utils.deepClone(this.item.system.talentBonuses ?? []);
      talentBonuses.splice(index, 1);
      this.item.update({ "system.talentBonuses": talentBonuses });
    });
    html.find(".ashford-combo-add").on("click", () => {
      const comboItems = foundry.utils.deepClone(this.item.system.comboItems ?? []);
      comboItems.push({ name: "", quantity: 1 });
      this.item.update({ "system.comboItems": comboItems });
    });
    html.find(".ashford-combo-remove").on("click", ev => {
      const index = Number(ev.currentTarget.dataset.index);
      const comboItems = foundry.utils.deepClone(this.item.system.comboItems ?? []);
      comboItems.splice(index, 1);
      this.item.update({ "system.comboItems": comboItems });
    });
  }
}
