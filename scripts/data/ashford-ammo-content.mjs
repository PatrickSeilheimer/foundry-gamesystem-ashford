/**
 * Munitions-/Magazin-Referenzitems für das "ammo"-Kompendium. Reine Rohdaten — Verknüpfung zum
 * Item-Schema (module/models/gear.mjs AshfordAmmo/AshfordMagazine) passiert in
 * scripts/generate-pack-sources.mjs.
 *
 * Magazin-Kapazitäten und Munitions-Stückzahlen sind plausible, aber erfundene Platzhalter (die
 * ursprüngliche 74-Item-Liste hatte keine Magazin-/Vorratsangaben) — ein GM kann sowohl auf dem
 * generierten Magazin-Item als auch auf jedem gezogenen Munitions-Stack die Werte frei anpassen.
 */

/**
 * @typedef {object} MagazineEntry
 * @property {string} name
 * @property {string} ammoType - module/models/gear.mjs AMMO_TYPES
 * @property {number} capacity
 */

/** @type {MagazineEntry[]} */
export const MAGAZINE_ITEMS = [
  { name: "9mm-Magazin", ammoType: "9mm", capacity: 10 },
  { name: "Magnum-Magazin", ammoType: "magnum", capacity: 7 },
  { name: "5.56mm-Magazin", ammoType: "5.56mm", capacity: 20 },
  { name: "7.62mm-Magazin", ammoType: "7.62mm", capacity: 20 }
];

/**
 * @typedef {object} AmmoEntry
 * @property {string} name
 * @property {string} ammoType
 * @property {number} quantity - Startgröße eines frisch aus dem Kompendium gezogenen Vorrats-Stacks
 */

/** @type {AmmoEntry[]} */
export const AMMO_ITEMS = [
  { name: "9mm-Patronen", ammoType: "9mm", quantity: 20 },
  { name: "Magnum-Patronen", ammoType: "magnum", quantity: 10 },
  { name: "5.56mm-Patronen", ammoType: "5.56mm", quantity: 30 },
  { name: "7.62mm-Patronen", ammoType: "7.62mm", quantity: 30 },
  { name: "Schrotpatronen", ammoType: "schrot", quantity: 12 },
  { name: "Pfeile", ammoType: "pfeil", quantity: 12 }
];
