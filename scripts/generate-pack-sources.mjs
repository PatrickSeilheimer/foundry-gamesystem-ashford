/**
 * Wandelt die Rohdaten aus scripts/data/ashford-codex-content.mjs (Personen, Gebäude, Missionen
 * aus der Lagerakte von Ashford) sowie eine kleine Menge Beispiel-Traits in vollständige
 * Compendium-Quelldateien um (packs/_source/<pack>/*.json), die anschließend per
 * `npm run build:packs` (fvtt CLI) zu den ausgelieferten LevelDB-Packs unter packs/<pack>/
 * kompiliert werden. Nur zur Build-Zeit genutzt, läuft nicht im System selbst.
 *
 * WICHTIG zum JournalEntry-Format: die fvtt-CLI verlangt für JEDES Dokument in der
 * Hierarchie (auch für eingebettete JournalEntryPages) ein eigenes `_key`-Feld
 * (`!journal!<id>` für den Eintrag selbst, `!journal.pages!<entryId>.<pageId>` für jede
 * Seite) -- ohne das würde das Kompilieren mit einem undefined-Key kollidieren. Siehe
 * node_modules/@foundryvtt/foundryvtt-cli/lib/package.mjs (applyHierarchy/HIERARCHY.journal).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { idFor } from "./ids.mjs";
import { slugifyName } from "./slug.mjs";
import { buildings, persons, missions } from "./data/ashford-codex-content.mjs";
import { TALENTS } from "../module/rules/talents.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SYSTEM_ID = "ashford";
const SYSTEM_VERSION = "0.1.0";
const CORE_VERSION = "14"; // system.json compatibility.verified

const PORTRAITS_DIR = path.join(ROOT, "assets/portraits");
const PORTRAIT_EXTENSIONS = ["png", "webp", "jpg", "jpeg", "svg"];

/**
 * Prefers real delivered artwork over the generated placeholder: looks for
 * assets/portraits/<slug>.{png,webp,jpg,jpeg} first, falls back to the
 * placeholder .svg (which generate-placeholder-portraits.mjs always creates)
 * if no real art has been dropped in yet.
 */
function resolvePortraitPath(slug) {
  for (const ext of PORTRAIT_EXTENSIONS) {
    if (fs.existsSync(path.join(PORTRAITS_DIR, `${slug}.${ext}`))) {
      return `systems/ashford/assets/portraits/${slug}.${ext}`;
    }
  }
  return `systems/ashford/assets/portraits/${slug}.svg`;
}

function stats() {
  return {
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
    coreVersion: CORE_VERSION,
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
    duplicateSource: null
  };
}

/** Actor id for the Actor generated for persons[key] -- shared with ashford-codex-content.mjs's personLink(). */
function npcId(key) {
  return idFor(`npc-${key}`);
}

function npcUuid(key) {
  return key ? `Actor.${npcId(key)}` : null;
}

/** Empties (and recreates) a packs/_source/<pack> directory before writing new files into it, so
 * renamed/removed entries never linger as stale phantom documents that would get packed too. */
function ensureCleanDir(relPath) {
  const dir = path.join(ROOT, relPath);
  fs.mkdirSync(dir, { recursive: true });
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith(".json")) fs.unlinkSync(path.join(dir, file));
  }
  return dir;
}

function writeJSON(dir, filename, doc) {
  const file = path.join(dir, filename);
  fs.writeFileSync(file, JSON.stringify(doc, null, 2) + "\n");
  console.log(`Geschrieben: ${path.relative(ROOT, file)}`);
}

/* -------------------------------------------- */
/*  NPCs (Actors)                                */
/* -------------------------------------------- */

const npcsDir = ensureCleanDir("packs/_source/npcs");

