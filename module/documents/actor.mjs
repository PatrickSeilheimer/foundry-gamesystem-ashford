import { rollDicePool } from "../dice/dice-pool.mjs";
import AshfordRollDialog from "../apps/roll-dialog.mjs";

export default class AshfordActor extends Actor {
  /** Open the Stärken/Schwächen roll dialog for this actor. */
  async rollPool({ label = "Probe" } = {}) {
    return AshfordRollDialog.prompt(this, { label });
  }

  /** Roll immediately without a dialog, e.g. from a macro or NPC quick-roll. */
  async quickRollPool({ label = "Probe", extraStrengths = 0, extraWeaknesses = 0 } = {}) {
    const { strengths, weaknesses } = this.system.permanentTraits ?? { strengths: [], weaknesses: [] };
    return rollDicePool({
      actor: this,
      label,
      basePool: this.system.dice?.basePool ?? 3,
      strengths: strengths.map(i => i.name),
      weaknesses: weaknesses.map(i => i.name),
      extraStrengths,
      extraWeaknesses
    });
  }
}
