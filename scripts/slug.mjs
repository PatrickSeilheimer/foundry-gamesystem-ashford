/**
 * Turns a character's display name into a filesystem-safe kebab-case slug,
 * used for BOTH the portrait filename and the `img` path written into the
 * Actor source JSON — using one shared function keeps the two from ever
 * drifting apart.
 *   'Eleanor "Nell" Whitfield' -> 'eleanor-whitfield'
 *   'Dr. Yvette Pham'          -> 'yvette-pham'
 */
export function slugifyName(name) {
  return name
    .replace(/["“”'‘’].*?["“”'‘’]/g, "") // drop quoted nicknames, e.g. "Nell"
    .replace(/^Dr\.\s*/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