for (const [key, person] of Object.entries(persons)) {
  const id = npcId(key);
  const slug = slugifyName(person.name);
  const img = resolvePortraitPath(slug);
  const facts = Object.entries(person.facts ?? {}).map(([label, value]) => ({ label, value }));

  const doc = {
    _id: id,
    _key: `!actors!${id}`,
    name: person.name,
    type: "npc",
    img,
    system: {
      role: person.role ?? "",
      buildingId: person.building ?? "",
      note: person.note ? `<p>${person.note}</p>` : "",
      facts,
      story: person.story ? `<p>${person.story}</p>` : "",
      isCodexEntry: true,
      initials: person.initials ?? "",
      meta: {
        gender: person.meta?.gender ?? "",
        age: person.meta?.age ?? null,
        relationship: person.meta?.relationship ?? "",
        workplace: person.meta?.workplace ?? "",
        nationality: person.meta?.nationality ?? ""
      },
      biography: "",
      resources: {
        health: { value: 8, max: 8 },
        infection: { value: 0, max: 10 }
      },
      dice: { basePool: 3 }
    },
    items: [],
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 2 }, // OBSERVER -- Kodex-Eintrag, Spieler dürfen ihn ansehen
    flags: {},
    prototypeToken: {
      name: person.name,
      texture: { src: img },
      width: 1,
      height: 1,
      actorLink: false,
      disposition: 0
    },
    _stats: stats()
  };

  writeJSON(npcsDir, `${key}.json`, doc);
}

/* -------------------------------------------- */
/*  Buildings (single JournalEntry)              */
/* -------------------------------------------- */

const buildingsDir = ensureCleanDir("packs/_source/buildings");

{
  const entryId = idFor("journal-buildings");
  const pages = buildings.map((b, i) => {
    const pageId = idFor(`building-${b.id}`);
    return {
      _id: pageId,
      _key: `!journal.pages!${entryId}.${pageId}`,
      name: b.name,
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content: `<p>${b.desc}</p>`,
        format: 1,
        markdown: ""
      },
      sort: (i + 1) * 100000,
      ownership: { default: 2 },
      flags: {
        ashford: {
          slug: b.id,
          badge: b.badge,
          tier: b.tier,
          npcUuid: npcUuid(b.npc),
          npcNote: b.npcNote ?? null
        }
      },
      _stats: stats()
    };
  });

  const doc = {
    _id: entryId,
    _key: `!journal!${entryId}`,
    name: "Gebäude von Ashford",
    pages,
    folder: null,
    sort: 0,
    ownership: { default: 2 },
    flags: {},
    categories: [],
    _stats: stats()
  };

  writeJSON(buildingsDir, "gebaeude-von-ashford.json", doc);
}

/* -------------------------------------------- */
/*  Missions (single JournalEntry)               */
/* -------------------------------------------- */

const missionsDir = ensureCleanDir("packs/_source/missions");

{
  const entryId = idFor("journal-missions");
  const pages = missions.map((m, i) => {
    const pageId = idFor(`mission-${m.id}`);
    const auftraggeberHTML = m.auftraggeberId
      ? `@UUID[${npcUuid(m.auftraggeberId)}]{${m.auftraggeber}}`
      : m.auftraggeber;
    const ereignisseHTML = (m.ereignisse ?? []).map(e => `<li>${e}</li>`).join("");
    const content = [
      `<p><strong>Auftraggeber:</strong> ${auftraggeberHTML}</p>`,
      `<p><strong>Grobes Ziel:</strong> ${m.grobesZiel}</p>`,
      `<p><strong>Exaktes Ziel:</strong> ${m.exaktesZiel}</p>`,
      `<p><strong>Mögliche Ereignisse &amp; Komplikationen:</strong></p>`,
      `<ul>${ereignisseHTML}</ul>`,
      `<p><strong>Sonstiges:</strong> ${m.sonstiges}</p>`
    ].join("");

    return {
      _id: pageId,
      _key: `!journal.pages!${entryId}.${pageId}`,
      name: m.title,
      type: "text",
      title: { show: true, level: 1 },
      text: {
        content,
        format: 1,
        markdown: ""
      },
      sort: (i + 1) * 100000,
      ownership: { default: 2 },
      flags: {
        ashford: {
          auftraggeber: m.auftraggeber,
          auftraggeberUuid: npcUuid(m.auftraggeberId),
          grobesZiel: m.grobesZiel,
          exaktesZiel: m.exaktesZiel,
          ereignisse: m.ereignisse ?? [],
          sonstiges: m.sonstiges
        }
      },
      _stats: stats()
    };
  });

  const doc = {
    _id: entryId,
    _key: `!journal!${entryId}`,
    name: "Missionen & Schwarzes Brett von Ashford",
    pages,
    folder: null,
    sort: 0,
    ownership: { default: 2 },
    flags: {},
    categories: [],
    _stats: stats()
  };

  writeJSON(missionsDir, "missionen-schwarzes-brett.json", doc);
}

