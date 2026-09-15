/**
 * Ready-made canvas Scenes ("Umgebungen") shipped with the system: real Foundry `Scene`
 * documents with pre-placed Walls and AmbientLights, not just a description. This is the single
 * source of truth for each scene's geometry — scripts/generate-scene-art.mjs draws the matching
 * background SVG from the SAME `walls`/`features` data, and scripts/generate-pack-sources.mjs
 * turns it into the compendium source JSON — so the artwork and the collision walls can never
 * drift apart.
 *
 * Coordinates are in pixels at `gridSize` px/square (Foundry's default 100px = 1 grid square =
 * 1m, matching system.json's grid config). Wall fields follow Foundry's WALL_SENSE_TYPES/
 * WALL_DOOR_TYPES conventions: omitted light/move/sight/sound default to 20 (NORMAL, i.e.
 * blocking); a "window" only overrides light/sight to 0 so it stays see-through while still
 * blocking movement; `door: 1` makes a segment an openable door instead of solid wall.
 *
 * @typedef {object} WallEntry
 * @property {[number,number,number,number]} c - [x1, y1, x2, y2]
 * @property {1} [door] - openable door instead of solid wall
 * @property {boolean} [window] - blocks movement but not light/sight (shop display window)
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
 * @property {number} gridSize
 * @property {number} width
 * @property {number} height
 * @property {number} darknessLevel - 0 (full daylight) - 1 (pitch black); this system leans dark
 *   by default so the Taschenlampe/Feuerzeug light-toggle mechanic (module/documents/actor.mjs)
 *   actually matters on these maps.
 * @property {WallEntry[]} walls
 * @property {LightEntry[]} lights
 * @property {FeatureEntry[]} features - purely visual (scripts/generate-scene-art.mjs); no collision
 *
 * @typedef {object} FeatureEntry
 * @property {"asphalt"|"floor"|"road"|"canopy"|"pump"|"wreck"} type
 * @property {[number,number,number,number]} [rect] - [x, y, w, h] (all but "wreck")
 * @property {string} [color] - only "floor" overrides the default floor tone
 * @property {number} [x] - "wreck" only
 * @property {number} [y] - "wreck" only
 */

/** @type {SceneEntry[]} */
export const SCENES = [
  {
    name: "Tankstelle",
    gridSize: 100,
    width: 2000,
    height: 1400,
    darknessLevel: 0.6,
    features: [
      { type: "asphalt", rect: [700, 100, 1300, 900] },
      { type: "floor", rect: [100, 200, 400, 600], color: "#c9c2b0" }, // Shop
      { type: "floor", rect: [500, 200, 200, 600], color: "#a89f8c" }, // Lagerraum
      { type: "road", rect: [0, 1200, 2000, 200] },
      { type: "canopy", rect: [950, 300, 700, 400] },
      { type: "pump", rect: [1050, 450, 100, 150] },
      { type: "pump", rect: [1450, 450, 100, 150] },
      { type: "wreck", x: 280, y: 1020 }
    ],
    // Kleiner Shop (6x6 Felder) mit einem abgetrennten Lagerraum im Osten, offener Zapfsäulen-
    // Vorplatz mit Vordach davor (rein optisch, siehe generate-scene-art.mjs — Tankstellen-Vordächer
    // haben keine Wände) und einer Zufahrtsstraße am unteren Rand.
    walls: [
      // Nordwand, mit Anlieferungstür in den Lagerraum
      { c: [100, 200, 550, 200] },
      { c: [550, 200, 650, 200], door: 1 },
      { c: [650, 200, 700, 200] },
      // Südwand (zum Vorplatz hin): Kundeneingang, Schaufenster, Lagerraum-Außenwand
      { c: [100, 800, 250, 800] },
      { c: [250, 800, 350, 800], door: 1 },
      { c: [350, 800, 500, 800], window: true },
      { c: [500, 800, 700, 800] },
      // West- und Ostwand
      { c: [100, 200, 100, 800] },
      { c: [700, 200, 700, 800] },
      // Innenwand Shop/Lagerraum, mit Durchgangstür
      { c: [500, 200, 500, 450] },
      { c: [500, 450, 500, 550], door: 1 },
      { c: [500, 550, 500, 800] }
    ],
    lights: [
      { x: 1100, y: 400, dim: 8, bright: 4, color: "#fff2cc" }, // Vordach-Beleuchtung West
      { x: 1500, y: 400, dim: 8, bright: 4, color: "#fff2cc" }, // Vordach-Beleuchtung Ost
      { x: 300, y: 500, dim: 5, bright: 3, color: "#e8f0ff" } // Shop-Innenbeleuchtung
    ]
  }
];
