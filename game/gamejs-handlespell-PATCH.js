// ========================================================================
// GAME.JS HANDLESPELL PATCH - Skip multi-color spells
// ========================================================================
// BUG: Game.js handleSpell processes spells that v3-abilities already handled
// FIX: Skip spells with "If both colors" so they don't get double-processed
//
// CRITICAL: Load BEFORE v3-abilities so originalHandleSpell in v3 points to this

console.log('⚡ Loading Game.js HandleSpell Patch...');

// Store the ORIGINAL Game.js handleSpell before v3-abilities wraps it
const _bareGameJsHandleSpell = Game.prototype.handleSpell;

// Replace with one that skips multi-color spells
Game.prototype.handleSpell = function(card, player, target) {
    const ability = card.ability;
    
    // Skip multi-color spells - let v3-abilities handle them exclusively
    if (ability && (ability.includes('If both colors') || ability.includes('If both'))) {
        console.log(`[GAMEJS PATCH] Skipping ${card.name} - will be handled by v3-abilities`);
        return; // Don't process it here
    }
    
    // For all other spells, use original Game.js logic
    _bareGameJsHandleSpell.call(this, card, player, target);
};

console.log('✅ Game.js HandleSpell Patch loaded!');
console.log('   ⚡ Skips multi-color spells (v3-abilities handles them)');
console.log('   🎯 Prevents double damage on Storm\'s Fury etc.');
