/**
 * Static catalog of rest activities (module/apps/rest.mjs). "Feuer machen" is deliberately NOT in
 * here — it's a single group-wide checkbox on the rest session itself (30 min flat, once per rest),
 * not a per-character queued activity. Dynamic "Herstellen: X" entries (one per craftable item a
 * character owns, see module/models/gear.mjs AshfordPhysicalItem#recipe) are generated at runtime,
 * not listed here either.
 */
export const REST_ACTIVITIES = [
  { key: "first-aid", label: "Erste Hilfe / Wunden versorgen", minutes: 20 },
  { key: "rest-hp", label: "Ausruhen (+1 Gesundheit)", minutes: 15, maxCount: 4 },
  { key: "refill-ammo", label: "Munition & Magazine auffüllen", minutes: 5 },
  { key: "cook-food", label: "Essen zubereiten", minutes: 15, requiresFire: true },
  { key: "boil-water", label: "Wasser abkochen", minutes: 15, requiresFire: true },
  { key: "stand-watch", label: "Wache halten", minutes: 60 },
  { key: "clean-infection", label: "Infektionsstelle reinigen", minutes: 15 },
  { key: "maintain-gear", label: "Ausrüstung warten", minutes: 15 },
  { key: "repair-weapon", label: "Waffe reparieren", minutes: 60 },
  { key: "forage", label: "Nahrung/Wasser sammeln", minutes: 30 }
];

export function restActivityByKey(key) {
  return REST_ACTIVITIES.find(a => a.key === key) ?? null;
}
