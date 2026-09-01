import AshfordActorBase from "./base-actor.mjs";
import { POINTS_BUDGET } from "../rules/talents.mjs";
import { deriveCombatStats } from "../rules/derived.mjs";

const { NumberField, StringField } = foundry.data.fields;

/** Valid values for `AshfordCharacter#gender` — matches the choice set already used on NPCs (module/models/npc.mjs). */
export const GENDERS = ["m", "w", "d"];

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
      concept: new StringField({ required: false, blank: true }), // "Beruf vor dem Fall", Kurzbeschreibung etc.
      notes: new StringField({ required: false, blank: true }),
      // Kompakte Eckdaten (Bogen-Kopf) — reine Beschreibung, ohne Einfluss auf abgeleitete Werte.
      age: new NumberField({ required: false, integer: true, min: 0 }),
      gender: new StringField({ required: false, blank: true, choices: GENDERS }),
      height: new NumberField({ required: false, integer: true, min: 0 }), // cm
      weight: new NumberField({ required: false, integer: true, min: 0 }) // kg
    };
  }

  /** @override */
  prepareDerivedData() {
    const talents = this.parent?.items?.filter(i => i.type === "talent") ?? [];

    let pointsSpent = 0;
    for (const t of talents) pointsSpent -= t.system.pointDelta;
    this.pointsBudget = POINTS_BUDGET + this.bonusPoints;
    this.pointsRemaining = this.pointsBudget - pointsSpent;

    const kraft = talents.find(t => t.system.talentKey === "kraft");
    const athletik = talents.find(t => t.system.talentKey === "athletik");
    const kraftMod = kraft ? kraft.system.staerken - kraft.system.schwaechen : 0;
    const athletikMod = athletik ? athletik.system.staerken - athletik.system.schwaechen : 0;

    const meleeWeapon = (this.parent?.items ?? []).find(
      i => i.type === "weapon" && i.system.equipped && i.system.weaponSkill && !i.system.isRanged
    );
    const waffenBasisschaden = meleeWeapon?.system.baseDamage ?? 0;

    this.derived = deriveCombatStats({ kraftMod, athletikMod, waffenBasisschaden });
    this.derived.kraftMod = kraftMod;
    this.derived.athletikMod = athletikMod;

    // HP ist ein fester abgeleiteter Wert (Abschnitt 4a) — das Maximum wird nicht frei editiert.
    this.resources.health.max = this.derived.hp;

    super.prepareDerivedData();
  }
}
