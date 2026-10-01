const TEMPLATE = "systems/ashford/templates/apps/world-clock.hbs";
const CLOCK_KEY = "worldClock";
const EVENTS_KEY = "scheduledEvents";

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
    await ChatMessage.create({
      whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id),
      content: `<p>⏰ <strong>${formatWorldClock(event.atMinutes)}</strong> — ${event.label}</p>`
    });
  }
  if (crossed.length) {
    const remaining = events.filter(e => !crossed.includes(e));
    await game.settings.set("ashford", EVENTS_KEY, remaining);
  }
  await game.settings.set("ashford", CLOCK_KEY, { totalMinutes: to });
  Hooks.callAll("ashfordTimeAdvanced", { fromMinutes: from, toMinutes: to });
}

async function scheduleEvent(offsetMinutes, label) {
  if (!game.user.isGM || !offsetMinutes || !label) return;
  const state = game.settings.get("ashford", CLOCK_KEY);
  const events = foundry.utils.deepClone(game.settings.get("ashford", EVENTS_KEY));
  events.push({ id: foundry.utils.randomID(), atMinutes: state.totalMinutes + offsetMinutes, label });
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

      if (ev.target.closest(".awc-schedule")) {
        const { DialogV2 } = foundry.applications.api;
        const result = await DialogV2.prompt({
          window: { title: "Ereignis planen" },
          content: `
            <label>In wie vielen Minuten? <input type="number" name="offset" value="60" min="1"></label>
            <label>Was passiert? <input type="text" name="label" placeholder="z.B. Funkgerät meldet sich"></label>
          `,
          ok: {
            label: "Planen",
            callback: (event, button) => ({
              offset: Number(button.form.querySelector('[name="offset"]')?.value ?? 0),
              label: button.form.querySelector('[name="label"]')?.value?.trim() ?? ""
            })
          }
        }).catch(() => null);
        if (result) await scheduleEvent(result.offset, result.label);
      }
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

/** Registers the two settings plus the always-on clock widget. Called once at module load. */
export default function registerWorldClockControls() {
  game.settings.register("ashford", CLOCK_KEY, { scope: "world", config: false, type: Object, default: DEFAULT_CLOCK });
  game.settings.register("ashford", EVENTS_KEY, { scope: "world", config: false, type: Array, default: [] });

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
