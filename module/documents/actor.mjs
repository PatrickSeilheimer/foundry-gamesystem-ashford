import { rollAshfordCheck } from "../dice/dice-pool.mjs";
import AshfordRollDialog from "../apps/roll-dialog.mjs";
import { TALENTS } from "../rules/talents.mjs";
import { ARMOR_TYPE_LABELS, AMMO_TYPE_LABELS } from "../models/gear.mjs";

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
   * Full attack pipeline for the sheet's "Treffer"-Button (module/sheets/actor-sheet.mjs): rolls
   * the weapon's talent against the single currently-targeted token's Ausweichen (same dialog as
   * any other talent roll, module/apps/roll-dialog.mjs), then ticks the weapon's ammo down by
   * one — "unabhängig vom Erfolg wird Munition abgezogen" — and, only on a hit, pauses briefly for
   * pacing, posts a short success flavor message, and rolls damage against that same target (see
   * rollWeaponDamage below, which does the armor-reduction + auto-apply). Falls back to a plain
   * rollTalent (no ammo/damage follow-up) when nothing is targeted, since there'd be nothing to
   * resolve the hit against.
   *
   * Where the round count actually lives depends on feedType (module/models/gear.mjs): "internal"
   * (Schrotflinten/Revolver/Bögen) tracks it directly on the weapon's own ammoRemaining; "magazine"
   * (Pistolen/Gewehre) tracks it on the separately eingeloaded AshfordMagazine Item's roundsLoaded
   * instead (module/models/gear.mjs AshfordWeapon#loadedMagazine) — the weapon itself has no
   * magazine loaded until reloadWeapon() racks one.
   */
  async rollWeaponAttack(itemId) {
    const weapon = this.items.get(itemId);
    if (!weapon || weapon.type !== "weapon") return ui.notifications?.warn("Waffe nicht gefunden.");
    const talent = this.items.find(t => t.type === "talent" && t.system.talentKey === weapon.system.weaponSkill);
    if (!talent) return ui.notifications?.warn(`Kein passendes Talent für ${weapon.name} gefunden.`);

    const feedType = weapon.system.feedType;
    if (feedType === "internal" && weapon.system.ammoRemaining <= 0) {
      return ui.notifications?.warn(`${weapon.name} ist leer.`);
    }
    let loadedMagazine = null;
    if (feedType === "magazine") {
      loadedMagazine = weapon.system.loadedMagazineId ? this.items.get(weapon.system.loadedMagazineId) : null;
      if (!loadedMagazine) return ui.notifications?.warn(`${weapon.name} hat kein Magazin geladen.`);
      if (loadedMagazine.system.roundsLoaded <= 0) {
        return ui.notifications?.warn(`${weapon.name} ist leer (Magazin "${loadedMagazine.name}" leer).`);
      }
    }

    const targetToken = game.user?.targets?.size === 1 ? [...game.user.targets][0] : null;
    const targetActor = targetToken?.actor ?? null;
    if (!targetActor) return this.rollTalent(talent.id, { label: weapon.name });

    const result = await AshfordRollDialog.prompt(this, talent, { label: weapon.name, defaultMode: "attack" });
    if (!result || result === "cancel" || typeof result !== "object") return result;

    // Munitions-Abzug — welches Item (Waffe selbst oder das eingeladene Magazin) betroffen ist, hängt
    // vom feedType ab; ammoRestore hält fest, was/wo zurückzusetzen ist, falls der GM den Schaden
    // später über die Chat-Karte rückgängig macht (module/apps/damage-confirm-chat.mjs).
    let ammoRestore = null;
    if (feedType === "internal") {
      const cur = weapon.system.ammoRemaining;
      ammoRestore = { itemId: weapon.id, field: "system.ammoRemaining", value: cur };
      await weapon.update({ "system.ammoRemaining": Math.max(0, cur - 1) });
      if (cur - 1 <= 0) ui.notifications?.warn(`${weapon.name} ist jetzt leer.`);
    } else if (feedType === "magazine" && loadedMagazine) {
      const cur = loadedMagazine.system.roundsLoaded;
      ammoRestore = { itemId: loadedMagazine.id, field: "system.roundsLoaded", value: cur };
      await loadedMagazine.update({ "system.roundsLoaded": Math.max(0, cur - 1) });
      if (cur - 1 <= 0) ui.notifications?.warn(`${weapon.name} ist jetzt leer (Magazin "${loadedMagazine.name}" leer).`);
    }

    if (!result.success) return result.message;

    await new Promise(resolve => setTimeout(resolve, 700));
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p>🎯 <strong>Treffer!</strong> ${weapon.name} würfelt Schaden …</p>`
    });
    await new Promise(resolve => setTimeout(resolve, 700));
    return this.rollWeaponDamage(itemId, { targetActor, ammoRestore });
  }

  /**
   * Rolls one equipped weapon's own damage dice (absolute, printed on the item — no talent or
   * Stärken/Schwächen involved). Melee weapons additionally add the character's Nahkampfschaden
   * (Kraft + Ausrüstungs-Boni, see AshfordCharacter#prepareDerivedData); ranged weapons don't. A
   * strongly negative Kraft-Mod (e.g. the Screamer NSC, Kraft-Mod −2) could otherwise push a small
   * natural-weapon formula to 0 or below — a landed hit always deals at least 1, so the melee
   * branch is wrapped in Foundry's inline max() roll syntax instead of a fixed formula string.
   *
   * Against a target (passed in by rollWeaponAttack, or the current Foundry target as a fallback
   * for the standalone "Schaden"-Button), the target's armor value for this weapon's damageType is
   * subtracted (floored at 0 — armor can fully absorb a hit, unlike the >=1 floor on the raw roll
   * above) and the result is auto-applied to the target's HP via a chat card, exactly like the heal
   * flow (module/apps/heal-confirm-chat.mjs) — a player's client usually lacks OWNER on the target,
   * so the actual Actor#update happens on the GM's client once the card renders there (see
   * module/apps/damage-confirm-chat.mjs), which also offers a "Rückgängig machen" undo.
   */
  async rollWeaponDamage(itemId, { targetActor = null, ammoRestore = null } = {}) {
    const weapon = this.items.get(itemId);
    if (!weapon || weapon.type !== "weapon") return ui.notifications?.warn("Waffe nicht gefunden.");
    const formula = weapon.system.damageFormula?.trim();
    if (!formula) return ui.notifications?.warn(`${weapon.name} hat keinen Schadenswürfel eingetragen.`);

    const isMelee = !!weapon.system.weaponSkill && !weapon.system.isRanged;
    const meleeBonus = isMelee ? this.system.derived?.nahkampfschaden ?? 0 : 0;
    const fullFormula = meleeBonus ? `max(${formula} + ${meleeBonus}, 1)` : formula;

    const roll = new Roll(fullFormula);
    await roll.evaluate();

    const target = targetActor ?? (game.user?.targets?.size === 1 ? [...game.user.targets][0]?.actor : null);
    if (!target) {
      return roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: `${weapon.name} — Schaden`
      });
    }

    const damageType = weapon.system.damageType || "blunt";
    const armorValue = target.system?.armor?.[damageType] ?? 0;
    const finalDamage = Math.max(0, roll.total - armorValue);

    const cardData = {
      weaponName: weapon.name,
      targetName: target.name,
      rawDamage: roll.total,
      armorValue,
      damageTypeLabel: ARMOR_TYPE_LABELS[damageType] ?? damageType,
      finalDamage,
      resolved: false,
      reverted: false
    };
    const content = await foundry.applications.handlebars.renderTemplate(
      "systems/ashford/templates/chat/damage-confirm-card.hbs",
      cardData
    );

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${weapon.name} — Schaden gegen ${target.name}`,
      content,
      flags: {
        ashford: {
          damageConfirm: {
            targetUuid: target.uuid,
            targetName: target.name,
            weaponName: weapon.name,
            rawDamage: roll.total,
            armorValue,
            damageTypeLabel: cardData.damageTypeLabel,
            finalDamage,
            attackerUuid: this.uuid,
            ammoRestoreItemId: ammoRestore?.itemId ?? null,
            ammoRestoreField: ammoRestore?.field ?? null,
            ammoRestoreValue: ammoRestore?.value ?? null,
            resolved: false,
            reverted: false
          }
        }
      }
    });
  }

  /**
   * Consumes up to `amountNeeded` loose "ammo" Items of `ammoType` from this actor's inventory,
   * across as many stacks as necessary (smallest stack first, so fungible ammo declutters fastest
   * instead of leaving lots of ragged partial stacks around), batched into single embedded-document
   * calls. Returns how much was actually gained — never more than what was available, never negative.
   * Shared by reloadWeapon (feedType "internal") and refillMagazine.
   */
  async _consumeLooseAmmo(ammoType, amountNeeded) {
    if (amountNeeded <= 0) return 0;
    const stacks = this.items
      .filter(i => i.type === "ammo" && i.system.ammoType === ammoType && i.system.quantity > 0)
      .sort((a, b) => a.system.quantity - b.system.quantity);

    let remaining = amountNeeded;
    const updates = [];
    const deletions = [];
    for (const stack of stacks) {
      if (remaining <= 0) break;
      const take = Math.min(stack.system.quantity, remaining);
      remaining -= take;
      const newQty = stack.system.quantity - take;
      if (newQty <= 0) deletions.push(stack.id);
      else updates.push({ _id: stack.id, "system.quantity": newQty });
    }
    if (updates.length) await this.updateEmbeddedDocuments("Item", updates);
    if (deletions.length) await this.deleteEmbeddedDocuments("Item", deletions);
    return amountNeeded - remaining;
  }

  /**
   * "Magazin wechseln" — für feedType "internal" (Schrotflinten/Revolver/Bögen) lädt sofort so viel
   * lose Munition wie verfügbar direkt in die Waffe nach, bis `capacity` erreicht ist. Für feedType
   * "magazine" (Pistolen/Gewehre) sucht ein kompatibles Ersatzmagazin im Inventar (gleicher
   * ammoType, nirgendwo sonst schon eingeladen) — bei genau einem Kandidaten wird direkt gewechselt,
   * bei mehreren fragt ein kurzer Auswahl-Dialog (DialogV2, wie module/apps/roll-dialog.mjs). Kein
   * Munitionsverbrauch ohne Ziel-Feedback: postet in jedem Fall eine kurze Chat-Meldung.
   */
  async reloadWeapon(itemId) {
    const weapon = this.items.get(itemId);
    if (!weapon || weapon.type !== "weapon") return ui.notifications?.warn("Waffe nicht gefunden.");
    const { feedType, ammoType } = weapon.system;
    if (feedType === "none") return ui.notifications?.warn(`${weapon.name} benötigt keine Munition.`);

    if (feedType === "internal") {
      const needed = weapon.system.capacity - weapon.system.ammoRemaining;
      if (needed <= 0) return ui.notifications?.info(`${weapon.name} ist bereits voll.`);
      const gained = await this._consumeLooseAmmo(ammoType, needed);
      if (gained <= 0) return ui.notifications?.warn(`Keine passende Munition (${AMMO_TYPE_LABELS[ammoType] ?? ammoType}) im Inventar.`);
      const newValue = weapon.system.ammoRemaining + gained;
      await weapon.update({ "system.ammoRemaining": newValue });
      return ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<p>🔄 ${this.name} lädt <strong>${weapon.name}</strong> nach: +${gained} ${AMMO_TYPE_LABELS[ammoType] ?? ammoType} (${newValue}/${weapon.system.capacity}).</p>`
      });
    }

    // feedType === "magazine": ein Magazin gilt als "sonst eingeladen", wenn IRGENDEINE andere Waffe
    // dieses Actors gerade auf es zeigt — verhindert, dass dasselbe physische Magazin in zwei Waffen
    // gleichzeitig steckt (das ist die einzige Stelle, die loadedMagazineId je schreibt).
    const loadedElsewhere = new Set(
      this.items
        .filter(i => i.type === "weapon" && i.id !== weapon.id && i.system.loadedMagazineId)
        .map(i => i.system.loadedMagazineId)
    );
    const candidates = this.items.filter(
      i =>
        i.type === "magazine" &&
        i.system.ammoType === ammoType &&
        i.id !== weapon.system.loadedMagazineId &&
        !loadedElsewhere.has(i.id)
    );
    if (!candidates.length) {
      return ui.notifications?.warn(`Kein kompatibles Magazin (${AMMO_TYPE_LABELS[ammoType] ?? ammoType}) im Inventar.`);
    }

    let chosen;
    if (candidates.length === 1) {
      chosen = candidates[0];
    } else {
      const { DialogV2 } = foundry.applications.api;
      const action = await DialogV2.wait({
        window: { title: `${weapon.name} — Magazin wechseln` },
        content: `<p>Welches Magazin einlegen?</p>`,
        buttons: [
          ...candidates.map(mag => ({
            action: mag.id,
            label: `${mag.name} (${mag.system.roundsLoaded}/${mag.system.capacity})`
          })),
          { action: "cancel", label: "Abbrechen" }
        ]
      });
      if (!action || action === "cancel") return;
      chosen = candidates.find(m => m.id === action);
      if (!chosen) return;
    }

    await weapon.update({ "system.loadedMagazineId": chosen.id });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p>🔄 ${this.name} wechselt das Magazin von <strong>${weapon.name}</strong>: "${chosen.name}" (${chosen.system.roundsLoaded}/${chosen.system.capacity}).</p>`
    });
  }

  /** Füllt ein einzelnes Magazin-Item (egal ob gerade in einer Waffe eingelegt oder lose im Rucksack)
   * mit loser Munition passenden Typs wieder auf, bis zu seiner eigenen Kapazität. */
  async refillMagazine(itemId) {
    const mag = this.items.get(itemId);
    if (!mag || mag.type !== "magazine") return ui.notifications?.warn("Magazin nicht gefunden.");
    const needed = mag.system.capacity - mag.system.roundsLoaded;
    if (needed <= 0) return ui.notifications?.info(`"${mag.name}" ist bereits voll.`);
    const gained = await this._consumeLooseAmmo(mag.system.ammoType, needed);
    if (gained <= 0) {
      return ui.notifications?.warn(`Keine passende Munition (${AMMO_TYPE_LABELS[mag.system.ammoType] ?? mag.system.ammoType}) im Inventar.`);
    }
    const newValue = mag.system.roundsLoaded + gained;
    await mag.update({ "system.roundsLoaded": newValue });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: `<p>🔄 ${this.name} füllt <strong>${mag.name}</strong> auf: +${gained} (${newValue}/${mag.system.capacity}).</p>`
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
