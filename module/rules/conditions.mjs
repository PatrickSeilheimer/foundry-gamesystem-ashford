/**
 * Catalog of example Zustände (status conditions) for the Zombie-Apokalypse setting.
 * Plain data/logic, no Foundry dependency (same pattern as module/rules/talents.mjs) so it
 * can be shown in the condition picker and used to seed embedded "condition" Items.
 *
 * Mechanical automation is intentionally shallow: a condition can carry `effects` that are
 * either applied automatically (a flat "derivedMod" on Ausweichen/Initiative/Nahkampfschaden/
 * max. Gesundheit, applied in AshfordCharacter#prepareDerivedData; or a "talentMod" baked into
 * the dice pool when that talent is rolled, see module/apps/roll-dialog.mjs) or purely
 * descriptive ("note", e.g. a per-round bleed the GM applies by hand via the health popover —
 * there is no round/turn tracker in this system to hook an automatic tick into). Every
 * mechanical effect still carries a `label` so its origin stays visible in tooltips
 * instead of just silently shifting a number.
 */

/** @typedef {"gering"|"mittel"|"schwer"|"kritisch"} ConditionSeverity */
/** @typedef {"talentMod"|"derivedMod"|"note"} ConditionEffectMode */
/** @typedef {"permanent"|"rounds"|"minutes"|"hours"|"days"|"event"} ConditionDurationType */

export const CONDITION_CATEGORIES = [
  { key: "verletzungen", label: "Verletzungen" },
  { key: "krankheiten", label: "Krankheiten" },
  { key: "ueberleben", label: "Überleben" },
  { key: "psychisch", label: "Psychisch" },
  { key: "bewegung", label: "Bewegung" },
  { key: "kampf", label: "Kampf" },
  { key: "umwelt", label: "Umwelt" },
  { key: "sonstiges", label: "Sonstiges" }
];

export const CONDITION_SEVERITIES = ["gering", "mittel", "schwer", "kritisch"];

export const CONDITION_DURATION_TYPES = [
  { key: "permanent", label: "Permanent" },
  { key: "rounds", label: "Runden" },
  { key: "minutes", label: "Minuten" },
  { key: "hours", label: "Stunden" },
  { key: "days", label: "Tage" },
  { key: "event", label: "Bis Ereignis" }
];

/**
 * @typedef {object} ConditionDefinition
 * @property {string} key
 * @property {string} name
 * @property {string} icon - FontAwesome class, e.g. "fas fa-droplet"
 * @property {string} category - one of CONDITION_CATEGORIES
 * @property {ConditionSeverity} severity
 * @property {string} description
 * @property {{type: ConditionDurationType, value?: number, eventLabel?: string}} defaultDuration
 * @property {{mode: ConditionEffectMode, key?: string, value?: number, label: string}[]} effects
 */

