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

Hooks.once("init", () => {
  console.log("Ashford Adventures | Initializing system");

  game.ashford = {
    AshfordActor,
    AshfordItem,
    config: { diceBase: 3 }
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

  game.settings.register("ashford", "successThreshold", {
    name: "ASHFORD.Settings.successThreshold.name",
    hint: "ASHFORD.Settings.successThreshold.hint",
    scope: "world",
    config: true,
    type: Number,
    choices: { 4: "4+", 5: "5+", 6: "6 (nur Sechsen)" },
    default: 5
  });
});

Hooks.once("ready", () => {
  console.log("Ashford Adventures | Ready");
});

registerCodexControls();