/* -------------------------------------------- */
/*  Talents (the closed 19-entry list, Abschnitt 5) */
/* -------------------------------------------- */

const talentsDir = ensureCleanDir("packs/_source/talents");

for (const talent of TALENTS) {
  const id = idFor(`talent-${talent.key}`);
  const doc = {
    _id: id,
    _key: `!items!${id}`,
    name: talent.name,
    type: "talent",
    img: talent.waffentalent ? "icons/skills/melee/weapons-crossed-swords-yellow.webp" : "icons/svg/d20-black.svg",
    system: {
      description: "",
      talentKey: talent.key,
      stufe: talent.stufe,
      staerken: 0,
      schwaechen: 0,
      waffentalent: !!talent.waffentalent,
      kategorie: talent.kategorie ?? ""
    },
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 2 },
    flags: {},
    _stats: stats()
  };

  writeJSON(talentsDir, `${talent.key}.json`, doc);
}

/* -------------------------------------------- */
/*  Traits (example Items)                       */
/* -------------------------------------------- */

const traitsDir = ensureCleanDir("packs/_source/traits");

const EXAMPLE_TRAITS = [
  {
    slug: "scharfschuetze",
    name: "Scharfschütze",
    kind: "strength",
    permanent: true,
    description: "Jahre der Übung mit dem Gewehr: gewährt einen zusätzlichen Würfel bei gezielten Fernkampfangriffen auf lange Distanz."
  },
  {
    slug: "zaeh",
    name: "Zäh",
    kind: "strength",
    permanent: true,
    description: "Ein Körper, der schon einiges überstanden hat: ein zusätzlicher Würfel, wenn es ums reine Durchhalten geht."
  },
  {
    slug: "erhoehte-position",
    name: "Erhöhte Position",
    kind: "strength",
    permanent: false,
    description: "Wer von oben kämpft oder beobachtet, hat den Vorteil – gilt nur für die aktuelle Situation, solange die Position tatsächlich hält."
  },
  {
    slug: "adrenalinschub",
    name: "Adrenalinschub",
    kind: "strength",
    permanent: false,
    description: "Der Kampf- oder Fluchtreflex kickt gerade voll ein: ein zusätzlicher Würfel für diesen einen, besonders hitzigen Moment."
  },
  {
    slug: "verwundet",
    name: "Verwundet",
    kind: "weakness",
    permanent: true,
    description: "Eine offene oder schlecht verheilte Wunde erschwert praktisch jede körperliche Anstrengung, bis sie ausheilt."
  },
  {
    slug: "nachtblind",
    name: "Nachtblind",
    kind: "weakness",
    permanent: true,
    description: "Im Dunkeln deutlich schlechter zu sehen als andere kostet regelmäßig einen Würfel bei nächtlichen Proben."
  },
  {
    slug: "erschoepft",
    name: "Erschöpft",
    kind: "weakness",
    permanent: false,
    description: "Schlaflos, ausgelaugt, am Ende der Kräfte – nur für die aktuelle, besonders anstrengende Situation."
  },
  {
    slug: "traumatisiert",
    name: "Traumatisiert",
    kind: "weakness",
    permanent: true,
    description: "Ein Erlebnis, das nachwirkt: unter Stress oder in ähnlichen Situationen ein Würfel weniger."
  }
];

for (const trait of EXAMPLE_TRAITS) {
  const id = idFor(`trait-${trait.slug}`);
  const doc = {
    _id: id,
    _key: `!items!${id}`,
    name: trait.name,
    type: "trait",
    img: trait.kind === "strength" ? "icons/svg/upgrade.svg" : "icons/svg/downgrade.svg",
    system: {
      description: `<p>${trait.description}</p>`,
      kind: trait.kind,
      permanent: trait.permanent
    },
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 2 },
    flags: {},
    _stats: stats()
  };

  writeJSON(traitsDir, `${trait.slug}.json`, doc);
}

console.log(
  `\nFertig: ${Object.keys(persons).length} NPCs, ${buildings.length} Gebäude, ${missions.length} Missionen, ${TALENTS.length} Talente, ${EXAMPLE_TRAITS.length} Traits.`
);
