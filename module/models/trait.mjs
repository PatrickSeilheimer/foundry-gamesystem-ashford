import AshfordItemBase from "./base-item.mjs";

const { BooleanField, StringField } = foundry.data.fields;

/**
 * A Stärke (+1 Würfel) or Schwäche (-1 Würfel) — the core building block of
 * the Ashford dice pool. Can be carried permanently by a character (e.g. a
 * background trait like "Scharfschütze") or kept in the Kompendium to be
 * applied situationally during a roll.
 */
export default class AshfordTrait extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      kind: new StringField({
        required: true,
        initial: "strength",
        choices: ["strength", "weakness"]
      }),
      permanent: new BooleanField({ required: true, initial: true })
    };
  }

  /** +1 for a Stärke, -1 for a Schwäche — the value fed into the dice pool. */
  get poolModifier() {
    return this.kind === "strength" ? 1 : -1;
  }
}
