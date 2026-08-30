import AshfordItemBase from "./base-item.mjs";
import { diceCountForTalent, pointDeltaForTalent } from "../rules/talents.mjs";

const { BooleanField, NumberField, StringField } = foundry.data.fields;

/**
 * A talent — the only kind of "stat" a character has (ashford_system_spezifikation.md,
 * Abschnitt 1). Stufe fixes the point-cost multiplier (Abschnitt 4); Stärken/Schwächen
 * are the character-build choice and directly determine both the dice pool
 * (Abschnitt 2) and the point cost (Abschnitt 4). `talentKey` ties a talent to
 * one of the 19 canonical entries in module/rules/talents.mjs so the sheet and
 * derived-stat calculations (Kraft/Athletik, Waffentalente) can recognize it;
 * leave it blank for a GM homebrew talent outside the closed list.
 */
export default class AshfordTalent extends AshfordItemBase {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      talentKey: new StringField({ required: false, blank: true }),
      stufe: new NumberField({ required: true, integer: true, initial: 1, min: 1, max: 3 }),
      staerken: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 3 }),
      schwaechen: new NumberField({ required: true, integer: true, initial: 0, min: 0, max: 2 }),
      waffentalent: new BooleanField({ required: true, initial: false }),
      // "fernkampf" | "nahkampf_schlag" | "nahkampf_hieb" | "nahkampf_stich" | "nahkampf_unbewaffnet"
      kategorie: new StringField({ required: false, blank: true })
    };
  }

  /** Würfelzahl für dieses Talent, ohne situative Modifikatoren (Abschnitt 2.1). */
  get diceCount() {
    return diceCountForTalent(this.staerken, this.schwaechen);
  }

  /** Punkte-Delta dieses Talents ins Baupunkte-Budget (Abschnitt 4): positiv = Rückerstattung, negativ = Kosten. */
  get pointDelta() {
    return pointDeltaForTalent(this);
  }
}
