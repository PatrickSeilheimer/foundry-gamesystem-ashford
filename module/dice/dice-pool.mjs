/**
 * The Ashford dice pool: roll X d6, where
 *   X = basePool + Stärken − Schwächen   (minimum 1)
 * Each die at or above the success threshold (world setting, default 5)
 * counts as one Erfolg.
 */

/** @returns {number} the number of d6 to roll, clamped to at least 1. */
export function computePoolSize({ basePool = 3, strengths = 0, weaknesses = 0 } = {}) {
  return Math.max(1, basePool + strengths - weaknesses);
}

/**
 * Roll the pool and post a chat card.
 * @param {object} options
 * @param {Actor} options.actor
 * @param {string} options.label - what the roll represents, e.g. "Schleichen"
 * @param {number} [options.basePool]
 * @param {string[]} [options.strengths] - names of active Stärken (permanent + situational)
 * @param {string[]} [options.weaknesses] - names of active Schwächen (permanent + situational)
 * @param {number} [options.extraStrengths] - ad-hoc Stärken without a named tag
 * @param {number} [options.extraWeaknesses] - ad-hoc Schwächen without a named tag
 */
export async function rollDicePool({
  actor,
  label = "Probe",
  basePool = 3,
  strengths = [],
  weaknesses = [],
  extraStrengths = 0,
  extraWeaknesses = 0
} = {}) {
  const threshold = game.settings.get("ashford", "successThreshold");
  const poolSize = computePoolSize({
    basePool,
    strengths: strengths.length + extraStrengths,
    weaknesses: weaknesses.length + extraWeaknesses
  });

  const roll = new Roll(`${poolSize}d6cs>=${threshold}`);
  await roll.evaluate();

  const dice = roll.dice[0]?.results ?? [];
  const successes = roll.total;

  const content = await foundry.applications.handlebars.renderTemplate(
    "systems/ashford/templates/chat/roll-card.hbs",
    {
      label,
      poolSize,
      threshold,
      successes,
      dice: dice.map(d => ({ result: d.result, success: d.result >= threshold })),
      strengths,
      weaknesses
    }
  );

  return roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: label,
    content
  });
}
