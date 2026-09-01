import { EQUIP_SLOTS, ARMOR_TYPES, ITEM_CATEGORIES, ITEM_CATEGORY_LABELS } from "../models/gear.mjs";
import { conditionByKey, conditionCategoryLabel, conditionDurationLabel } from "../rules/conditions.mjs";
import AshfordConditionPicker from "../apps/condition-picker.mjs";

const SLOT_ICONS = {
  head: "fas fa-hard-hat",
  chest: "fas fa-vest",
  arms: "fas fa-band-aid",
  legs: "fas fa-socks",
  feet: "fas fa-shoe-prints",
  hands: "fas fa-hand-fist"
};

/** One emoji per canonical Talent — reads at a glance in the tile grid, no icon font guessing for weapon types. */
const TALENT_ICONS = {
  menschenkenntnis: "🧠", luegen: "🎭", charme: "💬", einschuechtern: "😠",
  medizin: "⚕️", natur: "🌿", technik: "🔧", kraft: "💪", athletik: "🏃",
  werfen: "🎯", heimlichkeit: "🥷", wahrnehmung: "👁️",
  pistolen: "🔫", gewehre: "🔫", schrotflinten: "💥", boegen: "🏹",
  schlagwaffen: "🔨", hiebwaffen: "🪓", stichwaffen: "🗡️", waffenloserkampf: "🥊"
};

/** Zustände that stay visible as small header badges regardless of severity (Abschnitt "Darstellung in anderen Bereichen"). */
const HEADER_CRITICAL_CONDITION_KEYS = new Set(["blutend", "schwer_verletzt", "infiziert", "bewegungsunfaehig", "panisch"]);

const localizeSlot = key => game.i18n.localize(`ASHFORD.Sheet.slot${key.charAt(0).toUpperCase()}${key.slice(1)}`);

