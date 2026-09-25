import AshfordActorBase from "./base-actor.mjs";
import { deriveCombatStats } from "../rules/derived.mjs";
import { ARMOR_TYPES } from "./gear.mjs";

const { BooleanField, HTMLField, NumberField, SchemaField, StringField } = foundry.data.fields;

/**
 * Zombies, wildlife, and other threats. Reuses the exact same Kraft/Athletik-driven combat-stat
 * formulas as AshfordCharacter (module/rules/derived.mjs) — Kraft and Athletik feed Initiative,
 * Ausweichen and Nahkampfschaden exactly like on a PC, and the attack die pool comes from an
 * embedded "Waffenloser Kampf" Talent item + a "natürliche Waffe" weapon item, the same way a PC's
 * weapon attack/damage works. UNLIKE AshfordCharacter, creatures do NOT spend the 10-point build
 * budget (they're NSCs, not PCs) and health.max is NOT auto-derived from Kraft — several NSC
 * archetypes (Zombie-Statblock-Dokument: Newbie/Runner/Screamer) deliberately sit below the PC HP
 * formula's floor, so max HP stays a plain, freely-editable field instead.
 */
export default class AshfordCreature extends AshfordActorBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      tier: new StringField({ required: false, blank: true }), // z.B. "Streuner", "Horde", "Mutation"
      attackPool: new NumberField({ required: true, integer: true, initial: 3, min: 0 }),
      infectious: new BooleanField({ required: true, initial: true }),
      // Freitext für eine einzelne, namentliche Sondermechanik (z.B. "Sporenplatzer", "Getrieben vom
      // Hunger") — bewusst nur beschreibend, keine automatisierte Trigger-Logik (gleiche Tiefe wie
      // module/rules/conditions.mjs: Effekte mit Proben/Zeitfenstern löst der Spielleiter manuell auf).
      specialAbility: new SchemaField({
        name: new StringField({ required: false, blank: true }),
        description: new HTMLField({ required: false, blank: true })
      })
    };
  }

  /** @override */
  prepareDerivedData() {
    const items = this.parent?.items ?? [];
    const talents = items.filter(i => i.type === "talent");

    const kraft = talents.find(t => t.system.talentKey === "kraft");
    const athletik = talents.find(t => t.system.talentKey === "athletik");
    const kraftMod = kraft ? kraft.system.staerken - kraft.system.schwaechen : 0;
    const athletikMod = athletik ? athletik.system.staerken - athletik.system.schwaechen : 0;

    this.derived = deriveCombatStats({ kraftMod, athletikMod });
    this.derived.kraftMod = kraftMod;
    this.derived.athletikMod = athletikMod;
    // this.derived.hp (PC-Formel) bleibt absichtlich ungenutzt -- siehe Klassenkommentar.

    // Rüstung: dieselbe Summe wie bei Charakteren, inkl. "angeborener" Panzerung ohne Körper-Slot
    // (z.B. Tanks "Wall aus totem Fleisch" als Rüstungs-Item mit blunt-Wert, immer equipped).
    this.armor = Object.fromEntries(ARMOR_TYPES.map(type => [type, 0]));
    let gearInitiativeMod = 0;
    let gearMeleeDamageBonus = 0;
    for (const item of items) {
      if (item.type === "armor" && item.system.equipped) {
        for (const type of ARMOR_TYPES) this.armor[type] += item.system.armor[type] ?? 0;
        gearInitiativeMod += item.system.initiativeMod ?? 0;
        gearMeleeDamageBonus += item.system.meleeDamageBonus ?? 0;
      } else if (item.type === "weapon" && item.system.equipped) {
        gearInitiativeMod += item.system.initiativeMod ?? 0;
      }
    }
    this.derived.initiativeMod += gearInitiativeMod;
    this.derived.nahkampfschaden += gearMeleeDamageBonus;

    super.prepareDerivedData();
  }
}
