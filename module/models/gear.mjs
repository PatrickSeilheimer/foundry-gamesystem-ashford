import AshfordItemBase from "./base-item.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

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
      damageDice: new NumberField({ required: true, integer: true, initial: 1, min: 0 }),
      grantsStrength: new BooleanField({ required: true, initial: false }), // z.B. ein gutes Werkzeug/Waffe
      ammo: new StringField({ required: false, blank: true })
    };
  }
}

export class AshfordArmor extends AshfordPhysicalItem {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      protection: new NumberField({ required: true, integer: true, initial: 0, min: 0 })
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
