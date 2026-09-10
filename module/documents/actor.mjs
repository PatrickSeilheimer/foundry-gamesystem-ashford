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

  /**
   * Infektions-Gegner (0-7) verschieben — für den GM-Tracker (module/apps/infection-tracker.mjs)
   * UND für Items wie Antimykotikum/Desinfektionsmittel, die den Wert ohne GM-Eingriff direkt
   * beeinflussen (module/documents/item.mjs#useConsumable). Clamped 0-7 durch base-actor.mjs.
   */
  async applyInfectionDelta(delta) {
    if (!delta) return this;
    const current = this.system.resources?.infection?.value ?? 0;
    return this.update({ "system.resources.infection.value": current + delta });
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

  /**
   * Rolls a consumable's healing dice (e.g. Adrenalin-Spritze) against the CURRENT Foundry target
   * if exactly one token is targeted, otherwise against this actor itself ("Ziel: anvisiert oder
   * self" — same targeting convention as the attack-roll dialog), and posts a chat card with the
   * result. Ticks down usesRemaining right away ("der Würfel wird automatisch gefeuert"), but does
   * NOT apply the healing to the target's HP itself — a player using this on someone else's
   * character often lacks OWNER permission on that actor, so the actual Actor#update has to happen
   * from the GM's own client. Instead, the chat card carries Normal/Doppelt/Halbiert buttons that
   * only the GM sees, and clicking one applies the (possibly scaled) amount — see
   * module/apps/heal-confirm-chat.mjs.
   */
  async rollConsumableHeal(itemId) {
    const item = this.items.get(itemId);
    if (!item || item.type !== "consumable") return ui.notifications?.warn("Gegenstand nicht gefunden.");
    const formula = item.system.healFormula?.trim();
    if (!formula) return ui.notifications?.warn(`${item.name} hat keinen Heilungswürfel eingetragen.`);
    if (item.system.usesRemaining <= 0) return ui.notifications?.warn(`${item.name} ist aufgebraucht.`);

    const targetToken = game.user?.targets?.size === 1 ? [...game.user.targets][0] : null;
    const targetActor = targetToken?.actor ?? this;
    const isSelf = targetActor === this;

    const roll = new Roll(formula);
    await roll.evaluate();
    await item.update({ "system.usesRemaining": item.system.usesRemaining - 1 });

    const flavor = `${this.name} injiziert ${isSelf ? "sich selbst" : targetActor.name} eine ${item.name}.`;
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/chat/heal-confirm-card.hbs",
      { itemName: item.name, targetName: targetActor.name, amount: roll.total, resolved: false }
    );

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor,
      content,
      flags: {
        ashford: {
          healConfirm: {
            targetUuid: targetActor.uuid,
            targetName: targetActor.name,
            itemName: item.name,
            amount: roll.total,
            resolved: false
          }
        }
      }
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

  /**
   * "Entzündet" a one-shot light consumable (e.g. Streichhölzer): applies its light immediately,
   * ticks down usesRemaining, and after `lightSource.durationSeconds` falls back to whatever a
   * currently-active equipped light source (e.g. Taschenlampe) would produce, via refreshLightSources
   * — or off entirely if none is active. The burn-out timer is a plain client-side setTimeout, since
   * Foundry has no server-side scheduled jobs: it only fires if THIS client stays open for the full
   * duration. That's an accepted approximation ("brennt für eine Minute", nicht rundenbasiert) — if
   * the tab closes early, the light simply stays lit until the next time anything calls
   * refreshLightSources() (e.g. toggling a light-capable equipment item).
   */
  async igniteConsumableLight(itemId) {
    const item = this.items.get(itemId);
    if (!item || item.type !== "consumable") return ui.notifications?.warn("Gegenstand nicht gefunden.");
    const cfg = item.system.lightSource;
    if (!cfg?.enabled) return ui.notifications?.warn(`${item.name} kann nicht entzündet werden.`);
    if (item.system.usesRemaining <= 0) return ui.notifications?.warn(`${item.name} ist aufgebraucht.`);

    await item.update({ "system.usesRemaining": item.system.usesRemaining - 1 });

    const light = { dim: cfg.dim, bright: cfg.bright, angle: cfg.angle, color: cfg.color || null };
    await this.update({ "prototypeToken.light": light });
    const tokenDocs = this.getActiveTokens(false, true);
    if (tokenDocs.length) await Promise.all(tokenDocs.map(td => td.update({ light })));

    const minutes = Math.round((cfg.durationSeconds / 60) * 10) / 10;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p><strong>${item.name}</strong> entzündet — brennt ca. ${minutes} Minute(n).</p>`
    });

    setTimeout(() => this.refreshLightSources(), cfg.durationSeconds * 1000);
    return light;
  }

  /**
   * Recomputes token light emission from any currently-active "lightSource" equipment (e.g. an
   * activated Taschenlampe, toggled via AshfordItem#toggleLightSource) and pushes it to every
   * placed token AND the prototype token (so a freshly dropped token keeps the same state). A
   * light with angle < 360 automatically follows the token's facing/rotation in Foundry — no
   * extra rotation-tracking code needed. If more than one light source is active at once, the
   * brightest one wins rather than stacking additively (Foundry tokens only carry one light config).
   */
  async refreshLightSources() {
    const active = this.items
      .filter(i => i.type === "equipment" && i.system.lightSource?.enabled && i.system.lightSource?.active)
      .sort((a, b) => b.system.lightSource.bright - a.system.lightSource.bright)[0];

    const light = active
      ? {
          dim: active.system.lightSource.dim,
          bright: active.system.lightSource.bright,
          angle: active.system.lightSource.angle,
          color: active.system.lightSource.color || null
        }
      : { dim: 0, bright: 0, angle: 360, color: null };

    await this.update({ "prototypeToken.light": light });
    const tokenDocs = this.getActiveTokens(false, true);
    if (tokenDocs.length) await Promise.all(tokenDocs.map(td => td.update({ light })));
    return light;
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
