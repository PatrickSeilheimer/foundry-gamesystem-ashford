/**
 * Medizinische und sonstige wichtige Überlebens-Items. Reine Rohdaten — die Verknüpfung zum
 * Consumable-/Equipment-Schema passiert in scripts/generate-pack-sources.mjs.
 *
 * Mechanik-Tiefe bewusst wie bei den Zuständen (module/rules/conditions.mjs): Effekte, die eine
 * konkrete Probe gegen einen Zielwert oder eine zeitliche Bedingung voraussetzen (Verband/Nähset:
 * Medizin-Probe; Desinfektionsmittel: nur im Rundenfenster nach der Ansteckung; Reparatur-Kit:
 * Technik-Probe), werden NICHT automatisch aufgelöst — der Text steht in der Beschreibung, die
 * eigentliche Probe läuft ganz normal über den Talent-Wurf auf dem Bogen. Nur die eindeutig
 * automatisierbaren Teile (Nutzung verbrauchen, den First-Aid-Kasten in seine Inhalte auflösen)
 * sind wirklich verdrahtet (module/documents/item.mjs#useConsumable).
 */

/**
 * @typedef {object} ConsumableEntry
 * @property {string} name
 * @property {string} category - module/models/gear.mjs ITEM_CATEGORIES
 * @property {string} actionLabel
 * @property {string} description
 * @property {number} [usesRemaining] - default 1
 * @property {{name:string, quantity:number}[]} [comboItems] - macht daraus ein Combi-Item (siehe oben)
 * @property {number} [infectionDelta] - verschiebt beim Benutzen direkt den (spielerunsichtbaren) Infektionswert
 * @property {string} [healFormula] - z.B. "3d6": eigener Würfel-Button, addiert das Ergebnis auf das Ziel/self
 */

/** @type {ConsumableEntry[]} */
export const CONSUMABLE_ITEMS = [
  {
    name: "Verband",
    category: "medizin",
    actionLabel: "Anwenden",
    description: "Medizin-Probe gegen Zielwert 4. Bei Erfolg: stoppt den Blutungsstatus des Ziels (anvisiert oder self). Heilt selbst keine LP."
  },
  {
    name: "Nähset",
    category: "medizin",
    actionLabel: "Anwenden",
    description: "Medizin-Probe gegen Zielwert 12. Bei Erfolg: stoppt den Blutungsstatus des Ziels (anvisiert oder self). Heilt selbst keine LP. Effekt identisch zum Verband, nur mit schwererer Probe."
  },
  {
    name: "Schmerzmittel",
    category: "medizin",
    actionLabel: "Einnehmen",
    description: "Entfernt den Schmerzen-Status vollständig. Heilt keine LP."
  },
  {
    name: "Adrenalin-Spritze",
    category: "medizin",
    actionLabel: "Injizieren",
    description: "Heilt sofort 3W6 LP, stabilisiert das Ziel und weckt einen bewusstlosen oder sterbenden Charakter sofort auf.",
    healFormula: "3d6"
  },
  {
    name: "Desinfektionsmittel",
    category: "medizin",
    actionLabel: "Anwenden",
    description: "Heilt eine Infektion vollständig — aber nur, wenn es in derselben oder der direkt folgenden Runde nach der Ansteckung eingesetzt wird.",
    infectionDelta: -7
  },
  {
    name: "Antimykotikum",
    category: "medizin",
    actionLabel: "Einnehmen",
    description: "Heilt eine bestehende Infektion vollständig, unabhängig vom Zeitpunkt. Seltener als ein gewöhnliches Antibiotikum, da spezialisiert auf die pilzbasierte Infektion.",
    infectionDelta: -7
  },
  {
    name: "Immunstimulans",
    category: "medizin",
    actionLabel: "Einnehmen",
    description: "Verzögert den Fortschritt einer bestehenden Infektion um einen Tag. Heilt die Infektion nicht."
  },
  {
    name: "Schiene",
    category: "medizin",
    actionLabel: "Anlegen",
    description: "Hebt einen Bewegungs-/Athletik-Malus durch einen gebrochenen Knochen auf. Heilt keine LP."
  },
  {
    name: "Erste-Hilfe-Kasten",
    category: "medizin",
    actionLabel: "Öffnen",
    description: "Erzeugt beim Einsatz im Inventar des Benutzers: 2× Verband, 1× Schmerzmittel, 1× Adrenalin-Spritze, 1× Desinfektionsmittel. Der Kasten selbst ist danach aufgebraucht.",
    comboItems: [
      { name: "Verband", quantity: 2 },
      { name: "Schmerzmittel", quantity: 1 },
      { name: "Adrenalin-Spritze", quantity: 1 },
      { name: "Desinfektionsmittel", quantity: 1 }
    ]
  },
  {
    name: "Feuerzeug / Streichhölzer",
    category: "sonstiges",
    actionLabel: "Entzünden",
    description: "Entzündet Feuer (Wärme, Kochen, Molotov anzünden).",
    usesRemaining: 20
  },
  {
    name: "Batterien",
    category: "material",
    actionLabel: "Wechseln",
    description: "Kein eigener Effekt, hält Taschenlampe/Funkgerät/Nachtsichtgerät am Laufen."
  },
  {
    name: "Reparatur-Kit",
    category: "werkzeug",
    actionLabel: "Reparieren",
    description: "Erfordert eine Technik-Probe. Repariert eine durch Bruchprobe zerstörte Waffe oder defekte Ausrüstung."
  },
  {
    name: "Konserven",
    category: "nahrung",
    actionLabel: "Essen",
    description: "Deckt den Nahrungsbedarf für einen Tag."
  },
  {
    name: "Wasserflasche / Wasseraufbereitung",
    category: "nahrung",
    actionLabel: "Trinken",
    description: "Deckt den Wasserbedarf für einen Tag."
  }
];

/**
 * @typedef {object} EquipmentEntry
 * @property {string} name
 * @property {string} category
 * @property {string} description
 */

/** @type {EquipmentEntry[]} */
export const SURVIVAL_EQUIPMENT_ITEMS = [
  {
    name: "Taschenlampe",
    category: "sonstiges",
    description: "Passiv (an/aus, keine Handlung pro Nutzung). Hebt Wahrnehmungs-Malus in Dunkelheit auf. Verbraucht mit der Zeit Batterien."
  },
  {
    name: "Seil (10 m)",
    category: "werkzeug",
    description: "Athletik-Probe zum Klettern/Sichern erhält +1 Würfel; verhindert Sturzschaden bei Erfolg."
  },
  {
    name: "Funkgerät (Paar)",
    category: "sonstiges",
    description: "Passiv, solange eingeschaltet. Kommunikation über Distanz ohne Sichtkontakt — kein Kampfeffekt, aber wichtig für Gruppentaktik."
  },
  {
    name: "Karte & Kompass",
    category: "sonstiges",
    description: "Passiv. Natur-/Wahrnehmungsproben zur Orientierung erhalten +1."
  },
  {
    name: "Schlafsack",
    category: "sonstiges",
    description: "Passiv, während einer Rast. Garantiert volle LP-Regeneration über Nacht (ohne Schlafsack reduziert)."
  }
];
