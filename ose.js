// Import Modules
import { OseItemSheet } from "./module/item/item-sheet.js";
import { OseActorSheetCharacter } from "./module/actor/character-sheet.js";
import { OseActorSheetMonster } from "./module/actor/monster-sheet.js";
import { preloadHandlebarsTemplates } from "./module/preloadTemplates.js";
import { OseActor } from "./module/actor/entity.js";
import { OseItem } from "./module/item/entity.js";
import { OSE } from "./module/config.js";
import { registerSettings } from "./module/settings.js";
import { registerHelpers } from "./module/helpers.js";
import * as chat from "./module/chat.js";
import * as treasure from "./module/treasure.js";
import * as macros from "./module/macros.js";
import * as party from "./module/party.js";
import { OseCombat } from "./module/combat.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function () {
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d6 + @initiative.value",
    decimals: 2,
  };

  CONFIG.OSE = OSE;

  game.ose = {
    rollItemMacro: macros.rollItemMacro,
  };

  // Custom Handlebars helpers
  registerHelpers();

  // Register custom system settings
  registerSettings();

  CONFIG.Actor.entityClass = OseActor;
  CONFIG.Item.entityClass = OseItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ose", OseActorSheetCharacter, {
    types: ["character"],
    makeDefault: true,
  });
  Actors.registerSheet("ose", OseActorSheetMonster, {
    types: ["monster"],
    makeDefault: true,
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ose", OseItemSheet, { makeDefault: true });

  await preloadHandlebarsTemplates();
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */
Hooks.once("setup", function () {
  // Localize CONFIG objects once up-front
  const toLocalize = ["saves_short", "saves_long", "scores", "armor", "colors", "tags"];
  for (let o of toLocalize) {
    CONFIG.OSE[o] = Object.entries(CONFIG.OSE[o]).reduce((obj, e) => {
      obj[e[0]] = game.i18n.localize(e[1]);
      return obj;
    }, {});
  }
  for (let l of CONFIG.OSE.languages) {
    CONFIG.OSE.languages[l] = game.i18n.localize(CONFIG.OSE.languages[l]);
  }

  // Custom languages
  const languages = game.settings.get("ose", "languages");
  if (languages != "") {
    const langArray = languages.split(',');
    langArray.forEach((l, i) => langArray[i] = l.trim())  
    CONFIG.OSE.languages = langArray;
  }
});

Hooks.once("ready", async () => {
  Hooks.on("hotbarDrop", (bar, data, slot) =>
    macros.createOseMacro(data, slot)
  );
});

// License and KOFI infos
Hooks.on("renderSidebarTab", async (object, html) => {
  if (object instanceof ActorDirectory) {
    party.addControl(object, html);
  }
  if (object instanceof Settings) {
    let gamesystem = html.find(".game-system");
    // SRD Link
    let ose = gamesystem.find('h4').last();
    ose.append(` <sub><a href="https://oldschoolessentials.necroticgnome.com/srd/index.php">SRD<a></sub>`);

    // License text
    const template = "systems/ose/templates/chat/license.html";
    const rendered = await renderTemplate(template);
    gamesystem.append(rendered);
    
    // User guide
    let docs = html.find("button[data-action='docs']");
    const styling = "border:none;margin-right:2px;vertical-align:middle;margin-bottom:5px";
    $(`<button data-action="userguide"><img src='/systems/ose/assets/dragon.png' width='16' height='16' style='${styling}'/>My blog</button>`).insertAfter(docs);
    html.find('button[data-action="userguide"]').click(ev => {
      new FrameViewer('https://dmgamboa.blogspot.com', {resizable: true}).render(true);
    });
  }
});

Hooks.on("preCreateCombatant", (combat, data, options, id) => {
  let init = game.settings.get("ose", "initiative");
  if (init == "group") {
    OseCombat.addCombatant(combat, data, options, id);
  }
});

Hooks.on("preUpdateCombatant", (combat, combatant, data) => {
  OseCombat.updateCombatant(combat, combatant, data);
});

Hooks.on("renderCombatTracker", (object, html, data) => {
  OseCombat.format(object, html, data);
});

Hooks.on("preUpdateCombat", async (combat, data, diff, id) => {
  let init = game.settings.get("ose", "initiative");
  let reroll = game.settings.get("ose", "rerollInitiative");
  if (!data.round) {
    return;
  }
  if (data.round !== 1) {
    if (reroll === "reset") {
      OseCombat.resetInitiative(combat, data, diff, id);
      return;
    } else if (reroll === "keep") {
      return;
    }
  }
  if (init === "group") {
    OseCombat.rollInitiative(combat, data, diff, id);
  } else if (init === "individual") {
    OseCombat.individualInitiative(combat, data, diff, id);
  }
});

Hooks.on("renderChatLog", (app, html, data) => OseItem.chatListeners(html));
Hooks.on("getChatLogEntryContext", chat.addChatMessageContextOptions);
Hooks.on("renderChatMessage", chat.addChatMessageButtons);
Hooks.on("renderRollTableConfig", treasure.augmentTable);
Hooks.on("updateActor", party.update);
