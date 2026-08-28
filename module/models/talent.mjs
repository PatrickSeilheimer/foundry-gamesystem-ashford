import AshfordItemBase from "./base-item.mjs";

const { ArrayField, HTMLField, NumberField, StringField } = foundry.data.fields;

/**
 * Talent skeleton for the leveling system. The concrete talent tree/list for
 * Ashford Adventures hasn't been designed yet — this schema only fixes the
 * shape (category, cost, prerequisites, effect text) so the sheet and future
 * automation have something to build on without prescribing the numbers.
 */
export default class AshfordTalent extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: new StringField({ required: false, blank: true }), // z.B. "Kampf", "Überleben", "Sozial", "Handwerk"
      tier: new NumberField({ required: true, integer: true, initial: 1, min: 1 }),
      cost: new NumberField({ required: true, integer: true, initial: 1, min: 0 }), // in Talentpunkten
      prerequisites: new ArrayField(new StringField({ required: true, blank: false }), { required: false }),
      effect: new HTMLField({ required: false, blank: true })
    };
  }
}
