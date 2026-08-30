/**
 * Reichweitenklassen für die vier Fernkampf-Waffentalente (Abschnitt 6a).
 * Working assumption from the spec (flagged there as "bitte vor
 * Implementierung bestätigen", still open per Abschnitt 8.9): each band
 * applies "up to X meters" (the smallest band whose limit the distance does
 * not exceed); beyond the last band the attack automatically misses without
 * a roll.
 */
export const RANGE_TABLE = {
  schrotflinten: [
    { bisMeter: 2, mod: 8 },
    { bisMeter: 5, mod: 3 },
    { bisMeter: 10, mod: 0 },
    { bisMeter: 15, mod: -5 },
    { bisMeter: 25, mod: -10 }
  ],
  pistolen: [
    { bisMeter: 3, mod: 5 },
    { bisMeter: 8, mod: 2 },
    { bisMeter: 15, mod: 0 },
    { bisMeter: 25, mod: -2 },
    { bisMeter: 40, mod: -5 }
  ],
  gewehre: [
    { bisMeter: 5, mod: -2 },
    { bisMeter: 10, mod: 0 },
    { bisMeter: 25, mod: 2 },
    { bisMeter: 40, mod: 0 },
    { bisMeter: 70, mod: -1 }
  ],
  boegen: [
    { bisMeter: 3, mod: -4 },
    { bisMeter: 8, mod: -1 },
    { bisMeter: 25, mod: 2 },
    { bisMeter: 35, mod: 0 },
    { bisMeter: 50, mod: -3 }
  ]
};

/**
 * @param {string} weaponTalentKey - one of RANGE_TABLE's keys (pistolen/gewehre/schrotflinten/boegen)
 * @param {number} meters
 * @returns {number|null} the hit modifier, or null if the distance is beyond every band (automatic miss, no roll)
 */
export function rangeModifier(weaponTalentKey, meters) {
  const bands = RANGE_TABLE[weaponTalentKey];
  if (!bands) return 0;
  for (const band of bands) {
    if (meters <= band.bisMeter) return band.mod;
  }
  return null;
}
