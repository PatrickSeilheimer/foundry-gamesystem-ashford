/**
 * Ready-made canvas Scenes ("Umgebungen") shipped with the system: real Foundry `Scene`
 * documents with pre-placed Walls and AmbientLights over a real background image supplied under
 * assets/scenes/<slug>.png — scripts/generate-pack-sources.mjs turns this into the compendium
 * source JSON (see resolveScenePath there for how the background path is resolved).
 *
 * Wall/room coordinates below were measured by hand against the actual pixel art (grid-overlay +
 * brightness-transition sampling at the wall/floor boundary), NOT guessed — they follow the real
 * floorplan. Where the art itself doesn't clearly mark a door (several interior boundaries here are
 * fully solid in the source image), a door was added anyway so every room stays reachable; those
 * are called out below so they're easy to move if the real intent was different.
 *
 * Coordinates are in pixels at `gridSize` px/square. Wall fields follow Foundry's
 * WALL_SENSE_TYPES/WALL_DOOR_TYPES conventions: omitted light/move/sight/sound default to 20
 * (NORMAL, i.e. blocking); `door: 1` makes a segment an openable door instead of solid wall.
 *
 * @typedef {object} WallEntry
 * @property {[number,number,number,number]} c - [x1, y1, x2, y2]
 * @property {1} [door] - openable door instead of solid wall
 *
 * @typedef {object} LightEntry
 * @property {number} x
 * @property {number} y
 * @property {number} dim
 * @property {number} bright
 * @property {string} color
 *
 * @typedef {object} SceneEntry
 * @property {string} name
 * @property {number} gridSize - measured against the art (car/parking-space width), not assumed
 * @property {number} width
 * @property {number} height
 * @property {number} darknessLevel - 0 (full daylight) - 1 (pitch black); this system leans dark
 *   by default so the Taschenlampe/Feuerzeug light-toggle mechanic (module/documents/actor.mjs)
 *   actually matters on these maps.
 * @property {WallEntry[]} walls
 * @property {LightEntry[]} lights
 */

/** @type {SceneEntry[]} */
export const SCENES = [
  {
    name: "Tankstelle",
    gridSize: 64,
    width: 1536,
    height: 2048,
    darknessLevel: 0.6,
    walls: [
      // Gebäude-Außenwand: Norden, Westen, Osten (oberer Shop-Teil) -- durchgehend, keine Tür im Bild erkennbar
      { c: [300, 300, 1220, 300] },
      { c: [300, 300, 300, 1064] },
      { c: [1220, 300, 1220, 764] },

      // Trennwand Büro/Lager (links) zu Shop (rechts), x=750: im Original durchgehend solide.
      // Tür hier selbst ergänzt (Lager <-> Shop), da sonst kein Weg vom Lager in den Verkaufsraum bestünde.
      { c: [750, 300, 750, 650] },
      { c: [750, 650, 750, 714], door: 1 },
      { c: [750, 714, 750, 1064] },

      // Südwand Shop (Knick des Gebäudegrundrisses zum offenen Vorplatz mit Behindertenparkplatz).
      // Kundeneingang hier selbst ergänzt -- im Bild keine erkennbare Tür.
      { c: [750, 764, 850, 764] },
      { c: [850, 764, 978, 764], door: 1 },
      { c: [978, 764, 1220, 764] },

      // Südwand Lagerraum (unterer, schmalerer Gebäudeteil)
      { c: [300, 1064, 750, 1064] },

      // Trennwand Büro (oben) / Lagerraum (unten), y=496: im Original durchgehend solide.
      // Tür hier selbst ergänzt, sonst wäre das Büro komplett abgeriegelt.
      { c: [300, 496, 550, 496] },
      { c: [550, 496, 614, 496], door: 1 },
      { c: [614, 496, 750, 496] },

      // Toilette (kleiner Raum in der Südwest-Ecke des Lagerraums) -- Tür im Bild sichtbar (rötliches Türblatt)
      { c: [408, 918, 408, 1064] },
      { c: [408, 918, 500, 918] },
      { c: [500, 918, 500, 944] },
      { c: [500, 944, 500, 1000], door: 1 },
      { c: [500, 1000, 500, 1064] },

      // Kleiner Versorgungs-Unterstand unten links auf dem Vorplatz (Luft/Wasser-Station), nach Süden offen
      { c: [16, 1820, 224, 1820] },
      { c: [16, 1820, 16, 1940] },
      { c: [224, 1820, 224, 1940] }
    ],
    lights: [
      { x: 980, y: 500, dim: 6, bright: 3, color: "#e8f0ff" }, // Shop-Innenbeleuchtung
      { x: 500, y: 650, dim: 6, bright: 3, color: "#e8f0ff" }, // Lager-Innenbeleuchtung
      { x: 420, y: 1330, dim: 10, bright: 5, color: "#fff2cc" }, // Zapfsäulen-Insel West
      { x: 830, y: 1330, dim: 10, bright: 5, color: "#fff2cc" } // Zapfsäulen-Insel Ost
    ]
  }
];
