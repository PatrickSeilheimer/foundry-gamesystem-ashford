import AshfordItemBase from "./base-item.mjs";
import { WEAPON_TALENT_KEYS, RANGED_WEAPON_TALENT_KEYS } from "../rules/talents.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

/** The 5 wearable armor slots (Kopf, Brust, Hand, Bein, Fuß) — weapons are equipped separately via `AshfordWeapon#equipped`. */
export const ARMOR_SLOTS = ["head", "chest", "hands", "legs", "feet"];

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
      equipped: new BooleanField({ required: true, initial: false }), // geführte Nahkampfwaffe speist Nahkampfschaden
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
      protection: new NumberField({ required: true, integer: true, initial: 0, min: 0 }),
      slot: new StringField({ required: false, blank: true, choices: ARMOR_SLOTS }),
      equipped: new BooleanField({ required: true, initial: false })
    };
  }
}

export class AshfordEquipment extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema()
    };
  }
}

export class AshfordConsumable extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      usesRemaining: new NumberField({ required: true, integer: true, initial: 1, min: 0 })
    };
  }
}

export class AshfordCondition extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      grantsWeakness: new BooleanField({ required: true, initial: true }),
      duration: new StringField({ required: false, blank: true }) // z.B. "bis geheilt", "1 Szene"
    };
  }
}
