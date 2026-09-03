/**
 * Die 74-Einträge-Liste aus "Ausrüstung & Waffen — Ashford Adventures" (Stand 2026-09-03):
 * 44 Waffen über die 7 Waffentalente, 30 Körper-Ausrüstungsteile über die 5 Slots.
 * Nur Rohdaten — module/rules-Verknüpfung (weaponSkill/kategorie/slot/Talent-Keys/Rüstungstyp-Mapping)
 * passiert in scripts/generate-pack-sources.mjs.
 */

/** Waffentalent + Kategorie je Waffen-Kategorie-Schlüssel. */
export const WEAPON_CATS = {
  pistolen: { weaponSkill: "pistolen", kategorie: "fernkampf" },
  gewehre: { weaponSkill: "gewehre", kategorie: "fernkampf" },
  schrot: { weaponSkill: "schrotflinten", kategorie: "fernkampf" },
  boegen: { weaponSkill: "boegen", kategorie: "fernkampf" },
  schlag: { weaponSkill: "schlagwaffen", kategorie: "nahkampf_schlag" },
  hieb: { weaponSkill: "hiebwaffen", kategorie: "nahkampf_hieb" },
  stich: { weaponSkill: "stichwaffen", kategorie: "nahkampf_stich" }
};

/** Körper-Slot je Ausrüstungs-Kategorie-Schlüssel. */
export const ARMOR_CATS = {
  kopf: "head",
  torso: "chest",
  haende: "hands",
  beine: "legs",
  fuesse: "feet"
};

/** "Rüstung gegen X" → AshfordArmor#armor-Schadensart (module/models/gear.mjs ARMOR_TYPES). */
export const DAMAGE_TYPE_MAP = {
  Schusswaffen: "ballistic",
  Stichwaffen: "pierce",
  Schlagwaffen: "blunt",
  Hiebwaffen: "slash"
};

/** Talent-Namen aus der Liste → module/rules/talents.mjs talentKey. "Waffenloser Kampf – Schaden" ist
 * ein Sonderfall (siehe generate-pack-sources.mjs): das ist ein Nahkampfschaden-Bonus, kein Talent-Wurf-Bonus. */
export const TALENT_NAME_MAP = {
  Wahrnehmung: "wahrnehmung",
  Heimlichkeit: "heimlichkeit",
  Medizin: "medizin",
  Athletik: "athletik",
  Technik: "technik",
  Natur: "natur"
};

function diyNote(die) {
  return `Bei jedem Einsatz 1W${die || 8} würfeln. Bei einer ${die || 8} geht die Waffe kaputt.`;
}

/**
 * @typedef {object} WeaponEntry
 * @property {string} cat - key into WEAPON_CATS
 * @property {string} name
 * @property {string|null} munition
 * @property {number} bonus - Treffer-Bonus/-Malus
 * @property {number} init - Initiative-Modifikator
 * @property {string} schaden - Foundry-Würfelsyntax, z.B. "2d6+5"
 * @property {boolean} [diy] - "Anfällig": löst bei jedem Einsatz eine Bruchprobe aus (nicht automatisiert, siehe note)
 * @property {string} [note]
 */

