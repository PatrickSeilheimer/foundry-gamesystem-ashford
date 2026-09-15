/**
 * Draws one schematic top-down background SVG per entry in scripts/data/ashford-scene-content.mjs,
 * written to assets/scenes/<slug>.svg (the exact path scripts/generate-pack-sources.mjs points each
 * Scene's `background.src` at). Reads the SAME `walls`/`lights`/`features` data the pack generator
 * turns into real Wall/AmbientLight documents, so the drawn walls always line up with the actual
 * collision geometry — pure string templating, no image libraries, same approach as
 * generate-placeholder-portraits.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyName } from "./slug.mjs";
import { SCENES } from "./data/ashford-scene-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "assets/scenes");

const LOT_COLOR = "#4a4536";
const ASPHALT_COLOR = "#3c3c3c";
const ROAD_COLOR = "#2e2e2e";
const WALL_COLOR = "#1a1712";
const DOOR_COLOR = "#8a5a2b";
const WINDOW_COLOR = "#6f93a8";

function rectPath({ rect: [x, y, w, h] }) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}"`;
}

function featureSvg(feature) {
  switch (feature.type) {
    case "asphalt":
      return `${rectPath(feature)} fill="${ASPHALT_COLOR}"/>`;
    case "floor":
      return `${rectPath(feature)} fill="${feature.color ?? "#c9c2b0"}" stroke="#00000033" stroke-width="2"/>`;
    case "road": {
      const [x, y, w, h] = feature.rect;
      const midY = y + h / 2;
      return `
        ${rectPath(feature)} fill="${ROAD_COLOR}"/>
        <line x1="${x}" y1="${midY}" x2="${x + w}" y2="${midY}" stroke="#c9b96a" stroke-width="6" stroke-dasharray="40 30"/>
      `;
    }
    case "canopy":
      return `${rectPath(feature)} fill="#00000015" stroke="#d8d2c0aa" stroke-width="4" stroke-dasharray="14 10"/>`;
    case "pump": {
      const [x, y, w, h] = feature.rect;
      return `
        ${rectPath(feature)} fill="#6b6f73" stroke="#2b2d2f" stroke-width="3"/>
        <circle cx="${x + w / 2}" cy="${y + h * 0.3}" r="${Math.min(w, h) * 0.18}" fill="#3d4144"/>
      `;
    }
    case "wreck": {
      const { x, y } = feature;
      return `
        <rect x="${x}" y="${y}" width="180" height="90" rx="14" fill="#5a3a2e" stroke="#2b1c15" stroke-width="4"/>
        <circle cx="${x + 35}" cy="${y + 90}" r="18" fill="#1b1712"/>
        <circle cx="${x + 145}" cy="${y + 90}" r="18" fill="#1b1712"/>
      `;
    }
    default:
      return "";
  }
}

function wallSvg(wall) {
  const [x1, y1, x2, y2] = wall.c;
  if (wall.door) return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${DOOR_COLOR}" stroke-width="10" stroke-linecap="round"/>`;
  if (wall.window) return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WINDOW_COLOR}" stroke-width="6"/>`;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${WALL_COLOR}" stroke-width="10" stroke-linecap="square"/>`;
}

function lightGlowSvg(light, i) {
  const radius = (light.dim || 6) * 15;
  return `
    <radialGradient id="glow-${i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${light.color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${light.color}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="${light.x}" cy="${light.y}" r="${radius}" fill="url(#glow-${i})"/>
  `;
}

function svgFor(scene) {
  const { width, height, features = [], walls = [], lights = [] } = scene;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="${LOT_COLOR}"/>
  ${features.map(featureSvg).join("\n")}
  ${lights.map(lightGlowSvg).join("\n")}
  ${walls.map(wallSvg).join("\n")}
</svg>
`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const scene of SCENES) {
  const slug = slugifyName(scene.name);
  fs.writeFileSync(path.join(OUT_DIR, `${slug}.svg`), svgFor(scene), "utf8");
  console.log(`Geschrieben: assets/scenes/${slug}.svg`);
}
