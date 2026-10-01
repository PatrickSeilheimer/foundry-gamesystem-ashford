const TEMPLATE = "systems/ashford/templates/chat/event-trigger-card.hbs";

/**
 * A scheduled event (module/apps/world-clock.mjs) first fires as a GM-only whisper card — the GM
 * might want to hold it back a beat for pacing, or decide it's not relevant after all. Clicking
 * "Veröffentlichen" posts the SAME text as a brand-new, fully public ChatMessage and marks the
 * original whisper card as done, so it can't be published twice.
 */
async function publishEvent(message) {
  if (!game.user.isGM) return;
  const data = message.getFlag("ashford", "eventTrigger");
  if (!data || data.published) return;

  await ChatMessage.create({
    content: `<p>⏰ <strong>${data.absolute}</strong> — ${data.label}</p>`
  });

  const newData = { ...data, published: true };
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, newData);
  await message.update({ content, "flags.ashford.eventTrigger": newData });
}

/** Renders the GM-only "Veröffentlichen" button; nothing to do for players since the card itself is
 * already whispered to the GM only (they'd never render it in the first place). */
function decorateEventCard(message, root) {
  if (!root || root.dataset.ashfordEventBound) return;
  const card = root.querySelector(".ashford-event-card");
  if (!card) return;
  root.dataset.ashfordEventBound = "1";
  if (!game.user.isGM) return;
  root.querySelector(".ashford-event-publish")?.addEventListener("click", () => publishEvent(message));
}

/** Wires the event-trigger chat card up for both the ApplicationV2 chat log (v13+, HTMLElement) and
 * the legacy jQuery-based hook, in case either fires for a given Foundry version. */
export default function registerEventTriggerChatControls() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    decorateEventCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
  Hooks.on("renderChatMessage", (message, html) => {
    decorateEventCard(message, html instanceof HTMLElement ? html : html?.[0]);
  });
}