/** @type {WeaponEntry[]} */
export const WEAPON_ITEMS = [
  // ---- PISTOLEN ----
  { cat: "pistolen", name: "Ranzige DIY Knarre", munition: "9mm", bonus: -2, init: 0, schaden: "2d6+5", diy: true, note: `${diyNote(8)} Bonus zusätzlich zu den Reichweitenklassen-Werten.` },
  { cat: "pistolen", name: "Beretta", munition: "9mm", bonus: 0, init: 1, schaden: "2d6+7" },
  { cat: "pistolen", name: "Desert Eagle", munition: "Magnum", bonus: -3, init: 0, schaden: "3d8+15" },
  { cat: "pistolen", name: "R8 Revolver", munition: "Magnum", bonus: 0, init: 0, schaden: "3d6+8" },
  { cat: "pistolen", name: "Glock", munition: "9mm", bonus: -2, init: 1, schaden: "2d6+6", note: "Kann 2 Schüsse abfeuern. Beide Schüsse erhalten zusätzlich −4." },
  { cat: "pistolen", name: "M1911", munition: "9mm", bonus: 0, init: 1, schaden: "3d6+5" },
  { cat: "pistolen", name: "FN Five-seveN", munition: "9mm", bonus: 2, init: 1, schaden: "2d6+5", note: "Ignoriert 3 Punkte Rüstung." },
  { cat: "pistolen", name: "Tec-9", munition: "9mm", bonus: 0, init: 2, schaden: "2d6+2", note: "Kann 3 Schüsse abfeuern. Alle Schüsse erhalten −3." },

  // ---- GEWEHRE ----
  { cat: "gewehre", name: "Ranziges DIY Gewehr", munition: "7.62mm", bonus: -2, init: 0, schaden: "2d8+8", diy: true, note: diyNote(8) },
  { cat: "gewehre", name: "M4A1", munition: "5.56mm", bonus: 2, init: 1, schaden: "2d8+8" },
  { cat: "gewehre", name: "AK-47", munition: "5.56mm", bonus: -2, init: 1, schaden: "3d8+10" },
  { cat: "gewehre", name: "M1", munition: "7.62mm", bonus: 0, init: 0, schaden: "3d8+13" },
  { cat: "gewehre", name: "FN Scar-H", munition: "7.62mm", bonus: 0, init: 0, schaden: "3d8+14", note: "Ignoriert 6 Punkte Rüstung." },
  { cat: "gewehre", name: "SVD Dragunov", munition: "7.62mm", bonus: 2, init: 0, schaden: "3d8+10" },

  // ---- SCHROTFLINTEN ----
  { cat: "schrot", name: "Ranzige DIY Flinte", munition: "Schrot", bonus: -2, init: -1, schaden: "4d8+5", diy: true, note: diyNote(8) },
  { cat: "schrot", name: "Abgesägte Schrotflinte", munition: "Schrot", bonus: -2, init: -1, schaden: "5d8+4" },
  { cat: "schrot", name: "Pump Action Shotgun", munition: "Schrot", bonus: 0, init: -1, schaden: "4d8+7" },
  { cat: "schrot", name: "XM1014", munition: "Schrot", bonus: 1, init: 0, schaden: "4d8+8" },
  { cat: "schrot", name: "Saiga-12", munition: "Schrot", bonus: 2, init: -1, schaden: "4d8+10" },

  // ---- BÖGEN ----
  { cat: "boegen", name: "Ranziger DIY Bogen", munition: "Pfeil", bonus: -2, init: -3, schaden: "1d8+5", diy: true, note: diyNote(8) },
  { cat: "boegen", name: "Kurzbogen", munition: "Pfeil", bonus: 0, init: 0, schaden: "1d8+5" },
  { cat: "boegen", name: "Langbogen", munition: "Pfeil", bonus: 1, init: -3, schaden: "1d8+7" },
  { cat: "boegen", name: "Recurve Bogen", munition: "Pfeil", bonus: 1, init: -6, schaden: "2d8+4" },
  { cat: "boegen", name: "Armbrust", munition: "Pfeil", bonus: 1, init: -6, schaden: "2d8+4" },
  { cat: "boegen", name: "Compound Bogen", munition: "Pfeil", bonus: 1, init: -2, schaden: "1d8+11" },
  { cat: "boegen", name: "Compound Armbrust", munition: "Pfeil", bonus: 1, init: -5, schaden: "2d8+9" },

  // ---- SCHLAGWAFFEN ---- (kein Munitionsbedarf: niedriger, gleichmäßiger Schaden, dafür sehr gute Initiative)
  { cat: "schlag", name: "Hammer", munition: null, bonus: -1, init: 3, schaden: "1d6+2" },
  { cat: "schlag", name: "Holzknüppel", munition: null, bonus: 0, init: 4, schaden: "1d6+3" },
  { cat: "schlag", name: "Baseballschläger", munition: null, bonus: 0, init: 3, schaden: "1d8+3" },
  { cat: "schlag", name: "Polizeischlagstock", munition: null, bonus: 1, init: 5, schaden: "1d6+3" },
  { cat: "schlag", name: "Morgenstern", munition: null, bonus: -1, init: 2, schaden: "1d8+4" },
  { cat: "schlag", name: "Vorschlaghammer", munition: null, bonus: -2, init: 1, schaden: "1d10+5" },

  // ---- HIEBWAFFEN ---- (kein Munitionsbedarf: niedriger, gleichmäßiger Schaden, dafür sehr gute Initiative)
  { cat: "hieb", name: "Fleischerbeil", munition: null, bonus: -1, init: 3, schaden: "1d6+3" },
  { cat: "hieb", name: "Machete", munition: null, bonus: 0, init: 3, schaden: "1d8+4" },
  { cat: "hieb", name: "Kampfaxt", munition: null, bonus: 0, init: 4, schaden: "1d8+4" },
  { cat: "hieb", name: "Katana", munition: null, bonus: 1, init: 5, schaden: "1d8+4" },
  { cat: "hieb", name: "Feuerwehraxt", munition: null, bonus: -1, init: 1, schaden: "1d10+5" },
  { cat: "hieb", name: "Zweihand-Breitschwert", munition: null, bonus: -2, init: 1, schaden: "1d10+6" },

  // ---- STICHWAFFEN ---- (kein Munitionsbedarf: niedriger, gleichmäßiger Schaden, dafür sehr gute Initiative)
  { cat: "stich", name: "Küchenmesser", munition: null, bonus: 0, init: 4, schaden: "1d6+2" },
  { cat: "stich", name: "Eispickel", munition: null, bonus: 0, init: 3, schaden: "1d6+3" },
  { cat: "stich", name: "Bajonett", munition: null, bonus: -1, init: 2, schaden: "1d8+3" },
  { cat: "stich", name: "Kampfmesser", munition: null, bonus: 1, init: 5, schaden: "1d6+3" },
  { cat: "stich", name: "Speer", munition: null, bonus: 0, init: 1, schaden: "1d8+4" },
  { cat: "stich", name: "Rapier", munition: null, bonus: 2, init: 6, schaden: "1d6+4" }
];

