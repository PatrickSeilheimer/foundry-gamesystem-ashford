import { TALENTS, WEAPON_TALENT_KEYS } from "../rules/talents.mjs";

export default class AshfordItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ashford", "sheet", "item"],
      width: 480,
      height: 480,
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
    return context;
  }
}
