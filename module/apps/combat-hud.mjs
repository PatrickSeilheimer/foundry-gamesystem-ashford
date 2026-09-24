const TEMPLATE = "systems/ashford/templates/apps/combat-hud.hbs";

/**
 * A Baldur's-Gate-3/Divinity-Original-Sin-2-style turn-order bar: a row of portraits fixed to the
 * top-center of the screen while a Combat is active, current turn's portrait enlarged/highlighted,
 * everyone else smaller and dimmed. Deliberately NOT a Foundry ApplicationV2 window — no title bar,
 * no drag handle, no close button; it's a passive HUD overlay that shows/hides itself, not something
 * the user opens or positions. Plain DOM + Handlebars instead, appended once to <body>.
 */
class AshfordCombatHud {
  /** @type {AshfordCombatHud|null} */
  static #instance = null;

  /** @type {HTMLElement|null} */
  element = null;

  static get instance() {
    AshfordCombatHud.#instance ??= new AshfordCombatHud();
    return AshfordCombatHud.#instance;
  }

  ensureElement() {
    if (this.element) return this.element;
    const el = document.createElement("div");
    el.id = "ashford-combat-hud";
    el.hidden = true;
    document.body.appendChild(el);
    // Klick auf ein Portrait: springt mit der Kamera zum zugehörigen Token und wählt es aus --
    // reine Ansichts-Bequemlichkeit, verändert keinen Spielzustand (kein Zug-Skip o.ä.).
    el.addEventListener("click", ev => {
      const portrait = ev.target.closest("[data-combatant-id]");
      if (!portrait) return;
      const combatant = game.combat?.combatants.get(portrait.dataset.combatantId);
      const token = combatant?.token?.object;
      if (!token) return;
      token.control({ releaseOthers: true });
      canvas.animatePan({ x: token.center.x, y: token.center.y });
    });
    this.element = el;
    return el;
  }

  /** Rebuilds the whole bar from the currently-viewed Combat's turn order; hides itself when there's none. */
  async render() {
    const el = this.ensureElement();
    const combat = game.combat;
    const turns = combat?.turns ?? [];

    const combatants = turns
      .filter(c => !c.hidden || game.user.isGM) // versteckte Kämpfer bleiben für Spieler unsichtbar, wie im Standard-Tracker
      .map(c => {
        const health = c.actor?.system?.resources?.health;
        const healthPct = health?.max ? Math.max(0, Math.min(100, Math.round((health.value / health.max) * 100))) : 100;
        return {
          id: c.id,
          name: c.name,
          img: c.img || c.actor?.img || "icons/svg/mystery-man.svg",
          active: c.id === combat?.combatant?.id,
          defeated: !!c.isDefeated,
          healthPct
        };
      });

    if (!combatants.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.innerHTML = await foundry.applications.handlebars.renderTemplate(TEMPLATE, { combatants });
    el.hidden = false;
  }
}

/** Wires the HUD up to every Combat/Combatant lifecycle event, plus mid-fight HP changes. Called once at module load. */
export default function registerCombatHudControls() {
  const rerender = () => AshfordCombatHud.instance.render();

  Hooks.on("ready", () => {
    game.ashford ??= {};
    game.ashford.combatHud = AshfordCombatHud.instance;
    rerender();
  });

  Hooks.on("createCombat", rerender);
  Hooks.on("updateCombat", rerender);
  Hooks.on("deleteCombat", rerender);
  Hooks.on("createCombatant", rerender);
  Hooks.on("updateCombatant", rerender);
  Hooks.on("deleteCombatant", rerender);

  // Lebensbalken unter den Portraits sollen live mitgehen, wenn im Kampf Schaden/Heilung passiert.
  Hooks.on("updateActor", actor => {
    if (game.combat?.combatants.some(c => c.actor?.id === actor.id)) rerender();
  });
}