/**
 * @typedef {object} ArmorEntry
 * @property {string} cat - key into ARMOR_CATS
 * @property {string} name
 * @property {{gegen:string, wert:number}[]} [ruestung]
 * @property {{name:string, wert:number}[]} [talent] - Talent-Name aus TALENT_NAME_MAP, oder "Waffenloser Kampf – Schaden"
 * @property {number} [init]
 * @property {string} [note]
 * @property {boolean} [newRule] - setzt ein im Kernregelwerk noch nicht definiertes Konzept voraus (Krit/Immunität) — rein deskriptiv, nicht automatisiert
 */

/** @type {ArmorEntry[]} */
export const ARMOR_ITEMS = [
  // ---- KOPF ----
  { cat: "kopf", name: "Fahrradhelm", ruestung: [{ gegen: "Schlagwaffen", wert: 2 }] },
  { cat: "kopf", name: "Bauhelm", ruestung: [{ gegen: "Schlagwaffen", wert: 3 }], init: -1 },
  { cat: "kopf", name: "Kevlarhelm (Sturmhelm)", ruestung: [{ gegen: "Schusswaffen", wert: 4 }], init: -1, note: "Krit-Immunität gegen Kopftreffer.", newRule: true },
  { cat: "kopf", name: "Gasmaske", talent: [{ name: "Wahrnehmung", wert: -2 }], note: "Immunität gegen Gift-/Sporen-basierte Gefahren.", newRule: true },
  { cat: "kopf", name: "Kapuze / Baseballkappe", talent: [{ name: "Heimlichkeit", wert: 1 }] },
  { cat: "kopf", name: "Nachtsichtgerät", talent: [{ name: "Wahrnehmung", wert: 2 }], init: -1, note: "Wahrnehmungsbonus gilt bei Dunkelheit." },

  // ---- TORSO ----
  { cat: "torso", name: "Dicke Lederjacke", ruestung: [{ gegen: "Hiebwaffen", wert: 2 }, { gegen: "Stichwaffen", wert: 1 }] },
  { cat: "torso", name: "Kettenhemd", ruestung: [{ gegen: "Hiebwaffen", wert: 4 }, { gegen: "Stichwaffen", wert: 3 }], init: -2 },
  { cat: "torso", name: "Kevlarweste", ruestung: [{ gegen: "Schusswaffen", wert: 5 }], init: -2 },
  { cat: "torso", name: "Schwere Panzerung (SWAT-Vollschutz)", ruestung: [{ gegen: "Schusswaffen", wert: 3 }, { gegen: "Hiebwaffen", wert: 3 }, { gegen: "Stichwaffen", wert: 3 }, { gegen: "Schlagwaffen", wert: 3 }], init: -4 },
  { cat: "torso", name: "Sport-/Footballpolster", ruestung: [{ gegen: "Schlagwaffen", wert: 2 }], talent: [{ name: "Heimlichkeit", wert: -1 }] },
  { cat: "torso", name: "Weiter Trenchcoat", talent: [{ name: "Heimlichkeit", wert: 1 }] },

  // ---- HÄNDE ----
  { cat: "haende", name: "Genagelte Lederhandschuhe", talent: [{ name: "Waffenloser Kampf – Schaden", wert: 1 }] },
  { cat: "haende", name: "Schlagring", talent: [{ name: "Waffenloser Kampf – Schaden", wert: 5 }] },
  { cat: "haende", name: "Taktische Panzerhandschuhe", ruestung: [{ gegen: "Stichwaffen", wert: 1 }], init: 1 },
  { cat: "haende", name: "Sanitäter-Handschuhe", talent: [{ name: "Medizin", wert: 1 }] },
  { cat: "haende", name: "Kletterhandschuhe", talent: [{ name: "Athletik", wert: 1 }] },
  { cat: "haende", name: "Mechaniker-Handschuhe", talent: [{ name: "Technik", wert: 1 }] },

  // ---- BEINE ----
  { cat: "beine", name: "Motorrad-Lederhose", ruestung: [{ gegen: "Hiebwaffen", wert: 2 }] },
  { cat: "beine", name: "Schienbeinschoner", ruestung: [{ gegen: "Schlagwaffen", wert: 3 }], init: -1 },
  { cat: "beine", name: "Taktische Panzerhose (Beinplatten)", ruestung: [{ gegen: "Schusswaffen", wert: 2 }], init: -2 },
  { cat: "beine", name: "Jogginghose", talent: [{ name: "Athletik", wert: 1 }] },
  { cat: "beine", name: "Tarnhose", talent: [{ name: "Heimlichkeit", wert: 1 }] },
  { cat: "beine", name: "Cargo-Hose", talent: [{ name: "Technik", wert: 1 }] },

  // ---- FÜSSE ----
  { cat: "fuesse", name: "Turnschuhe", init: 1 },
  { cat: "fuesse", name: "Wanderstiefel", talent: [{ name: "Athletik", wert: 1 }] },
  { cat: "fuesse", name: "Lautlose Stoffschuhe", talent: [{ name: "Heimlichkeit", wert: 2 }], init: -1 },
  { cat: "fuesse", name: "Stahlkappenstiefel", ruestung: [{ gegen: "Schlagwaffen", wert: 1 }], talent: [{ name: "Waffenloser Kampf – Schaden", wert: 1 }] },
  { cat: "fuesse", name: "Militär-Kampfstiefel", ruestung: [{ gegen: "Stichwaffen", wert: 2 }], init: -1 },
  { cat: "fuesse", name: "Gummistiefel", talent: [{ name: "Natur", wert: 1 }] }
];
