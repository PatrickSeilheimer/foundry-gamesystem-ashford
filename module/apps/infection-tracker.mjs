const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const TEMPLATE = "systems/ashford/templates/apps/infection-tracker.hbs";

/**
 * GM-only window listing every player character's infection value (0-7) with +/- buttons.
 * Players never see this number anywhere on their own sheet (module/sheets/actor-sheet.mjs
 * gates the whole row on `game.user.isGM`) — this is the ONE place it's visible at all, and
 * only to the GM. Stays live: re-renders whenever a character actor updates, so it reflects
 * both GM edits here and player-triggered changes (e.g. using Antimykotikum).
 */
class AshfordInfectionTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ashford-infection-tracker",
    classes: ["ashford-infection-tracker"],
    tag: "div",
    window: { title: "Infektions-Tracker", icon: "fa-solid fa-virus", resizable: true },
    position: { width: 340, height: 480 }
  };

  static PARTS = {
    body: { template: TEMPLATE }
  };

  /** @type {AshfordInfectionTracker|null} */
  static #instance = null;

  static get instance() {
    return AshfordInfectionTracker.#instance;
  }

  /** Open (or focus) the single shared tracker window. GM-only — refuses for players. */
  static open() {
    if (!game.user.isGM) {
      ui.notifications?.warn("Nur der Spielleiter kann den Infektions-Tracker öffnen.");
      return null;
    }
    if (!AshfordInfectionTracker.#instance) AshfordInfectionTracker.#instance = new AshfordInfectionTracker();
    const app = AshfordInfectionTracker.#instance;
    app.render(true);
    app.bringToFront?.();
    return app;
  }

  /** @override */
  async _prepareContext(_options) {
    const actors = game.actors
      .filter(a => a.type === "character")
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        value: a.system.resources?.infection?.value ?? 0,
        max: a.system.resources?.infection?.max ?? 7
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
    return { actors };
  }

  /** @override */
  _onRender(_context, _options) {
    this.element.querySelectorAll(".infection-btn").forEach(btn => {
      btn.addEventListener("click", ev => {
        const row = ev.currentTarget.closest("[data-actor-id]");
        const actor = row && game.actors.get(row.dataset.actorId);
        if (!actor) return;
        const delta = ev.currentTarget.dataset.dir === "inc" ? 1 : -1;
        actor.applyInfectionDelta(delta);
      });
    });
  }
}

/** Wires up every way a GM can reach the tracker. Called once at module load (see ashford.mjs). */
export default function registerInfectionTrackerControls() {
  // (a) Button in the Actor Directory header — GM-only.
  Hooks.on("renderActorDirectory", (_app, html) => {
    if (!game.user.isGM) return;
    try {
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (!root || root.querySelector(".ashford-infection-open-btn")) return;
      const target =
        root.querySelector(".header-actions") ??
        root.querySelector(".action-buttons") ??
        root.querySelector(".directory-header") ??
        root;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ashford-infection-open-btn";
      btn.innerHTML = `<i class="fas fa-virus"></i> Infektions-Tracker`;
      btn.addEventListener("click", event => {
        event.preventDefault();
        AshfordInfectionTracker.open();
      });
      target.append(btn);
    } catch (err) {
      console.error("Ashford Infektions-Tracker | Failed to add the Actor Directory button", err);
    }
  });

  // (b) Best-effort scene control tool — GM-only.
  Hooks.on("getSceneControlButtons", controls => {
    if (!game.user.isGM) return;
    try {
      const notes = controls?.notes;
      if (!notes || typeof notes !== "object") return;
      notes.tools ??= {};
      notes.tools.ashfordInfection = {
        name: "ashfordInfection",
        title: "Infektions-Tracker",
        icon: "fa-solid fa-virus",
        button: true,
        order: Object.keys(notes.tools).length,
        onChange: () => AshfordInfectionTracker.open(),
        onClick: () => AshfordInfectionTracker.open()
      };
    } catch (err) {
      console.error("Ashford Infektions-Tracker | Failed to add the scene control button", err);
    }
  });

  // (c) Macro-callable escape hatch.
  Hooks.once("ready", () => {
    game.ashford ??= {};
    game.ashford.openInfectionTracker = () => AshfordInfectionTracker.open();
    game.ashford.AshfordInfectionTracker = AshfordInfectionTracker;
  });

  // Live refresh: any character update (GM edit here, or a player using an infection-affecting
  // item) re-renders the window while it's open.
  Hooks.on("updateActor", actor => {
    if (actor.type !== "character") return;
    if (AshfordInfectionTracker.instance?.rendered) AshfordInfectionTracker.instance.render();
  });
}
