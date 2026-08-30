/**
 * The Ashford dice mechanic (ashford_system_spezifikation.md, Abschnitt 2):
 *
 *   Würfelzahl = 3 + Stärken − Schwächen   (Stärken 0-3, Schwächen 0-2, beide kombinierbar)
 *
 * Every die is an exploding W6: a rolled 6 triggers another W6 that gets
 * added, recursively. The result is the SUM of all dice, not a count of
 * successes. Success on a generic check is total ≥ Zielwert (Abschnitt 3);
 * success on an attack roll is total ≥ the target's Ausweichen (Abschnitt 4a).
 */

/** @returns {number} the number of d6 to roll, clamped to at least 1. */
export function computeDiceCount({ staerken = 0, schwaechen = 0 } = {}) {
  return Math.max(1, 3 + (staerken ?? 0) - (schwaechen ?? 0));
}

/**
 * Rolls `diceCount` exploding d6 and returns the evaluated Roll (its `.total`
 * is the sum of every die, including all explosions).
 * @param {number} diceCount
 * @returns {Promise<Roll>}
 */
export async function rollExplodingPool(diceCount) {
  const roll = new Roll(`${Math.max(1, diceCount)}d6x6`);
  await roll.evaluate();
  return roll;
}

/**
 * Rolls a full Ashford check and posts a chat card.
 * @param {object} options
 * @param {Actor} options.actor
 * @param {string} [options.label] - what the roll represents, e.g. "Schleichen" or "Pistolen (Angriff)"
 * @param {number} [options.staerken] - Stärken baked into the talent/base pool itself
 * @param {number} [options.schwaechen] - Schwächen baked into the talent/base pool itself
 * @param {string[]} [options.strengthNames] - names of active situational Stärken, for the chat card
 * @param {string[]} [options.weaknessNames] - names of active situational Schwächen, for the chat card
 * @param {number} [options.modifier] - flat modifier added after the dice sum (e.g. Reichweiten-Modifikator)
 * @param {string} [options.modifierLabel] - label for that flat modifier, shown on the card
 * @param {number|null} [options.target] - Zielwert or Ausweichen to beat; null = no pass/fail shown
 * @param {string} [options.targetLabel] - e.g. "Schwer (16)" or "Ausweichen (13)"
 * @param {boolean} [options.autoFail] - short-circuits to an automatic miss without rolling (außer Reichweite)
 * @param {string} [options.autoFailReason]
 */
export async function rollAshfordCheck({
  actor,
  label = "Probe",
  staerken = 0,
  schwaechen = 0,
  strengthNames = [],
  weaknessNames = [],
  modifier = 0,
  modifierLabel = "",
  target = null,
  targetLabel = "",
  autoFail = false,
  autoFailReason = ""
} = {}) {
  if (autoFail) {
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/chat/roll-card.hbs",
      { label, autoFail: true, autoFailReason }
    );
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: label,
      content
    });
  }

  const diceCount = computeDiceCount({ staerken, schwaechen });
  const roll = await rollExplodingPool(diceCount);
  const dice = (roll.dice[0]?.results ?? []).map(d => ({ result: d.result, exploded: !!d.exploded }));
  const total = roll.total + modifier;
  const success = target != null ? total >= target : null;

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ashford/templates/chat/roll-card.hbs",
    {
      label,
      diceCount,
      dice,
      diceTotal: roll.total,
      modifier,
      modifierLabel,
      total,
      target,
      targetLabel,
      success,
      strengthNames,
      weaknessNames
    }
  );

  return roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: label,
    content
  });
}
