import AshfordItemBase from "./base-item.mjs";
import { WEAPON_TALENT_KEYS, RANGED_WEAPON_TALENT_KEYS } from "../rules/talents.mjs";
import { CONDITION_CATEGORIES, CONDITION_SEVERITIES } from "../rules/conditions.mjs";

const { ArrayField, BooleanField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * The 5 wearable body-equipment slots. Weapons are equipped independently of these (a held
 * weapon does NOT compete with the "hands" slot — that's for gloves; you can wear gloves and
 * hold a weapon at the same time).
 */
export const EQUIP_SLOTS = ["head", "chest", "hands", "legs", "feet"];

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
      // Absoluter Würfelausdruck (Foundry-Syntax, z.B. "2d6+7") — kein einzelner fester Wert mehr.
      // Bei Nahkampfwaffen kommt beim tatsächlichen Schadenswurf zusätzlich der charaktereigene
      // Nahkampfschaden-Bonus obendrauf (AshfordActor#rollWeaponDamage), bei Fernkampfwaffen nicht.
      damageFormula: new StringField({ required: true, blank: true, initial: "1d6" }),
      // Treffer-Bonus/-Malus dieser konkreten Waffe, zusätzlich zu Reichweitenklassen-Modifikatoren bei Fernkampfwaffen.
      accuracyBonus: new NumberField({ required: true, integer: true, initial: 0 }),
      // Manche Waffen sind schneller/langsamer zu führen als der reine Athletik-Wert.
      initiativeMod: new NumberField({ required: true, integer: true, initial: 0 }),
      equipped: new BooleanField({ required: true, initial: false }), // unabhängig von den 5 Körper-Slots
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
      equipped: new BooleanField({ required: true, initial: false }),
      // Manche Ausrüstung bremst oder beschleunigt (z.B. schwere Panzerung vs. leichte Schuhe).
      initiativeMod: new NumberField({ required: true, integer: true, initial: 0 }),
      // Flacher Bonus auf den Nahkampfschaden-Wert (z.B. Schlagring) — kommt additiv zum Kraft-Bonus dazu.
      meleeDamageBonus: new NumberField({ required: true, integer: true, initial: 0 }),
      // Flacher Bonus/Malus aufs ERGEBNIS eines Talentwurfs (nicht auf den Würfelpool!) — angelegte
      // Ausrüstung addiert sich auf die Würfelsumme, statt zusätzliche Würfel zu geben.
      talentBonuses: new ArrayField(
        new SchemaField({
          talentKey: new StringField({ required: false, blank: true }),
          value: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        { required: false }
      )
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
      actionLabel: new StringField({ required: false, blank: true, initial: "Benutzen" }),
      // Combi-Item (z.B. Erste-Hilfe-Kasten): beim Benutzen werden diese Einträge als neue
      // Consumables im Inventar des Nutzers erzeugt, und DIESES Item wird komplett gelöscht statt
      // nur runtergezählt (siehe AshfordItem#useConsumable). Leer = normales Einzel-Item.
      comboItems: new ArrayField(
        new SchemaField({
          name: new StringField({ required: true, blank: false }),
          quantity: new NumberField({ required: true, integer: true, initial: 1, min: 1 })
        }),
        { required: false }
      ),
      // Verschiebt beim Benutzen den (für Spieler unsichtbaren) Infektionswert direkt — z.B. Antimykotikum/
      // Desinfektionsmittel setzen ihn mit einem großen negativen Wert auf 0 (geclamped in base-actor.mjs),
      // ohne dass der Spielleiter eingreifen muss. 0 = kein Effekt (Normalfall für alle anderen Items).
      infectionDelta: new NumberField({ required: true, integer: true, initial: 0 })
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
