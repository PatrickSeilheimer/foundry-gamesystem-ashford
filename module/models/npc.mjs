import AshfordActorBase from "./base-actor.mjs";

const { ArrayField, BooleanField, HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * NPCs double as Kodex entries: the same Actor that a GM can drop on a scene
 * also carries the write-up (role, facts, story) that players see when they
 * browse the Ashford Kodex. Keeping it one document instead of splitting
 * "game stats" and "lore text" across two documents means there's only ever
 * one place to update an NPC.
 */
export default class AshfordNpc extends AshfordActorBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      role: new StringField({ required: false, blank: true }), // z.B. "Chef der Verteidigung"
      buildingId: new StringField({ required: false, blank: true }), // Slug einer Eintrags-ID im codex-buildings Pack
      note: new HTMLField({ required: false, blank: true }), // z.B. "Kein festes Gebäude" statt einer Zuordnung
      facts: new ArrayField(
        new SchemaField({
          label: new StringField({ required: true, blank: false }),
          value: new HTMLField({ required: true, blank: true })
        }),
        { required: false }
      ),
      story: new HTMLField({ required: false, blank: true }),
      isCodexEntry: new BooleanField({ required: true, initial: true }),
      initials: new StringField({ required: false, blank: true }), // Fallback, falls das Portrait mal fehlt
      meta: new SchemaField({
        gender: new StringField({ required: false, blank: true, choices: ["m", "w", "d"] }),
        age: new NumberField({ required: false, integer: true, min: 0 }),
        relationship: new StringField({ required: false, blank: true }),
        workplace: new StringField({ required: false, blank: true }),
        nationality: new StringField({ required: false, blank: true })
      })
    };
  }
}
