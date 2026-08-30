import AshfordActorBase from "./module/models/base-actor.mjs";
import AshfordCharacter from "./module/models/character.mjs";
import AshfordNpc from "./module/models/npc.mjs";
import AshfordCreature from "./module/models/creature.mjs";

import AshfordItemBase from "./module/models/base-item.mjs";
import AshfordTrait from "./module/models/trait.mjs";
import AshfordTalent from "./module/models/talent.mjs";
import { AshfordWeapon, AshfordArmor, AshfordEquipment, AshfordConsumable, AshfordCondition } from "./module/models/gear.mjs";

import AshfordActor from "./module/documents/actor.mjs";
import AshfordItem from "./module/documents/item.mjs";

import AshfordActorSheet from "./module/sheets/actor-sheet.mjs";
import AshfordItemSheet from "./module/sheets/item-sheet.mjs";

import registerHandlebarsHelpers from "./module/handlebars-helpers.mjs";
import registerCodexControls from "./module/apps/codex-app.mjs";
import { TALENTS, POINTS_BUDGET } from "./module/rules/talents.mjs";

Hooks.once("init", () => {
  console.log("Ashford Adventures | Initializing system");

  game.ashford = {
    AshfordActor,
    AshfordItem,
    config: { diceBase: 3, pointsBudget: POINTS_BUDGET, talents: TALENTS }
  };

  // Document classes
  CONFIG.Actor.documentClass = AshfordActor;
  CONFIG.Item.documentClass = AshfordItem;

  // Data models
  CONFIG.Actor.dataModels = {
    character: AshfordCharacter,
    npc: AshfordNpc,
    creature: AshfordCreature
  };
  CONFIG.Item.dataModels = {
    trait: AshfordTrait,
    talent: AshfordTalent,
    weapon: AshfordWeapon,
    armor: AshfordArmor,
    equipment: AshfordEquipment,
    consumable: AshfordConsumable,
    condition: AshfordCondition
  };

  // Sheets
  foundry.documents.collections.Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  foundry.documents.collections.Actors.registerSheet("ashford", AshfordActorSheet, {
    types: ["character", "npc", "creature"],
    makeDefault: true
  });
  foundry.documents.collections.Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  foundry.documents.collections.Items.registerSheet("ashford", AshfordItemSheet, {
    types: ["trait", "talent", "weapon", "armor", "equipment", "consumable", "condition"],
    makeDefault: true
  });

  registerHandlebarsHelpers();
});

Hooks.once("ready", () => {
  console.log("Ashford Adventures | Ready");
});

// Neue Charaktere starten mit allen 20 Talenten der geschlossenen Liste (Abschnitt 5),
// jeweils mit 0 Stärken/Schwächen — bereit, um das 10-Punkte-Budget (Abschnitt 4) zu verteilen.
Hooks.on("createActor", (actor, options, userId) => {
  if (actor.type !== "character") return;
  if (game.user.id !== userId) return;
  if (actor.items.size > 0) return;
  actor.ensureCanonicalTalents();
});

registerCodexControls();
