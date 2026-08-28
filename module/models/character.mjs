import AshfordActorBase from "./base-actor.mjs";

const { NumberField, StringField } = foundry.data.fields;

/**
 * Player character. The leveling and talent system is intentionally minimal
 * for now (level / xp / talentPoints as raw counters) — the concrete rules
 * for how fast you level and what talents cost are still being designed for
 * Ashford Adventures. This gives the sheet and future automation something
 * stable to hook into without locking in numbers that will change.
 */
export default class AshfordCharacter extends AshfordActorBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      level: new NumberField({ required: true, integer: true, initial: 1, min: 1 }),
      xp: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      talentPoints: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      concept: new StringField({ required: false, blank: true }), // "Beruf vor dem Fall", Kurzbeschreibung etc.
      notes: new StringField({ required: false, blank: true })
    };
  }
}
