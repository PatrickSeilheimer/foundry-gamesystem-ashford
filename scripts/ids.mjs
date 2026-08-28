import { createHash } from "node:crypto";

/**
 * Deterministic 16-char Foundry-VTT-valid document ID derived from a stable
 * slug. Same slug always produces the same ID, so compendium source JSON
 * can reference each other (e.g. `@UUID[Actor.<id>]`) without maintaining a
 * separate lookup table, and regenerating the packs never changes anyone's
 * ID.
 * @param {string} slug - stable, human-chosen key, e.g. "npc-vance"
 * @returns {string} 16 lowercase hex characters
 */
export function idFor(slug) {
  return createHash("sha1").update(`ashford:${slug}`).digest("hex").slice(0, 16);
}
