const { HTMLField, NumberField, SchemaField } = foundry.data.fields;

/**
 * Common schema shared by every Actor type in Ashford: a resource pool for
 * health and infection (the central survival-horror pressure gauge) plus a
 * free-text biography.
 */
export default class AshfordActorBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      biography: new HTMLField({ required: false, blank: true }),
      resources: new SchemaField({
        health: new SchemaField({
          value: new NumberField({ required: true, integer: true, initial: 10, min: 0 }),
          max: new NumberField({ required: true, integer: true, initial: 10, min: 0 })
        }),
        infection: new SchemaField({
          value: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
          max: new NumberField({ required: true, integer: true, initial: 10, min: 0 })
        })
      }),
      dice: new SchemaField({
        basePool: new NumberField({ required: true, integer: true, initial: 3, min: 0 })
      })
    };
  }

  /** @override */
  prepareDerivedData() {
    const res = this.resources;
    res.health.value = Math.clamp(res.health.value, 0, res.health.max);
    res.infection.value = Math.clamp(res.infection.value, 0, res.infection.max);
  }

  /**
   * Permanent Stärken/Schwächen this actor carries around at all times,
   * derived from embedded Items of type "trait".
   * @returns {{strengths: Item[], weaknesses: Item[]}}
   */
  get permanentTraits() {
    const items = this.parent?.items ?? [];
    const traits = items.filter(i => i.type === "trait" && i.system.permanent);
    return {
      strengths: traits.filter(i => i.system.kind === "strength"),
      weaknesses: traits.filter(i => i.system.kind === "weakness")
    };
  }
}
