import AshfordActorBase from "./base-actor.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

/** Zombies, wildlife, and other threats. */
export default class AshfordCreature extends AshfordActorBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      tier: new StringField({ required: false, blank: true }), // z.B. "Streuner", "Horde", "Mutation"
      attackPool: new NumberField({ required: true, integer: true, initial: 3, min: 0 }),
      infectious: new BooleanField({ required: true, initial: true })
    };
  }
}
