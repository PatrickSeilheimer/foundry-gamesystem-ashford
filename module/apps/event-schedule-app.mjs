import {
  formatWorldClock,
  getCurrentClockMinutes,
  getScheduledEvents,
  addScheduledEvent,
  removeScheduledEvent,
  CLOCK_SETTING_KEY,
  EVENTS_SETTING_KEY
} from "./world-clock.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const TEMPLATE = "systems/ashford/templates/apps/event-schedule.hbs";

/** "in 2 Std 15 Min" — 0/negative reads as "jetzt fällig" (its atMinutes already passed, but it
 * hasn't been crossed by an actual advanceWorldClock() call yet — e.g. after the GM wound the clock
 * back manually). */
function formatRelative(deltaMinutes) {
  if (deltaMinutes <= 0) return "jetzt fällig";
  const days = Math.floor(deltaMinutes / 1440);
  const hours = Math.floor((deltaMinutes % 1440) / 60);
  const minutes = deltaMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days} Tag(e)`);
  if (hours) parts.push(`${hours} Std`);
  if (minutes || !parts.length) parts.push(`${minutes} Min`);
  return `in ${parts.join(" ")}`;
}

/**
 * GM-only tool: an overview of every one-shot scheduled event (module/apps/world-clock.mjs), each
 * shown with BOTH its fixed clock time and a live "in X" countdown from right now, plus a small form
 * to plan a new one either by relative offset (Tage/Stunden/Minuten from now) or by a fixed absolute
 * Tag/Stunde/Minute — both just resolve to the same absolute `atMinutes` the event is stored as.
 */
export default class AshfordEventSchedule extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ashford-event-schedule",
    classes: ["ashford-event-schedule"],
    tag: "div",
    window: { title: "Geplante Ereignisse", icon: "fa-solid fa-bell", resizable: true },
    position: { width: 480, height: "auto" }
  };

  static PARTS = { body: { template: TEMPLATE } };

  /** @type {AshfordEventSchedule|null} */
  static #instance = null;

  static open() {
    if (!game.user.isGM) return null; // GM-only — Zeitplanung ist reines Spielleiter-Werkzeug
    AshfordEventSchedule.#instance ??= new AshfordEventSchedule();
    const app = AshfordEventSchedule.#instance;
    app.render(true);
    app.bringToFront?.();
    return app;
  }

  static refreshIfOpen() {
    if (AshfordEventSchedule.#instance?.rendered) AshfordEventSchedule.#instance.render();
  }

  #delegated = false;

  /** @override */
  async _prepareContext(_options) {
    const now = getCurrentClockMinutes();
    const events = [...getScheduledEvents()]
      .sort((a, b) => a.atMinutes - b.atMinutes)
      .map(e => ({
        id: e.id,
        label: e.label,
        absolute: formatWorldClock(e.atMinutes),
        relative: formatRelative(e.atMinutes - now)
      }));
    return { events, nowDay: Math.floor(now / 1440) + 1 };
  }

  /** @override */
  _onRender(_context, _options) {
    if (this.#delegated) return;
    this.#delegated = true;
    this.element.addEventListener("click", this.#onClick.bind(this));
  }

  #onClick(ev) {
    const modeRadio = ev.target.closest('[name="mode"]');
    if (modeRadio) {
      const form = modeRadio.closest("form");
      form.querySelector(".aes-mode-relative").hidden = modeRadio.value !== "relative";
      form.querySelector(".aes-mode-fixed").hidden = modeRadio.value !== "fixed";
      return;
    }

    if (ev.target.closest(".aes-add-btn")) return this.#onAdd(ev.target.closest("form"));

    const removeBtn = ev.target.closest(".aes-remove");
    if (removeBtn) return removeScheduledEvent(removeBtn.dataset.id).then(() => this.render());
  }

  async #onAdd(form) {
    const label = form.querySelector('[name="label"]')?.value?.trim();
    if (!label) return ui.notifications?.warn("Bitte eine Beschreibung für das Ereignis eingeben.");

    const mode = form.querySelector('[name="mode"]:checked')?.value ?? "relative";
    let atMinutes;
    if (mode === "fixed") {
      const day = Number(form.querySelector('[name="fixDay"]')?.value ?? 1);
      const hour = Number(form.querySelector('[name="fixHour"]')?.value ?? 0);
      const minute = Number(form.querySelector('[name="fixMinute"]')?.value ?? 0);
      atMinutes = (day - 1) * 1440 + hour * 60 + minute;
    } else {
      const days = Number(form.querySelector('[name="relDays"]')?.value ?? 0);
      const hours = Number(form.querySelector('[name="relHours"]')?.value ?? 0);
      const minutes = Number(form.querySelector('[name="relMinutes"]')?.value ?? 0);
      const offset = days * 1440 + hours * 60 + minutes;
      if (offset <= 0) return ui.notifications?.warn("Die relative Zeit muss größer als 0 sein.");
      atMinutes = getCurrentClockMinutes() + offset;
    }

    await addScheduledEvent(atMinutes, label);
    this.render();
  }
}

export function registerEventScheduleControls() {
  Hooks.on("ready", () => {
    game.ashford ??= {};
    game.ashford.openEventSchedule = () => AshfordEventSchedule.open();
  });

  Hooks.on("updateSetting", setting => {
    if (setting.key === EVENTS_SETTING_KEY || setting.key === CLOCK_SETTING_KEY) AshfordEventSchedule.refreshIfOpen();
  });
}