/** @type {ConditionDefinition[]} */
export const CONDITIONS = [
  {
    key: "blutend", name: "Blutend", icon: "fas fa-droplet", category: "verletzungen", severity: "mittel",
    description: "Verliert am Ende der Runde 1 Gesundheit (vom Spielleiter manuell einzutragen).",
    defaultDuration: { type: "rounds", value: 2 },
    effects: [{ mode: "note", label: "-1 GES / Runde (manuell)" }]
  },
  {
    key: "verletzt", name: "Verletzt", icon: "fas fa-user-injured", category: "verletzungen", severity: "gering",
    description: "Schmerzhafte, aber nicht schwere Wunde.",
    defaultDuration: { type: "permanent" },
    effects: [{ mode: "derivedMod", key: "ausweichen", value: -1, label: "Ausweichen -1" }]
  },
  {
    key: "schwer_verletzt", name: "Schwer verletzt", icon: "fas fa-bone", category: "verletzungen", severity: "schwer",
    description: "Ernsthafte Verwundung, jede Bewegung schmerzt.",
    defaultDuration: { type: "permanent" },
    effects: [
      { mode: "derivedMod", key: "ausweichen", value: -2, label: "Ausweichen -2" },
      { mode: "derivedMod", key: "nahkampfschaden", value: -1, label: "Nahkampfschaden -1" }
    ]
  },
  {
    key: "erschoepft", name: "Erschöpft", icon: "fas fa-battery-quarter", category: "ueberleben", severity: "mittel",
    description: "Tage ohne echten Schlaf fordern ihren Tribut.",
    defaultDuration: { type: "hours", value: 4 },
    effects: [{ mode: "derivedMod", key: "initiativeMod", value: -1, label: "Initiative -1" }]
  },
  {
    key: "hungrig", name: "Hungrig", icon: "fas fa-utensils", category: "ueberleben", severity: "gering",
    description: "Der Magen knurrt. Noch keine mechanische Auswirkung, aber ein Warnzeichen.",
    defaultDuration: { type: "event", eventLabel: "bis gegessen" },
    effects: []
  },
  {
    key: "durstig", name: "Durstig", icon: "fas fa-glass-water", category: "ueberleben", severity: "gering",
    description: "Der Wasservorrat geht zur Neige.",
    defaultDuration: { type: "event", eventLabel: "bis getrunken" },
    effects: []
  },
  {
    key: "infiziert", name: "Infiziert", icon: "fas fa-biohazard", category: "krankheiten", severity: "schwer",
    description: "Eine Wunde hat sich entzündet oder Schlimmeres.",
    defaultDuration: { type: "event", eventLabel: "bis behandelt" },
    effects: [{ mode: "derivedMod", key: "healthMax", value: -5, label: "Max. Gesundheit -5" }]
  },
  {
    key: "fieber", name: "Fieber", icon: "fas fa-temperature-high", category: "krankheiten", severity: "mittel",
    description: "Hohes Fieber schwächt Konzentration und Reaktion.",
    defaultDuration: { type: "hours", value: 6 },
    effects: [{ mode: "derivedMod", key: "initiativeMod", value: -1, label: "Initiative -1" }]
  },
  {
    key: "vergiftet", name: "Vergiftet", icon: "fas fa-skull-crossbones", category: "krankheiten", severity: "schwer",
    description: "Gift im Blut schwächt Kraft und Zielsicherheit.",
    defaultDuration: { type: "hours", value: 2 },
    effects: [{ mode: "derivedMod", key: "nahkampfschaden", value: -1, label: "Nahkampfschaden -1" }]
  },
  {
    key: "benommen", name: "Benommen", icon: "fas fa-face-dizzy", category: "bewegung", severity: "mittel",
    description: "Die Welt dreht sich, Reaktionen sind verzögert.",
    defaultDuration: { type: "rounds", value: 1 },
    effects: [{ mode: "derivedMod", key: "ausweichen", value: -2, label: "Ausweichen -2" }]
  },
  {
    key: "betaeubt", name: "Betäubt", icon: "fas fa-bolt", category: "bewegung", severity: "kritisch",
    description: "Kann sich kaum koordiniert bewegen.",
    defaultDuration: { type: "rounds", value: 1 },
    effects: [{ mode: "derivedMod", key: "ausweichen", value: -4, label: "Ausweichen -4" }]
  },
  {
    key: "panisch", name: "Panisch", icon: "fas fa-triangle-exclamation", category: "psychisch", severity: "schwer",
    description: "Blanke Angst übernimmt die Kontrolle.",
    defaultDuration: { type: "rounds", value: 3 },
    effects: [{ mode: "note", label: "GM-Ermessen: riskante/irrationale Handlungen wahrscheinlicher" }]
  },
  {
    key: "veraengstigt", name: "Verängstigt", icon: "fas fa-ghost", category: "psychisch", severity: "gering",
    description: "Angespannt, aber noch handlungsfähig.",
    defaultDuration: { type: "minutes", value: 10 },
    effects: []
  },
  {
    key: "belastet", name: "Belastet", icon: "fas fa-weight-hanging", category: "bewegung", severity: "gering",
    description: "Zu viel Gepäck bremst jede Bewegung.",
    defaultDuration: { type: "permanent" },
    effects: [{ mode: "derivedMod", key: "initiativeMod", value: -1, label: "Initiative -1" }]
  },
  {
    key: "eingeschraenkt", name: "Eingeschränkt", icon: "fas fa-link", category: "bewegung", severity: "mittel",
    description: "Bewegungsfreiheit ist spürbar eingeschränkt (z.B. durch Gelände oder Verletzung).",
    defaultDuration: { type: "permanent" },
    effects: [{ mode: "derivedMod", key: "ausweichen", value: -1, label: "Ausweichen -1" }]
  },
  {
    key: "bewegungsunfaehig", name: "Bewegungsunfähig", icon: "fas fa-ban", category: "bewegung", severity: "kritisch",
    description: "Kann sich nicht aus eigener Kraft bewegen.",
    defaultDuration: { type: "rounds", value: 1 },
    effects: [{ mode: "derivedMod", key: "ausweichen", value: -6, label: "Ausweichen -6" }]
  },
  {
    key: "im_schock", name: "Im Schock", icon: "fas fa-heart-pulse", category: "psychisch", severity: "kritisch",
    description: "Körper und Geist sind überwältigt.",
    defaultDuration: { type: "rounds", value: 2 },
    effects: [
      { mode: "derivedMod", key: "ausweichen", value: -2, label: "Ausweichen -2" },
      { mode: "derivedMod", key: "initiativeMod", value: -2, label: "Initiative -2" }
    ]
  },
  {
    key: "infektionsverdacht", name: "Infektionsverdacht", icon: "fas fa-magnifying-glass", category: "krankheiten", severity: "gering",
    description: "Ein Biss oder Kratzer, dessen Folgen noch unklar sind.",
    defaultDuration: { type: "event", eventLabel: "bis Untersuchung" },
    effects: []
  }
];

export function conditionByKey(key) {
  return CONDITIONS.find(c => c.key === key) ?? null;
}

export function conditionCategoryLabel(key) {
  return CONDITION_CATEGORIES.find(c => c.key === key)?.label ?? key;
}

export function conditionDurationLabel(duration) {
  if (!duration) return "";
  switch (duration.type) {
    case "permanent": return "Permanent";
    case "event": return duration.eventLabel ? `Bis: ${duration.eventLabel}` : "Bis Ereignis";
    case "rounds": return `${duration.value ?? 0} Runde(n)`;
    case "minutes": return `${duration.value ?? 0} Minute(n)`;
    case "hours": return `${duration.value ?? 0} Stunde(n)`;
    case "days": return `${duration.value ?? 0} Tag(e)`;
    default: return "";
  }
}
