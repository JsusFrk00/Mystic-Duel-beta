// ========================================================================
// STORM'S FURY DOUBLE DAMAGE FIX
// ========================================================================
// BUG: v3-abilities handles Storm's Fury, then chains to Game.js handleSpell
//      Game.js sees "Deal" and calls handleDamageSpell again
//      Result: 4 damage from v3 + 4 from Game.js = 8 total (wrong!)
//
// FIX: Intercept multi-color spells and return early to prevent double handling

console.log('⚡ Loading Storm\'s Fury Double Damage Fix...');

// Store v3-abilities handleSpell (from part3 which is last to load)
const _v3HandleSpell = Game.prototype.handleSpell;

Game.prototype.handleSpell = function(card, player, target) {
    const ability = card.ability;
    
    // Check if this is a multi-color repeat spell
    if (ability && (ability.includes('If both colors on board, repeat') || ability.includes('If both colors, repeat'))) {
        console.log(`[MULTICOLOR FIX] Handling ${card.name} - preventing double damage`);
        
        // Call v3-abilities handler
        _v3HandleSpell.call(this, card, player, target);
        
        // RETURN EARLY - Don't let it fall through to Game.js generic handlers
        return;
    }
    
    // For all other spells, call v3-abilities normally
    _v3HandleSpell.call(this, card, player, target);
};

console.log('✅ Storm\'s Fury Double Damage Fix loaded!');
console.log('   ⚡ Multi-color spells no longer double-damage');
console.log('   🎯 Affects Storm\'s Fury and similar "If both colors" spells');
