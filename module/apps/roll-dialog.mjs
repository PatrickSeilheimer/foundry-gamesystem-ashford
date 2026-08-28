import { rollDicePool } from "../dice/dice-pool.mjs";

const { DialogV2 } = foundry.applications.api;

/**
 * Lets a player review the character's permanent Stärken/Schwächen and add
 * situational ones (a good position, an injury, darkness, ...) before a roll.
 */
export default class AshfordRollDialog {
  static async prompt(actor, { label = "Probe" } = {}) {
    const { strengths: permStrengths, weaknesses: permWeaknesses } = actor.system.permanentTraits ?? {
      strengths: [],
      weaknesses: []
    };

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/dice/roll-dialog.hbs",
      {
        label,
        permanentStrengths: permStrengths.map(i => ({ id: i.id, name: i.name })),
        permanentWeaknesses: permWeaknesses.map(i => ({ id: i.id, name: i.name }))
      }
    );

    return DialogV2.wait({
      window: { title: `${label} — Stärken & Schwächen` },
      content,
      buttons: [
        {
          action: "roll",
          label: "Würfeln",
          default: true,
          callback: (event, button) => {
            const form = button.form;
            const activeStrengths = Array.from(form.querySelectorAll('[data-kind="strength"]:checked')).map(
              el => el.dataset.name
            );
            const activeWeaknesses = Array.from(form.querySelectorAll('[data-kind="weakness"]:checked')).map(
              el => el.dataset.name
            );
            const extraStrengths = Number(form.querySelector('[name="extraStrengths"]')?.value ?? 0);
            const extraWeaknesses = Number(form.querySelector('[name="extraWeaknesses"]')?.value ?? 0);

            return rollDicePool({
              actor,
              label,
              basePool: actor.system.dice?.basePool ?? 3,
              strengths: activeStrengths,
              weaknesses: activeWeaknesses,
              extraStrengths,
              extraWeaknesses
            });
          }
        },
        { action: "cancel", label: "Abbrechen" }
      ]
    });
  }
}
