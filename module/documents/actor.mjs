import { rollAshfordCheck } from "../dice/dice-pool.mjs";
import AshfordRollDialog from "../apps/roll-dialog.mjs";
import { TALENTS } from "../rules/talents.mjs";

export default class AshfordActor extends Actor {
  /** Quick damage/heal from the header health popover — clamped to [0, max] by base-actor.mjs#prepareDerivedData. */
  async applyHealthDelta(delta) {
    if (!delta) return this;
    const current = this.system.resources?.health?.value ?? 0;
    return this.update({ "system.resources.health.value": current + delta });
  }

  /** 1W12 + Initiative-Mod, nicht explodierend (Abschnitt 4a) — separat vom Ashford-Würfelpool, direkt zu Foundrys Chat. */
  async rollInitiativeCheck() {
    const mod = this.system.derived?.initiativeMod ?? 0;
    const roll = new Roll("1d12 + @mod", { mod });
    await roll.evaluate();
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: "Initiative"
    });
  }

  /**
   * Rolls one equipped weapon's own damage dice (absolute, printed on the item — no talent or
   * Stärken/Schwächen involved). Melee weapons additionally add the character's Nahkampfschaden
   * (Kraft + Ausrüstungs-Boni, see AshfordCharacter#prepareDerivedData); ranged weapons don't.
   */
  async rollWeaponDamage(itemId) {
    const weapon = this.items.get(itemId);
    if (!weapon || weapon.type !== "weapon") return ui.notifications?.warn("Waffe nicht gefunden.");
    const formula = weapon.system.damageFormula?.trim();
    if (!formula) return ui.notifications?.warn(`${weapon.name} hat keinen Schadenswürfel eingetragen.`);

    const isMelee = !!weapon.system.weaponSkill && !weapon.system.isRanged;
    const meleeBonus = isMelee ? this.system.derived?.nahkampfschaden ?? 0 : 0;
    const fullFormula = meleeBonus ? `${formula} + ${meleeBonus}` : formula;

    const roll = new Roll(fullFormula);
    await roll.evaluate();
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${weapon.name} — Schaden`
    });
  }

  /** Open the roll dialog for one embedded talent Item (the normal way to roll in Ashford). */
  async rollTalent(talentId, options = {}) {
    const talent = this.items.get(talentId);
    if (!talent) return ui.notifications?.warn("Talent nicht gefunden.");
    return AshfordRollDialog.prompt(this, talent, options);
  }

  /**
   * Simple flat-pool roll for actors without a talent list (NPCs, Kreaturen)
   * or as a quick fallback. Still situational Stärken/Schwächen from
   * permanent traits, no talent-specific bonuses.
   */
  async quickRollPool({ label = "Probe", basePool = 3, extraStrengths = 0, extraWeaknesses = 0, target = null, targetLabel = "" } = {}) {
    const { strengths, weaknesses } = this.system.permanentTraits ?? { strengths: [], weaknesses: [] };
    const staerken = strengths.length + extraStrengths;
    const schwaechen = weaknesses.length + extraWeaknesses;
    // basePool ist bei Ashford immer 3 (Abschnitt 2.1); ein davon abweichender Wert (z.B. Kreaturen-Angriffspool)
    // wird als zusätzliche Stärke/Schwäche gegenüber der Basis von 3 eingerechnet.
    const delta = basePool - 3;
    return rollAshfordCheck({
      actor: this,
      label,
      staerken: staerken + Math.max(0, delta),
      schwaechen: schwaechen + Math.max(0, -delta),
      strengthNames: strengths.map(i => i.name),
      weaknessNames: weaknesses.map(i => i.name),
      target,
      targetLabel
    });
  }

  /** Creates any of the 19 canonical talents this actor doesn't have yet (fresh characters, or repairing an older sheet). */
  async ensureCanonicalTalents() {
    const existingKeys = new Set(
      this.items.filter(i => i.type === "talent").map(i => i.system.talentKey).filter(Boolean)
    );
    const missing = TALENTS.filter(t => !existingKeys.has(t.key));
    if (!missing.length) return [];
    const toCreate = missing.map(t => ({
      name: t.name,
      type: "talent",
      system: {
        talentKey: t.key,
        stufe: t.stufe,
        waffentalent: !!t.waffentalent,
        kategorie: t.kategorie ?? ""
      }
    }));
    return this.createEmbeddedDocuments("Item", toCreate);
  }
}
