import AshfordItemBase from "./base-item.mjs";
import { WEAPON_TALENT_KEYS, RANGED_WEAPON_TALENT_KEYS } from "../rules/talents.mjs";
import { CONDITION_CATEGORIES, CONDITION_SEVERITIES } from "../rules/conditions.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * The 6 wearable/holdable equipment slots. "hands" is shared between a held weapon and
 * hand-worn armor (gloves) — a survivor only has one free pair of hands (Abschnitt Ausrüstung).
 */
export const EQUIP_SLOTS = ["head", "chest", "arms", "legs", "feet", "hands"];

/** The 4 fully separate damage types armor protects against. */
export const ARMOR_TYPES = ["ballistic", "pierce", "blunt", "slash"];

/** Free-item categories used for inventory search/filter (weapon/armor already imply their own category via item.type). */
export const ITEM_CATEGORIES = ["medizin", "nahrung", "munition", "werkzeug", "material", "sonstiges"];

export const ITEM_CATEGORY_LABELS = {
  medizin: "Medizin",
  nahrung: "Nahrung",
  munition: "Munition",
  werkzeug: "Werkzeug",
  material: "Material",
  sonstiges: "Sonstiges"
};

class AshfordPhysicalItem extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      quantity: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      weight: new NumberField({ required: true, initial: 0, min: 0 })
    };
  }
}

export class AshfordWeapon extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Fest zugeordnetes Waffentalent (Abschnitt 6): keine Wahl zwischen zwei Skills für dieselbe Waffe.
      weaponSkill: new StringField({ required: false, blank: true, choices: WEAPON_TALENT_KEYS }),
      baseDamage: new NumberField({ required: true, integer: true, initial: 1, min: 0 }), // Waffenbasisschaden (Abschnitt 4a)
      equipped: new BooleanField({ required: true, initial: false }), // geführte Waffe belegt den "hands"-Slot
      ammo: new StringField({ required: false, blank: true })
    };
  }

  /** True for the 4 Fernkampf-Waffentalente (Pistolen/Gewehre/Schrotflinten/Bögen) — has a range-band table. */
  get isRanged() {
    return RANGED_WEAPON_TALENT_KEYS.includes(this.weaponSkill);
  }
}

export class AshfordArmor extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Vier vollständig getrennte Rüstungswerte statt eines einzelnen Schutzwerts.
      armor: new SchemaField({
        ballistic: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        pierce: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        blunt: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
        slash: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
      }),
      slot: new StringField({ required: false, blank: true, choices: EQUIP_SLOTS }),
      equipped: new BooleanField({ required: true, initial: false })
    };
  }
}

export class AshfordEquipment extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: new StringField({ required: false, blank: true, initial: "sonstiges", choices: ITEM_CATEGORIES })
    };
  }
}

export class AshfordConsumable extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: new StringField({ required: false, blank: true, initial: "sonstiges", choices: ITEM_CATEGORIES }),
      usesRemaining: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      // z.B. "Essen", "Trinken", "Anwenden" statt des generischen "Benutzen" — beschriftet den Aktions-Button im Rucksack.
      actionLabel: new StringField({ required: false, blank: true, initial: "Benutzen" })
    };
  }
}

/**
 * An active (or archived) status condition on an actor. Can be seeded from the
 * module/rules/conditions.mjs catalog (via `conditionKey`) or created as a GM homebrew
 * one-off (blank `conditionKey`). Mechanical effects are intentionally shallow — see the
 * doc comment in conditions.mjs for why "note"-mode effects stay descriptive-only.
 */
export class AshfordCondition extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      conditionKey: new StringField({ required: false, blank: true }), // Katalog-Schlüssel, leer = Homebrew
      category: new StringField({
        required: false,
        blank: true,
        initial: "sonstiges",
        choices: CONDITION_CATEGORIES.map(c => c.key)
      }),
      severity: new StringField({ required: false, blank: true, initial: "gering", choices: CONDITION_SEVERITIES }),
      active: new BooleanField({ required: true, initial: true }), // false = beendet/archiviert, aber nicht gelöscht
      source: new StringField({ required: false, blank: true }), // z.B. "Zombie-Biss", "Sturz von der Mauer"
      note: new StringField({ required: false, blank: true }),
      duration: new SchemaField({
        type: new StringField({
          required: true,
          initial: "permanent",
          choices: ["permanent", "rounds", "minutes", "hours", "days", "event"]
        }),
        value: new NumberField({ required: false, integer: true, min: 0 }),
        eventLabel: new StringField({ required: false, blank: true })
      }),
      effects: new ArrayField(
        new SchemaField({
          mode: new StringField({ required: true, initial: "note", choices: ["talentMod", "derivedMod", "note"] }),
          // talentMod: Talent-Key (module/rules/talents.mjs). derivedMod: "ausweichen"|"initiativeMod"|"nahkampfschaden"|"healthMax".
          key: new StringField({ required: false, blank: true }),
          value: new NumberField({ required: false, integer: true, initial: 0 }),
          label: new StringField({ required: false, blank: true })
        }),
        { required: false }
      )
    };
  }
}