export default class AshfordActorSheet extends ActorSheet {
  /** UI-only toggle for the character sheet: gates the "Leveln" fields (base data, talent points) behind an explicit edit mode. Resets to closed on every re-open. */
  _editMode = false;

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ashford", "sheet", "actor"],
      width: 1180,
      height: 860,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "character" }]
    });
  }

  /** @override */
  get template() {
    return `systems/ashford/templates/actor/${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const actor = this.actor;
    context.system = actor.system;
    context.editMode = this._editMode;
    const health = actor.system.resources?.health ?? { value: 0, max: 1 };
    context.healthPct = health.max ? Math.round((health.value / health.max) * 100) : 0;

    const items = actor.items;
    context.traits = items.filter(i => i.type === "trait");
    const gear = items.filter(i => !["trait", "talent", "condition"].includes(i.type));
    context.gear = gear;

    // Talente: gruppiert nach Stufe, mit einem einzelnen Level (-2..+3 = Stärken-Schwächen) fürs Kachel-Design.
    const talents = items.filter(i => i.type === "talent");
    context.talentTiers = [1, 2, 3].map(stufe => ({
      stufe,
      talents: talents
        .filter(t => t.system.stufe === stufe)
        .sort((a, b) => a.name.localeCompare(b.name, "de"))
        .map(t => ({
          id: t.id,
          name: t.name,
          icon: TALENT_ICONS[t.system.talentKey] ?? "⭐",
          level: t.system.staerken - t.system.schwaechen,
          staerken: t.system.staerken,
          schwaechen: t.system.schwaechen,
          diceCount: t.system.diceCount,
          pointDelta: t.system.pointDelta
        }))
    }));
    context.hasTalents = talents.length > 0;

    // Ausrüstung: 6 Slots (Kopf/Brust/Arme/Beine/Füße/Hände) + zwei getrennte Rucksack-Bereiche.
    context.equipSlots = EQUIP_SLOTS.map(key => {
      const item = this._findSlotItem(gear, key);
      return {
        key,
        icon: SLOT_ICONS[key],
        label: localizeSlot(key),
        item: item ? this._serializeGearItem(item) : null
      };
    });
    const slottedIds = new Set(context.equipSlots.filter(s => s.item).map(s => s.item.id));

    context.equippableItems = gear
      .filter(i => ["armor", "weapon"].includes(i.type) && !slottedIds.has(i.id))
      .map(i => this._serializeEquippable(i, context.equipSlots));

    context.miscItems = gear
      .filter(i => ["equipment", "consumable"].includes(i.type))
      .map(i => this._serializeMisc(i));

    context.itemCategories = ITEM_CATEGORIES.map(key => ({ key, name: ITEM_CATEGORY_LABELS[key] ?? key }));

    // Zustand-Tab: aktiv vs. archiviert, plus eine kuratierte Teilmenge fürs Header-Badge-Leiste.
    const conditions = items.filter(i => i.type === "condition");
    context.activeConditionCards = conditions.filter(c => c.system.active).map(c => this._serializeCondition(c));
    context.archivedConditions = conditions.filter(c => !c.system.active).map(c => this._serializeCondition(c));
    context.headerConditionBadges = context.activeConditionCards.filter(
      c => HEADER_CRITICAL_CONDITION_KEYS.has(c.conditionKey) || c.severity === "kritisch"
    );

    return context;
  }

  /** Which gear item currently occupies `slotKey` — "hands" prefers an equipped weapon over hand-armor (only one free pair of hands). */
  _findSlotItem(gear, slotKey) {
    if (slotKey === "hands") {
      return (
        gear.find(i => i.type === "weapon" && i.system.equipped) ??
        gear.find(i => i.type === "armor" && i.system.equipped && i.system.slot === "hands") ??
        null
      );
    }
    return gear.find(i => i.type === "armor" && i.system.equipped && i.system.slot === slotKey) ?? null;
  }

  _serializeGearItem(item) {
    const base = {
      id: item.id,
      name: item.name,
      img: item.img,
      type: item.type,
      quantity: item.system.quantity,
      weight: item.system.weight
    };
    if (item.type === "armor") base.armor = item.system.armor;
    if (item.type === "weapon") base.baseDamage = item.system.baseDamage;
    return base;
  }

  _serializeEquippable(item, equipSlots) {
    const base = this._serializeGearItem(item);
    const slotKey = item.type === "armor" ? item.system.slot || null : "hands";
    base.slot = slotKey;
    base.slotLabel = slotKey ? localizeSlot(slotKey) : "";
    base.hasSlot = !!slotKey;
    base.category = item.type === "weapon" ? "waffen" : "ruestung";
    const equippedInSlot = slotKey ? equipSlots.find(s => s.key === slotKey)?.item ?? null : null;
    if (item.type === "armor") {
      const cur = equippedInSlot?.armor ?? { ballistic: 0, pierce: 0, blunt: 0, slash: 0 };
      base.comparison = ARMOR_TYPES.map(key => ({
        key,
        from: cur[key] ?? 0,
        to: item.system.armor[key] ?? 0,
        delta: (item.system.armor[key] ?? 0) - (cur[key] ?? 0)
      }));
    } else {
      const cur = equippedInSlot?.baseDamage ?? 0;
      base.comparison = [{ key: "baseDamage", from: cur, to: item.system.baseDamage, delta: item.system.baseDamage - cur }];
    }
    return base;
  }

  _serializeMisc(item) {
    return {
      id: item.id,
      name: item.name,
      img: item.img,
      type: item.type,
      quantity: item.system.quantity,
      weight: item.system.weight,
      category: item.system.category || "sonstiges",
      usesRemaining: item.type === "consumable" ? item.system.usesRemaining : null,
      actionLabel: item.type === "consumable" ? item.system.actionLabel || "Benutzen" : null
    };
  }

  _serializeCondition(item) {
    const catalogEntry = conditionByKey(item.system.conditionKey);
    return {
      id: item.id,
      name: item.name,
      icon: catalogEntry?.icon ?? "fas fa-notes-medical",
      description: item.system.description || (catalogEntry ? `<p>${catalogEntry.description}</p>` : ""),
      conditionKey: item.system.conditionKey,
      category: item.system.category,
      categoryLabel: conditionCategoryLabel(item.system.category),
      severity: item.system.severity,
      durationLabel: conditionDurationLabel(item.system.duration),
      source: item.system.source,
      note: item.system.note,
      effects: (item.system.effects ?? []).filter(e => e.label),
      active: item.system.active
    };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ashford-toggle-edit").on("click", () => {
      this._editMode = !this._editMode;
      this.render();
    });

    // Header: Gesundheits-Popover, Initiative-Wurf, Rüstungs-Tooltips (Tooltips sind reines title="").
    html.find(".health-block").on("click", ev => {
      if ($(ev.target).closest(".health-popover").length) return;
      ev.stopPropagation();
      html.find(".health-popover").toggleClass("open");
    });
    html.on("click", ev => {
      if (!$(ev.target).closest(".health-block, .health-popover").length) html.find(".health-popover").removeClass("open");
    });
    html.find(".health-apply-damage").on("click", () => {
      const amount = Number(html.find(".health-popover-amount").val()) || 0;
      this.actor.applyHealthDelta(-Math.abs(amount));
    });
    html.find(".health-apply-heal").on("click", () => {
      const amount = Number(html.find(".health-popover-amount").val()) || 0;
      this.actor.applyHealthDelta(Math.abs(amount));
    });
    html.find(".ashford-roll-initiative").on("click", () => this.actor.rollInitiativeCheck());

    html.find(".ashford-roll-pool").on("click", () =>
      this.actor.quickRollPool({ label: this.actor.name, basePool: this.actor.system.attackPool ?? 3 })
    );

    // Talente: fertige Kacheln würfeln per Klick, Edit-Modus-Kacheln nur über den eigenen Würfel-Button.
    html.find(".talent-tile:not(.edit-mode)").on("click", ev => {
      const itemId = ev.currentTarget.dataset.itemId;
      this.actor.rollTalent(itemId);
    });
    html.find(".ashford-roll-talent").on("click", ev => {
      ev.stopPropagation();
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.rollTalent(itemId);
    });
    html.find(".ashford-init-talents").on("click", () => this.actor.ensureCanonicalTalents());
    html.find(".talent-field").on("click", ev => ev.stopPropagation());
    html.find(".talent-field").on("change", ev => {
      const el = ev.currentTarget;
      const itemId = el.closest("[data-item-id]").dataset.itemId;
      const field = el.dataset.field;
      this.actor.items.get(itemId)?.update({ [`system.${field}`]: Number(el.value) });
    });

    // Inventar: ausrüsten/ablegen, Vergleichs-Drawer, Verbrauchsgegenstände benutzen, Slot per Item-Sheet.
    html.find(".ashford-equip").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.equipped": true });
    });
    html.find(".ashford-unequip").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.equipped": false });
    });
    html.find(".equippable-row .row-main").on("click", ev => {
      if ($(ev.target).closest("button, a, input, select").length) return;
      $(ev.currentTarget).closest(".equippable-row").toggleClass("expanded");
    });
    html.find(".ashford-use-consumable").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.useConsumable();
    });

    // Inventar-Suche/Filter: rein clientseitig, kein Re-Render nötig.
    html.find(".inventory-search").on("input", ev => this._applyInventoryFilter(html, $(ev.currentTarget)));
    html.find(".inventory-filter").on("change", ev => this._applyInventoryFilter(html, $(ev.currentTarget)));

    // Drag & Drop: Rucksack-Zeile auf einen Slot ziehen, um auszurüsten.
    html.find(".equippable-row").attr("draggable", "true").on("dragstart", ev => {
      const itemId = ev.currentTarget.dataset.itemId;
      ev.originalEvent.dataTransfer.setData("text/ashford-item-id", itemId);
      ev.originalEvent.dataTransfer.effectAllowed = "move";
    });
    html.find(".equip-slot").on("dragover", ev => {
      ev.preventDefault();
      ev.originalEvent.dataTransfer.dropEffect = "move";
    });
    html.find(".equip-slot").on("drop", ev => {
      ev.preventDefault();
      const itemId = ev.originalEvent.dataTransfer.getData("text/ashford-item-id");
      const item = itemId && this.actor.items.get(itemId);
      if (item) item.update({ "system.equipped": true });
    });

    // Zustand-Tab
    html.find(".ashford-add-condition").on("click", () => AshfordConditionPicker.prompt(this.actor));
    html.find(".ashford-end-condition").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.active": false });
    });
    html.find(".ashford-reactivate-condition").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.update({ "system.active": true });
    });
    html.find(".condition-card .card-main").on("click", ev => {
      if ($(ev.target).closest("button, a, input, select").length) return;
      $(ev.currentTarget).closest(".condition-card").toggleClass("expanded");
    });

    html.find(".item-create").on("click", ev => this._onItemCreate(ev));
    html.find(".item-edit").on("click", ev => {
      const item = this.actor.items.get(ev.currentTarget.closest("[data-item-id]").dataset.itemId);
      item?.sheet.render(true);
    });
    html.find(".item-delete").on("click", ev => {
      const itemId = ev.currentTarget.closest("[data-item-id]").dataset.itemId;
      this.actor.items.get(itemId)?.delete();
    });
  }

  /** Filters the equippable/misc inventory lists by free-text name and category, purely in the DOM. */
  _applyInventoryFilter(html, changedEl) {
    const section = changedEl.closest(".inventory-panel");
    const query = section.find(".inventory-search").val()?.trim().toLowerCase() ?? "";
    const category = section.find(".inventory-filter").val() ?? "all";
    section.find("[data-item-row]").each((_i, el) => {
      const row = $(el);
      const matchesText = !query || row.data("name")?.toString().toLowerCase().includes(query);
      const matchesCategory = category === "all" || row.data("category") === category;
      row.toggle(matchesText && matchesCategory);
    });
  }

  async _onItemCreate(event) {
    const type = event.currentTarget.dataset.type ?? "equipment";
    return this.actor.createEmbeddedDocuments("Item", [
      { name: `Neu: ${type}`, type }
    ]);
  }
}
