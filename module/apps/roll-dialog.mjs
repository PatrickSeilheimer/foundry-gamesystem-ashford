import { rollAshfordCheck } from "../dice/dice-pool.mjs";
import { DIFFICULTIES } from "../rules/difficulty.mjs";
import { RANGED_WEAPON_TALENT_KEYS } from "../rules/talents.mjs";
import { rangeModifier } from "../rules/ranges.mjs";

const { DialogV2 } = foundry.applications.api;

/**
 * Lets a player review a talent's built-in Stärken/Schwächen, add situational
 * ones (a good position, an injury, darkness, ...), pick a Zielwert (or roll
 * an attack against a target's Ausweichen, with range banding for the four
 * Fernkampf-Waffentalente) before rolling.
 */
export default class AshfordRollDialog {
  static async prompt(actor, talent, { label } = {}) {
    const rollLabel = label ?? `${talent.name} (Stufe ${talent.system.stufe})`;
    const { strengths: permStrengths, weaknesses: permWeaknesses } = actor.system.permanentTraits ?? {
      strengths: [],
      weaknesses: []
    };

    const isRanged = RANGED_WEAPON_TALENT_KEYS.includes(talent.system.talentKey);
    const isWeapon = !!talent.system.waffentalent;

    const target = game.user?.targets?.size === 1 ? [...game.user.targets][0]?.actor : null;
    const targetAusweichen = target?.system?.derived?.ausweichen ?? null;

    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/dice/roll-dialog.hbs",
      {
        talentName: talent.name,
        baseStaerken: talent.system.staerken,
        baseSchwaechen: talent.system.schwaechen,
        permanentStrengths: permStrengths.map(i => ({ id: i.id, name: i.name })),
        permanentWeaknesses: permWeaknesses.map(i => ({ id: i.id, name: i.name })),
        difficulties: DIFFICULTIES,
        isWeapon,
        isRanged,
        targetName: target?.name ?? "",
        targetAusweichen
      }
    );

    return DialogV2.wait({
      window: { title: `${rollLabel} — Würfeln` },
      content,
      buttons: [
        {
          action: "roll",
          label: "Würfeln",
          default: true,
          callback: (event, button) => {
            const form = button.form;
            const activeStrengthNames = Array.from(
              form.querySelectorAll('[data-kind="strength"]:checked')
            ).map(el => el.dataset.name);
            const activeWeaknessNames = Array.from(
              form.querySelectorAll('[data-kind="weakness"]:checked')
            ).map(el => el.dataset.name);
            const extraStaerken = Number(form.querySelector('[name="extraStaerken"]')?.value ?? 0);
            const extraSchwaechen = Number(form.querySelector('[name="extraSchwaechen"]')?.value ?? 0);
            const flatModifier = Number(form.querySelector('[name="flatModifier"]')?.value ?? 0);

            const staerken = talent.system.staerken + activeStrengthNames.length + extraStaerken;
            const schwaechen = talent.system.schwaechen + activeWeaknessNames.length + extraSchwaechen;

            const mode = form.querySelector('[name="targetMode"]')?.value ?? "none";
            let targetValue = null;
            let targetLabel = "";
            let modifier = flatModifier;
            let autoFail = false;
            let autoFailReason = "";

            if (mode === "attack") {
              targetValue = Number(form.querySelector('[name="ausweichenValue"]')?.value ?? 0);
              targetLabel = `Ausweichen (${targetValue})`;
              if (isRanged) {
                const meters = Number(form.querySelector('[name="rangeMeters"]')?.value ?? 0);
                const mod = rangeModifier(talent.system.talentKey, meters);
                if (mod === null) {
                  autoFail = true;
                  autoFailReason = `Außer Reichweite (${meters} m)`;
                } else {
                  modifier += mod;
                  targetLabel += `, Reichweite ${meters} m (${mod >= 0 ? "+" : ""}${mod})`;
                }
              }
            } else if (mode === "difficulty") {
              const diffKey = form.querySelector('[name="difficulty"]')?.value;
              const diff = DIFFICULTIES.find(d => d.key === diffKey);
              if (diff) {
                targetValue = diff.target;
                targetLabel = `${diff.label} (${diff.target})`;
              }
            } else if (mode === "custom") {
              targetValue = Number(form.querySelector('[name="customTarget"]')?.value ?? 0);
              targetLabel = `Ziel ${targetValue}`;
            }

            return rollAshfordCheck({
              actor,
              label: rollLabel,
              staerken,
              schwaechen,
              strengthNames: activeStrengthNames,
              weaknessNames: activeWeaknessNames,
              modifier,
              modifierLabel: modifier ? "Modifikator" : "",
              target: targetValue,
              targetLabel,
              autoFail,
              autoFailReason
            });
          }
        },
        { action: "cancel", label: "Abbrechen" }
      ]
    });
  }
}
