/** Generische Schwierigkeitsgrade (Abschnitt 3): Erfolg, wenn Würfelsumme ≥ Zielwert. */
export const DIFFICULTIES = [
  { key: "leicht", label: "Leicht", target: 9 },
  { key: "mittel", label: "Mittel", target: 12 },
  { key: "schwer", label: "Schwer", target: 16 },
  { key: "sehrschwer", label: "Sehr schwer", target: 20 },
  { key: "extrem", label: "Extrem", target: 24 }
];

export function difficultyByKey(key) {
  return DIFFICULTIES.find(d => d.key === key) ?? null;
}
