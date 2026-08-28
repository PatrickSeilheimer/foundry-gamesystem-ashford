const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const { renderTemplate, loadTemplates } = foundry.applications.handlebars;

const TEMPLATE_ROOT = "systems/ashford/templates/apps/codex";
const TEMPLATES = {
  shell: `${TEMPLATE_ROOT}/codex-shell.hbs`,
  buildings: `${TEMPLATE_ROOT}/_buildings.hbs`,
  buildingDetail: `${TEMPLATE_ROOT}/_building-detail.hbs`,
  persons: `${TEMPLATE_ROOT}/_persons.hbs`,
  personDetail: `${TEMPLATE_ROOT}/_person-detail.hbs`,
  missions: `${TEMPLATE_ROOT}/_missions.hbs`,
  missionDetail: `${TEMPLATE_ROOT}/_mission-detail.hbs`,
  statistics: `${TEMPLATE_ROOT}/_statistics.hbs`
};

const AGE_BRACKETS = ["≤10", "11–16", "17–24", "25–34", "35–50", "50–70", ">70"];

/**
 * The "Ashford Kodex" — a browsable in-game reference of the home base
 * (buildings, persons, missions, live demographics), built directly on top
 * of the ashford.codex-npcs / codex-buildings / codex-missions compendium
 * packs. Structurally it mirrors the static lagerakte_turmheim.html mockup
 * this was ported from: one shell (nav + content slot) and a handful of
 * showX()-style render methods that fetch data, build a context and swap
 * a rendered partial into the content slot — just Foundry-native and
 * data-driven instead of hardcoded JS objects.
 */
