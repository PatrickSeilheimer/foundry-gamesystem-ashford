/**
 * Abgeleitete Charakterwerte (Abschnitt 4a). Kraft und Athletik bleiben
 * daneben ganz normal würfelbare Talente — diese vier Werte kommen
 * zusätzlich obendrauf, gespeist von Stärken−Schwächen auf genau diesen
 * beiden Talenten.
 *
 * nahkampfschaden ist NUR der charaktereigene Bonus (Kraft + ggf. Ausrüstung wie
 * Schlagring, siehe AshfordCharacter#prepareDerivedData) — der Waffenschaden selbst ist
 * ein eigener, absoluter Würfelausdruck pro Waffe (system.damageFormula) und wird beim
 * tatsächlichen Schadenswurf (AshfordActor#rollWeaponDamage) addiert, nicht hier hineingerechnet.
 * @param {object} params
 * @param {number} params.kraftMod - Stärken − Schwächen auf Kraft (-2..+3)
 * @param {number} params.athletikMod - Stärken − Schwächen auf Athletik (-2..+3)
 */
export function deriveCombatStats({ kraftMod = 0, athletikMod = 0 } = {}) {
  return {
    hp: 40 + kraftMod * 5,
    initiativeMod: athletikMod * 2, // tatsächlicher Wurf ist 1W12 + initiativeMod, nicht explodierend
    ausweichen: 10 + athletikMod * 3,
    nahkampfschaden: kraftMod
  };
}
