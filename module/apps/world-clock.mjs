const TEMPLATE = "systems/ashford/templates/apps/world-clock.hbs";
const CLOCK_KEY = "worldClock";
const EVENTS_KEY = "scheduledEvents";

/** Full setting keys (as Foundry's Setting documents report them, "<namespace>.<key>") — exported so
 * module/apps/event-schedule-app.mjs can filter its own updateSetting hook without duplicating the
 * namespace string, or risking a circular import by pulling it from this file's own hook instead. */
export const CLOCK_SETTING_KEY = `ashford.${CLOCK_KEY}`;
export const EVENTS_SETTING_KEY = `ashford.${EVENTS_KEY}`;

/** Tag 1, 08:00 — beliebiger, aber sinnvoller Kampagnenstart. */
const DEFAULT_CLOCK = { totalMinutes: 8 * 60 };

export function formatWorldClock(totalMinutes) {
  const day = Math.floor(totalMinutes / 1440) + 1;
  const hour = Math.floor((totalMinutes % 1440) / 60);
  const minute = totalMinutes % 60;
  return `Tag ${day} · ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Die eigentliche Welt-Uhr: Gesamtminuten seit Kampagnenstart, in einem World-Setting gespeichert
 * (einzige Quelle der Wahrheit, repliziert sich über Foundrys eigenen Setting-Document-Mechanismus
 * an alle Clients). Nur der GM darf tatsächlich schreiben — Spieler sehen die Anzeige nur lesend.
 *
 * `scheduledEvents`: eine einfache Liste GM-angelegter Einmal-Ereignisse ({id, atMinutes, label}).
 * Beim Vorspulen (egal ob durch eine Rast oder manuell) werden alle Ereignisse, deren Zeitpunkt
 * dabei überschritten wird, der Reihe nach als GM-Flüsternachricht gepostet und danach entfernt —
 * "die Zeit rotiert durch", statt einfach stumm auf den neuen Wert zu springen.
 */
export async function advanceWorldClock(minutes) {
  if (!game.user.isGM) return; // siehe Kommentar oben — nur der GM-Client schreibt je dieses Setting
  if (!minutes) return;
  const state = game.settings.get("ashford", CLOCK_KEY);
  const from = state.totalMinutes;
  const to = Math.max(0, from + minutes);

  const events = game.settings.get("ashford", EVENTS_KEY);
  const crossed = events
    .filter(e => (minutes > 0 ? e.atMinutes > from && e.atMinutes <= to : e.atMinutes <= from && e.atMinutes > to))
    .sort((a, b) => (minutes > 0 ? a.atMinutes - b.atMinutes : b.atMinutes - a.atMinutes));
  for (const event of crossed) {
    // Trifft zunächst nur den GM (per Whisper) — die eigentliche Chatkarte trägt einen "Veröffentlichen"-
    // Button (module/apps/event-trigger-chat.mjs), falls der GM es erst noch zurückhalten will, bevor
    // alle Spieler es sehen.
    const eventData = { absolute: formatWorldClock(event.atMinutes), label: event.label, published: false };
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/chat/event-trigger-card.hbs",
      eventData
    );
    await ChatMessage.create({
      whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
      content,
      flags: { ashford: { eventTrigger: eventData } }
    });
  }
  if (crossed.length) {
    const remaining = events.filter(e => !crossed.includes(e));
    await game.settings.set("ashford", EVENTS_KEY, remaining);
  }
  await game.settings.set("ashford", CLOCK_KEY, { totalMinutes: to });
  Hooks.callAll("ashfordTimeAdvanced", { fromMinutes: from, toMinutes: to });
}

/** Current absolute clock value — used by module/apps/event-schedule-app.mjs to turn a relative
 * ("in 2 Stunden") offset into the absolute `atMinutes` every scheduled event is stored as. */
export function getCurrentClockMinutes() {
  return game.settings.get("ashford", CLOCK_KEY).totalMinutes;
}

export function getScheduledEvents() {
  return game.settings.get("ashford", EVENTS_KEY);
}

/** `atMinutes` is always absolute — callers (the relative-vs-fest UI) do that conversion themselves. */
export async function addScheduledEvent(atMinutes, label) {
  if (!game.user.isGM || !label) return;
  const events = foundry.utils.deepClone(getScheduledEvents());
  events.push({ id: foundry.utils.randomID(), atMinutes, label });
  await game.settings.set("ashford", EVENTS_KEY, events);
}

export async function removeScheduledEvent(id) {
  if (!game.user.isGM) return;
  const events = getScheduledEvents().filter(e => e.id !== id);
  await game.settings.set("ashford", EVENTS_KEY, events);
}

class AshfordWorldClock {
  static #instance = null;
  element = null;

  static get instance() {
    AshfordWorldClock.#instance ??= new AshfordWorldClock();
    return AshfordWorldClock.#instance;
  }

  ensureElement() {
    if (this.element) return this.element;
    const el = document.createElement("div");
    el.id = "ashford-world-clock";
    document.body.appendChild(el);
    el.addEventListener("click", async ev => {
      const advBtn = ev.target.closest("[data-minutes]");
      if (advBtn) return advanceWorldClock(Number(advBtn.dataset.minutes));

      if (ev.target.closest(".awc-schedule")) game.ashford?.openEventSchedule?.();
    });
    this.element = el;
    return el;
  }

  async render() {
    const el = this.ensureElement();
    const state = game.settings.get("ashford", CLOCK_KEY);
    el.innerHTML = await foundry.applications.handlebars.renderTemplate(TEMPLATE, {
      label: formatWorldClock(state.totalMinutes),
      isGM: game.user.isGM
    });
  }
}

/** Registers the two settings plus the always-on clock widget. Called once at module load — but
 * game.settings doesn't exist yet at that exact point (it's built in response to Foundry's own
 * "init" hook), so the actual settings.register() calls must wait for that hook, not run immediately. */
export default function registerWorldClockControls() {
  Hooks.once("init", () => {
    game.settings.register("ashford", CLOCK_KEY, { scope: "world", config: false, type: Object, default: DEFAULT_CLOCK });
    game.settings.register("ashford", EVENTS_KEY, { scope: "world", config: false, type: Array, default: [] });
  });

  Hooks.on("ready", () => {
    game.ashford ??= {};
    game.ashford.worldClock = AshfordWorldClock.instance;
    game.ashford.advanceWorldClock = advanceWorldClock;
    AshfordWorldClock.instance.render();
  });

  Hooks.on("updateSetting", setting => {
    if (setting.key === `ashford.${CLOCK_KEY}`) AshfordWorldClock.instance.render();
  });
}