class AshfordCodex extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ashford-codex",
    classes: ["ashford-codex"],
    tag: "div",
    window: {
      title: "ASHFORD.Codex.title",
      icon: "fa-solid fa-book-open",
      resizable: true
    },
    position: {
      width: 1000,
      height: 720
    }
  };

  static PARTS = {
    shell: { template: TEMPLATES.shell }
  };

  /** @type {AshfordCodex|null} */
  static #instance = null;

  /** Open (or focus) the single shared Kodex window. */
  static open() {
    if (!AshfordCodex.#instance) AshfordCodex.#instance = new AshfordCodex();
    const app = AshfordCodex.#instance;
    app.render(true);
    app.bringToFront?.();
    return app;
  }

  /** Which view is currently shown in the content slot, so a re-render (e.g. locale change) can restore it. */
  #state = { view: "buildings", id: null };

  /** @type {HTMLElement|null} */
  #contentEl = null;

  /** Guards against binding the delegated click listener more than once. */
  #delegated = false;

  /** @override */
  async _prepareContext(_options) {
    return {};
  }

  /** @override */
  _onRender(_context, _options) {
    this.#contentEl = this.element.querySelector("[data-codex-content]");
    if (!this.#delegated) {
      this.#delegated = true;
      this.element.addEventListener("click", this.#onContentClick.bind(this));
    }
    // Fire-and-forget: repopulate whatever view we were last showing.
    this.#renderCurrentView();
  }

  /* -------------------------------------------- */
  /*  Event delegation                             */
  /* -------------------------------------------- */

  #onContentClick(event) {
    const navBtn = event.target.closest("[data-nav]");
    if (navBtn) {
      event.preventDefault();
      this.#dispatchNav(navBtn.dataset.nav);
      return;
    }

    const backBtn = event.target.closest("[data-back]");
    if (backBtn) {
      event.preventDefault();
      this.#dispatchNav(backBtn.dataset.back);
      return;
    }

    // Checked before building/mission card handlers so a person link nested
    // inside a building or mission card takes priority over the card itself.
    const personLink = event.target.closest("[data-person-id]");
    if (personLink) {
      event.preventDefault();
      this._renderPersonDetail(personLink.dataset.personId);
      return;
    }

    const buildingLink = event.target.closest("[data-building-slug]");
    if (buildingLink) {
      event.preventDefault();
      this._renderBuildingDetail(buildingLink.dataset.buildingSlug);
      return;
    }

    const missionCard = event.target.closest("[data-mission-id]");
    if (missionCard) {
      event.preventDefault();
      this._renderMissionDetail(missionCard.dataset.missionId);
    }
  }

  #dispatchNav(nav) {
    switch (nav) {
      case "buildings": return this._renderBuildings();
      case "persons": return this._renderPersons();
      case "missions": return this._renderMissions();
      case "stats": return this._renderStatistics();
      default: return this._renderBuildings();
    }
  }

  #renderCurrentView() {
    const { view, id } = this.#state;
    switch (view) {
      case "buildings": return this._renderBuildings();
      case "building-detail": return this._renderBuildingDetail(id);
      case "persons": return this._renderPersons();
      case "person-detail": return this._renderPersonDetail(id);
      case "missions": return this._renderMissions();
      case "mission-detail": return this._renderMissionDetail(id);
      case "stats": return this._renderStatistics();
      default: return this._renderBuildings();
    }
  }

  #setActiveNav(key) {
    this.element.querySelectorAll("[data-nav]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.nav === key);
    });
  }

  #setContent(html) {
    if (this.#contentEl) this.#contentEl.innerHTML = html;
  }

  /* -------------------------------------------- */
  /*  Data access helpers                          */
  /* -------------------------------------------- */

  #getNpcPack() {
    return game.packs.get("ashford.codex-npcs") ?? null;
  }

  async #getNpcDocuments() {
    const pack = this.#getNpcPack();
    return pack ? pack.getDocuments() : [];
  }

  async #getSingleJournal(packId) {
    const pack = game.packs.get(packId);
    if (!pack) return null;
    const docs = await pack.getDocuments();
    return docs[0] ?? null;
  }

  async #getBuildingPages() {
    const journal = await this.#getSingleJournal("ashford.codex-buildings");
    if (!journal) return [];
    return [...journal.pages].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }

  async #findBuildingPage(slugOrId) {
    const pages = await this.#getBuildingPages();
    return pages.find(p => p.flags?.ashford?.slug === slugOrId) ?? pages.find(p => p.id === slugOrId) ?? null;
  }

  async #getMissionPages() {
    const journal = await this.#getSingleJournal("ashford.codex-missions");
    if (!journal) return [];
    return [...journal.pages].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
  }

  async #findMissionPage(id) {
    const pages = await this.#getMissionPages();
    return pages.find(p => p.id === id) ?? null;
  }

  /**
   * Enrich an HTML string (so @UUID[Actor.xxx]{Label} content links become
   * real, clickable links) — feature-detecting the v13 namespaced TextEditor
   * before falling back to the older global.
   */
  async #enrich(html) {
    if (!html) return "";
    try {
      const impl = foundry.applications?.ux?.TextEditor?.implementation;
      if (impl?.enrichHTML) return await impl.enrichHTML(html, { async: true });
      if (globalThis.TextEditor?.enrichHTML) return await globalThis.TextEditor.enrichHTML(html, { async: true });
    } catch (err) {
      console.error("Ashford Kodex | enrichHTML failed", err);
    }
    return html;
  }

  #hasPortrait(img) {
    return !!img && !img.includes("mystery-man");
  }

  #initialsFrom(name) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /** Strip HTML down to plain text and clamp it to roughly maxLen characters, breaking on a word boundary. */
  #excerpt(html, maxLen = 200) {
    if (!html) return "";
    const div = document.createElement("div");
    div.innerHTML = html;
    const text = (div.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    if (text.length <= maxLen) return text;
    const cut = text.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLen)}…`;
  }

  /** Person card excerpt: prefer the first sentence of the story, falling back to a clamped excerpt. */
  #personExcerpt(storyHtml) {
    const div = document.createElement("div");
    div.innerHTML = storyHtml ?? "";
    const text = (div.textContent ?? "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const idx = text.indexOf(". ");
    if (idx > -1 && idx < 220) return text.slice(0, idx + 1);
    return this.#excerpt(storyHtml, 160);
  }

  /* -------------------------------------------- */
  /*  Views                                        */
  /* -------------------------------------------- */

  /** Grid of building cards — mirrors showBuildings(). */
  async _renderBuildings() {
    this.#state = { view: "buildings", id: null };
    this.#setActiveNav("buildings");
    const pages = await this.#getBuildingPages();
    const buildings = [];
    for (const page of pages) {
      const flags = page.flags?.ashford ?? {};
      let responsible = null;
      if (flags.npcUuid) {
        const actor = await fromUuid(flags.npcUuid);
        if (actor) responsible = { id: actor.id, name: actor.name };
      }
      buildings.push({
        slug: flags.slug || page.id,
        name: page.name,
        badge: flags.badge ?? "",
        tier: flags.tier ?? "",
        excerpt: this.#excerpt(page.text?.content, 220),
        responsible,
        npcNote: flags.npcNote ?? null
      });
    }
    this.#setContent(await renderTemplate(TEMPLATES.buildings, { buildings }));
  }

  /** Full building writeup — an addition beyond the reference mockup (its desc always fit on the card; ours may not). */
  async _renderBuildingDetail(slug) {
    const page = await this.#findBuildingPage(slug);
    if (!page) return this._renderBuildings();
    const flags = page.flags?.ashford ?? {};
    let responsible = null;
    if (flags.npcUuid) {
      const actor = await fromUuid(flags.npcUuid);
      if (actor) responsible = { id: actor.id, name: actor.name };
    }
    this.#state = { view: "building-detail", id: flags.slug || page.id };
    this.#setActiveNav("buildings");
    const contentHTML = await this.#enrich(page.text?.content ?? "");
    this.#setContent(await renderTemplate(TEMPLATES.buildingDetail, {
      name: page.name,
      badge: flags.badge ?? "",
      tier: flags.tier ?? "",
      contentHTML,
      responsible,
      npcNote: flags.npcNote ?? null
    }));
  }

  /** Grid of person cards — mirrors showPersons(). */
  async _renderPersons() {
    this.#state = { view: "persons", id: null };
    this.#setActiveNav("persons");
    const actors = await this.#getNpcDocuments();
    const persons = actors
      .map(a => ({
        id: a.id,
        name: a.name,
        role: a.system.role ?? "",
        initials: a.system.initials || this.#initialsFrom(a.name),
        img: this.#hasPortrait(a.img) ? a.img : null,
        excerpt: this.#personExcerpt(a.system.story)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
    this.#setContent(await renderTemplate(TEMPLATES.persons, { persons }));
  }

  /** Person writeup — mirrors showPersonDetail(id). */
  async _renderPersonDetail(id) {
    const pack = this.#getNpcPack();
    const actor = pack ? await pack.getDocument(id) : null;
    if (!actor) return this._renderPersons();

    this.#state = { view: "person-detail", id };
    this.#setActiveNav("persons");

    const sys = actor.system;
    const facts = [];
    for (const f of sys.facts ?? []) {
      facts.push({ label: f.label, valueHTML: await this.#enrich(f.value) });
    }
    const storyHTML = await this.#enrich(sys.story ?? "");

    let buildingLink = null;
    let noteHTML = null;
    if (sys.buildingId) {
      const page = await this.#findBuildingPage(sys.buildingId);
      if (page) {
        const flags = page.flags?.ashford ?? {};
        buildingLink = { slug: flags.slug || page.id, name: page.name };
      }
    }
    if (!buildingLink) noteHTML = await this.#enrich(sys.note ?? "");

    const healthRes = sys.resources?.health ?? null;
    const health = healthRes?.max
      ? { value: healthRes.value, max: healthRes.max, pct: Math.round((healthRes.value / healthRes.max) * 100) }
      : null;

    this.#setContent(await renderTemplate(TEMPLATES.personDetail, {
      name: actor.name,
      role: sys.role ?? "",
      initials: sys.initials || this.#initialsFrom(actor.name),
      img: this.#hasPortrait(actor.img) ? actor.img : null,
      facts,
      storyHTML,
      buildingLink,
      noteHTML,
      health
    }));
  }

  /** Grid of mission cards — mirrors showMissions(). */
  async _renderMissions() {
    this.#state = { view: "missions", id: null };
    this.#setActiveNav("missions");
    const pages = await this.#getMissionPages();
    const missions = [];
    for (const page of pages) {
      const flags = page.flags?.ashford ?? {};
      let auftraggeberId = null;
      if (flags.auftraggeberUuid) {
        const actor = await fromUuid(flags.auftraggeberUuid);
        if (actor) auftraggeberId = actor.id;
      }
      missions.push({
        id: page.id,
        title: page.name,
        grobesZiel: flags.grobesZiel ?? "",
        exaktesZiel: flags.exaktesZiel ?? "",
        auftraggeber: flags.auftraggeber ?? "",
        auftraggeberId
      });
    }
    this.#setContent(await renderTemplate(TEMPLATES.missions, { missions }));
  }

  /** Mission writeup — mirrors showMissionDetail(id). */
  async _renderMissionDetail(id) {
    const page = await this.#findMissionPage(id);
    if (!page) return this._renderMissions();
    this.#state = { view: "mission-detail", id };
    this.#setActiveNav("missions");
    const flags = page.flags?.ashford ?? {};
    let auftraggeberId = null;
    if (flags.auftraggeberUuid) {
      const actor = await fromUuid(flags.auftraggeberUuid);
      if (actor) auftraggeberId = actor.id;
    }
    this.#setContent(await renderTemplate(TEMPLATES.missionDetail, {
      title: page.name,
      auftraggeber: flags.auftraggeber ?? "",
      auftraggeberId,
      grobesZiel: flags.grobesZiel ?? "",
      exaktesZiel: flags.exaktesZiel ?? "",
      ereignisse: flags.ereignisse ?? [],
      sonstiges: flags.sonstiges ?? ""
    }));
  }

  /** Live demographics — mirrors showStatistics()/computeStats()/barsHTML(). */
  async _renderStatistics() {
    this.#state = { view: "stats", id: null };
    this.#setActiveNav("stats");
    const actors = await this.#getNpcDocuments();
    const stats = this.#computeStats(actors);
    this.#setContent(await renderTemplate(TEMPLATES.statistics, stats));
  }

  #bars(dataObj, orderedLabels) {
    const labels = orderedLabels ?? Object.keys(dataObj).sort((a, b) => (dataObj[b] ?? 0) - (dataObj[a] ?? 0));
    const max = Math.max(...labels.map(l => dataObj[l] ?? 0), 1);
    return labels.map(l => {
      const v = dataObj[l] ?? 0;
      const pct = Math.max(Math.round((v / max) * 100), v > 0 ? 3 : 0);
      return { label: l, value: v, pct };
    });
  }

  #computeStats(actors) {
    const metas = actors.map(a => a.system.meta ?? {});
    const total = actors.length;

    const tally = fn => {
      const m = {};
      metas.forEach(meta => {
        const raw = fn(meta);
        const k = raw && String(raw).trim() ? raw : "Unbekannt";
        m[k] = (m[k] ?? 0) + 1;
      });
      return m;
    };

    const genderRaw = tally(m => m.gender);
    const gender = {
      Weiblich: genderRaw.w ?? 0,
      Männlich: genderRaw.m ?? 0,
      Divers: genderRaw.d ?? 0
    };

    const ageCounts = {};
    AGE_BRACKETS.forEach(b => (ageCounts[b] = 0));
    metas.forEach(m => {
      const a = m.age;
      if (a === undefined || a === null) return;
      let bracket;
      if (a <= 10) bracket = AGE_BRACKETS[0];
      else if (a <= 16) bracket = AGE_BRACKETS[1];
      else if (a <= 24) bracket = AGE_BRACKETS[2];
      else if (a <= 34) bracket = AGE_BRACKETS[3];
      else if (a <= 50) bracket = AGE_BRACKETS[4];
      else if (a <= 70) bracket = AGE_BRACKETS[5];
      else bracket = AGE_BRACKETS[6];
      ageCounts[bracket]++;
    });

    const relationship = tally(m => m.relationship);
    const workplace = tally(m => m.workplace);
    const nationality = tally(m => m.nationality);

    return {
      total,
      female: gender.Weiblich,
      male: gender.Männlich,
      children: relationship.Kind ?? 0,
      genderBars: this.#bars(gender, ["Weiblich", "Männlich", "Divers"]),
      ageBars: this.#bars(ageCounts, AGE_BRACKETS),
      relationshipBars: this.#bars(relationship),
      workplaceBars: this.#bars(workplace),
      nationalityBars: this.#bars(nationality)
    };
  }
}

/**
 * Wires up every way to reach the Kodex. Called once, synchronously, at
 * module load time by ashford.mjs — so this must only register Hooks.on
 * listeners here; nothing here may touch `game`/`canvas` directly until a
 * hook actually fires.
 */
export default function registerCodexControls() {
  Hooks.once("init", () => {
    loadTemplates(Object.values(TEMPLATES)).catch(err => {
      console.error("Ashford Kodex | Failed to preload templates", err);
    });
  });

  // (a) Reliable primary entry point for players & GM alike: a button in the Journal Directory header.
  Hooks.on("renderJournalDirectory", (_app, html) => {
    try {
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (!root || root.querySelector(".ashford-codex-open-btn")) return;
      const target =
        root.querySelector(".header-actions") ??
        root.querySelector(".action-buttons") ??
        root.querySelector(".directory-header") ??
        root;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ashford-codex-open-btn";
      btn.textContent = game.i18n.localize("ASHFORD.Codex.openCodex");
      btn.addEventListener("click", event => {
        event.preventDefault();
        AshfordCodex.open();
      });
      target.append(btn);
    } catch (err) {
      console.error("Ashford Kodex | Failed to add the Journal Directory button", err);
    }
  });

  // (b) Best-effort scene control tool (v13 object-keyed controls/tools shape). Never allowed to break the rest of the UI.
  Hooks.on("getSceneControlButtons", controls => {
    try {
      const notes = controls?.notes;
      if (!notes || typeof notes !== "object") return;
      notes.tools ??= {};
      notes.tools.ashfordCodex = {
        name: "ashfordCodex",
        title: "ASHFORD.Codex.openCodex",
        icon: "fa-solid fa-book-open",
        button: true,
        order: Object.keys(notes.tools).length,
        onChange: () => AshfordCodex.open(),
        onClick: () => AshfordCodex.open()
      };
    } catch (err) {
      console.error("Ashford Kodex | Failed to add the scene control button", err);
    }
  });

  // (c) Macro-callable escape hatch, independent of any UI entry point.
  Hooks.once("ready", () => {
    game.ashford ??= {};
    game.ashford.openCodex = () => AshfordCodex.open();
    game.ashford.AshfordCodex = AshfordCodex;
  });
}
