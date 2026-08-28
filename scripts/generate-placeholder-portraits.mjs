/**
 * Generates one square placeholder portrait SVG per person in
 * scripts/data/ashford-codex-content.mjs, written to assets/portraits/<slug>.svg (the exact
 * path the pack generator points each NPC Actor's `img` at). Zero dependencies -- pure string
 * templating, no image libraries -- so it can be re-run any time a new NPC is added to the
 * Kodex, long before real character art exists for them.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyName } from "./slug.mjs";
import { persons } from "./data/ashford-codex-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SIZE = 512;
const BG = "#242019";
const CIRCLE = "#7a9b6e";
const INITIALS_COLOR = "#e9e2cf";
const NAME_COLOR = "#b3a889";

/** Escapes text for safe inclusion inside SVG markup (names/initials are free-form German text). */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function svgFor(person) {
  const initials = escapeXml(person.initials ?? "?");
  const name = escapeXml(person.name ?? "");
  const cx = SIZE / 2;
  const cy = SIZE * 0.42;
  const r = SIZE * 0.28;
  // Font size shrinks a little for longer initials (e.g. single-letter "F" vs. two-letter "EV")
  // so it keeps fitting comfortably inside the circle.
  const initialsSize = initials.length > 1 ? r * 0.72 : r * 0.85;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${CIRCLE}"/>
  <text x="${cx}" y="${cy}" fill="${INITIALS_COLOR}" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" font-weight="bold" font-size="${initialsSize.toFixed(0)}" text-anchor="middle" dominant-baseline="central">${initials}</text>
  <text x="${cx}" y="${SIZE * 0.92}" fill="${NAME_COLOR}" font-family="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" font-size="${(SIZE * 0.045).toFixed(0)}" text-anchor="middle">${name}</text>
</svg>
`;
}

const outDir = path.join(ROOT, "assets", "portraits");
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const person of Object.values(persons)) {
  const slug = slugifyName(person.name);
  const file = path.join(outDir, `${slug}.svg`);
  fs.writeFileSync(file, svgFor(person));
  console.log(`Geschrieben: ${path.relative(ROOT, file)}`);
  count++;
}

console.log(`\nFertig: ${count} Platzhalter-Portraits.`);
