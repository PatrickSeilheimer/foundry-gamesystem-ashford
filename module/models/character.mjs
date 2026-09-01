import AshfordActorBase from "./base-actor.mjs";
import { POINTS_BUDGET } from "../rules/talents.mjs";
import { deriveCombatStats } from "../rules/derived.mjs";
import { ARMOR_TYPES } from "./gear.mjs";

const { HTMLField, NumberField, StringField } = foundry.data.fields;

/** Valid values for `AshfordCharacter#gender` — matches the choice set already used on NPCs (module/models/npc.mjs). */
export const GENDERS = ["m", "w", "d"];

/** Derived-stat keys a condition's "derivedMod" effect is allowed to target — see module/rules/conditions.mjs. */
export const CONDITION_DERIVED_KEYS = ["ausweichen", "initiativeMod", "nahkampfschaden", "healthMax"];

/**
 * Player character. Ashford Adventures has no attributes and no leveling —
 * a character is exactly the 20-talent list from module/rules/talents.mjs
 * (embedded as "talent" Items) plus a one-time build-point budget spent on
 * Stärken/Schwächen (ashford_system_spezifikation.md, Abschnitt 4). This
 * model only tracks the budget itself and the derived combat stats that
 * Kraft/Athletik feed (Abschnitt 4a); the talents themselves live on the
 * embedded Items, and `bonusPoints` lets a GM hand out extra build points
 * (e.g. a story milestone) without changing the base budget everyone starts with.
 */
export default class AshfordCharacter extends AshfordActorBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      bonusPoints: new NumberField({ required: true, integer: true, initial: 0 }),
      // Survivor-Dossier (Tab "Charakter") — reine Beschreibung, ohne Einfluss auf abgeleitete Werte.
      concept: new StringField({ required: false, blank: true }), // Beruf vor der Apokalypse
      personality: new StringField({ required: false, blank: true }),
      motivation: new StringField({ required: false, blank: true }),
      origin: new StringField({ required: false, blank: true }), // Herkunft
      appearance: new StringField({ required: false, blank: true }), // Äußere Merkmale
      relationships: new HTMLField({ required: false, blank: true }), // Beziehungen / wichtige Personen
      notes: new HTMLField({ required: false, blank: true }),
      // Kompakte Eckdaten (Bogen-Kopf).
      age: new NumberField({ required: false, integer: true, min: 0 }),
      gender: new StringField({ required: false, blank: true, choices: GENDERS }),
      height: new NumberField({ required: false, integer: true, min: 0 }), // cm
      weight: new NumberField({ required: false, integer: true, min: 0 }) // kg
    };
  }

  /** @override */
  prepareDerivedData() {
    const items = this.parent?.items ?? [];
    const talents = items.filter(i => i.type === "talent");

    let pointsSpent = 0;
    for (const t of talents) pointsSpent -= t.system.pointDelta;
    this.pointsBudget = POINTS_BUDGET + this.bonusPoints;
    this.pointsRemaining = this.pointsBudget - pointsSpent;

    const kraft = talents.find(t => t.system.talentKey === "kraft");
    const athletik = talents.find(t => t.system.talentKey === "athletik");
    const kraftMod = kraft ? kraft.system.staerken - kraft.system.schwaechen : 0;
    const athletikMod = athletik ? athletik.system.staerken - athletik.system.schwaechen : 0;

    const meleeWeapon = items.find(
      i => i.type === "weapon" && i.system.equipped && i.system.weaponSkill && !i.system.isRanged
    );
    const waffenBasisschaden = meleeWeapon?.system.baseDamage ?? 0;

    this.derived = deriveCombatStats({ kraftMod, athletikMod, waffenBasisschaden });
    this.derived.kraftMod = kraftMod;
    this.derived.athletikMod = athletikMod;

    // Rüstung: vier vollständig getrennte Werte, aufsummiert über alle angelegten Rüstungsteile.
    this.armor = Object.fromEntries(ARMOR_TYPES.map(type => [type, 0]));
    for (const item of items) {
      if (item.type !== "armor" || !item.system.equipped) continue;
      for (const type of ARMOR_TYPES) this.armor[type] += item.system.armor[type] ?? 0;
    }

    // Aktive Zustände können Ausweichen/Initiative/Nahkampfschaden/max. Gesundheit direkt verschieben
    // (module/rules/conditions.mjs); Talent-Boni/-Mali werden stattdessen situativ beim Würfeln
    // eingerechnet (module/apps/roll-dialog.mjs), weil sie nur für die betroffenen Talente gelten.
    let healthMaxMod = 0;
    for (const condition of this.activeConditions) {
      for (const effect of condition.system.effects ?? []) {
        if (effect.mode !== "derivedMod") continue;
        if (effect.key === "healthMax") healthMaxMod += effect.value ?? 0;
        else if (CONDITION_DERIVED_KEYS.includes(effect.key) && effect.key in this.derived) {
          this.derived[effect.key] += effect.value ?? 0;
        }
      }
    }

    // HP-Maximum ist grundsätzlich fest aus Kraft abgeleitet (Abschnitt 4a); Zustände wie
    // "Infiziert" können es zusätzlich absenken. Editierbar ist nur der aktuelle Wert.
    this.resources.health.max = Math.max(1, this.derived.hp + healthMaxMod);

    super.prepareDerivedData();
  }
}
