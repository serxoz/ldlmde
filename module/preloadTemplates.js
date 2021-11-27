export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        //Character Sheets
        'systems/ldlmde/templates/actors/character-sheet.html',
        'systems/ldlmde/templates/actors/monster-sheet.html',
        //Actor partials
        //Sheet tabs
        'systems/ldlmde/templates/actors/partials/character-header.html',
        'systems/ldlmde/templates/actors/partials/character-attributes-tab.html',
        'systems/ldlmde/templates/actors/partials/character-abilities-tab.html',
        'systems/ldlmde/templates/actors/partials/character-spells-tab.html',
        'systems/ldlmde/templates/actors/partials/character-inventory-tab.html',
        'systems/ldlmde/templates/actors/partials/character-notes-tab.html',

        'systems/ldlmde/templates/actors/partials/monster-header.html',
        'systems/ldlmde/templates/actors/partials/monster-attributes-tab.html'
    ];
    return loadTemplates(templatePaths);
};
