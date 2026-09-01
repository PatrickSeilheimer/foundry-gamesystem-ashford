/**
 * The closed, final talent list from ashford_system_spezifikation.md (Abschnitt 5).
 * There are no separate attributes in Ashford Adventures — a character is
 * exactly this list of 19 talents, each carrying its own Stärken (0-3) and
 * Schwächen (0-2). This module is plain data/logic with no Foundry
 * dependency so it can be imported both by the running system
 * (module/models, module/documents) and by the Node build script that
 * generates the "talents" compendium pack (scripts/generate-pack-sources.mjs).
 */

/**
 * @typedef {object} TalentDefinition
 * @property {string} key - stable slug, matches AshfordTalent#talentKey
 * @property {string} name
 * @property {1|2|3} stufe - cost multiplier (Abschnitt 4), NOT a factor in dice count
 * @property {boolean} [waffentalent] - true for the 8 Stufe-3 weapon talents (Abschnitt 5/6)
 * @property {"fernkampf"|"nahkampf_schlag"|"nahkampf_hieb"|"nahkampf_stich"|"nahkampf_unbewaffnet"} [kategorie]
 * @property {string[]} [speistWerte] - derived values this talent feeds (Abschnitt 4a)
 */

/**
 * Array order is the canonical display order used by the character sheet (Stufe 1: thematisch
 * gruppiert; Stufe 3: erst Nahkampf, dann Fernkampf) — see AshfordActorSheet's talent sort,
 * which looks up each embedded talent's position here via `talentOrderIndex`.
 * @type {TalentDefinition[]}
 */
export const TALENTS = [
  { key: "charme", name: "Charme", stufe: 1 },
  { key: "einschuechtern", name: "Einschüchtern", stufe: 1 },
  { key: "menschenkenntnis", name: "Menschenkenntnis", stufe: 1 },
  { key: "luegen", name: "Lügen", stufe: 1 },
  { key: "medizin", name: "Medizin", stufe: 1 },
  { key: "natur", name: "Natur", stufe: 1 },
  { key: "technik", name: "Technik", stufe: 1 },
  { key: "kraft", name: "Kraft", stufe: 2, speistWerte: ["hp", "nahkampfschaden"] },
  { key: "athletik", name: "Athletik", stufe: 2, speistWerte: ["initiative", "ausweichen"] },
  { key: "werfen", name: "Werfen", stufe: 2 },
  { key: "heimlichkeit", name: "Heimlichkeit", stufe: 2 },
  { key: "wahrnehmung", name: "Wahrnehmung", stufe: 2 },
  { key: "waffenloserkampf", name: "Waffenloser Kampf", stufe: 3, waffentalent: true, kategorie: "nahkampf_unbewaffnet" },
  { key: "hiebwaffen", name: "Hiebwaffen", stufe: 3, waffentalent: true, kategorie: "nahkampf_hieb" },
  { key: "stichwaffen", name: "Stichwaffen", stufe: 3, waffentalent: true, kategorie: "nahkampf_stich" },
  { key: "schlagwaffen", name: "Schlagwaffen", stufe: 3, waffentalent: true, kategorie: "nahkampf_schlag" },
  { key: "pistolen", name: "Pistolen", stufe: 3, waffentalent: true, kategorie: "fernkampf" },
  { key: "gewehre", name: "Gewehre", stufe: 3, waffentalent: true, kategorie: "fernkampf" },
  { key: "schrotflinten", name: "Schrotflinten", stufe: 3, waffentalent: true, kategorie: "fernkampf" },
  { key: "boegen", name: "Bögen", stufe: 3, waffentalent: true, kategorie: "fernkampf" }
];

/** talentKey → position in TALENTS, for sorting embedded talent Items into the canonical display order. */
const TALENT_ORDER_INDEX = new Map(TALENTS.map((t, i) => [t.key, i]));

/** Sort index for a talentKey; homebrew talents without one sort after all canonical talents. */
export function talentOrderIndex(key) {
  return TALENT_ORDER_INDEX.get(key) ?? Number.MAX_SAFE_INTEGER;
}

/** Keys of the 8 Waffentalente, in list order — also the valid `weaponSkill` values for AshfordWeapon. */
export const WEAPON_TALENT_KEYS = TALENTS.filter(t => t.waffentalent).map(t => t.key);

/** Keys of the 4 ranged Waffentalente (Abschnitt 6a) — the ones with a range-band table. */
export const RANGED_WEAPON_TALENT_KEYS = TALENTS.filter(t => t.kategorie === "fernkampf").map(t => t.key);

/** Base character build-point budget (Abschnitt 4/8.1). */
export const POINTS_BUDGET = 10;

export function talentByKey(key) {
  return TALENTS.find(t => t.key === key) ?? null;
}

/**
 * Würfelzahl = 3 + Stärken − Schwächen (Abschnitt 2.1). Stufe does NOT factor
 * into the dice count, only into the point cost (pointDeltaForTalent below).
 * Clamped to a minimum of 1 defensively; with the schema's own 0-3/0-2 limits
 * the result is already always between 1 and 6.
 */
export function diceCountForTalent(staerken = 0, schwaechen = 0) {
  return Math.max(1, 3 + (staerken ?? 0) - (schwaechen ?? 0));
}

/**
 * Point delta for a single talent's current Stärken/Schwächen (Abschnitt 4).
 * Positive = points gained back into the budget, negative = points spent.
 * Waffentalente refund only +1 per Schwäche instead of the full Stufe.
 * @param {{stufe:number, staerken?:number, schwaechen?:number, waffentalent?:boolean}} talent
 */
export function pointDeltaForTalent({ stufe, staerken = 0, schwaechen = 0, waffentalent = false }) {
  const kosten = (staerken ?? 0) * stufe;
  const rueckerstattung = waffentalent ? (schwaechen ?? 0) * 1 : (schwaechen ?? 0) * stufe;
  return rueckerstattung - kosten;
}
