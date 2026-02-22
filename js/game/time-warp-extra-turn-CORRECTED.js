// ========================================================================
// TIME WARP EXTRA TURN FIX
// ========================================================================
// BUG: Game.js uses exact match: ability === 'Extra turn'
//      But Legacy Time Warp has: "Take an extra turn. You can't play Time Warp next turn"
//      These don't match, so extra turn never triggers!
//
// FIX: Use includes() check instead of exact match
// LOAD: BEFORE time-warp-restriction-CORRECTED.js (must intercept first)

console.log('⏰ Loading Time Warp Extra Turn Fix...');

// Store original playCard
const _originalPlayCardForExtraTurn = Game.prototype.playCard;

Game.prototype.playCard = function(card, player, target) {
    const ability = card.ability;
    
    // Check for extra turn abilities BEFORE calling original
    // This ensures we catch "Take an extra turn..." text
    if (ability && ability.toLowerCase().includes('extra turn')) {
        console.log('[EXTRA TURN FIX] Detected extra turn ability!');
        console.log(`[EXTRA TURN FIX] Card: ${card.name}`);
        console.log(`[EXTRA TURN FIX] Ability: "${ability}"`);
        
        // Call original playCard first (handles mana, targeting, etc.)
        const result = _originalPlayCardForExtraTurn.call(this, card, player, target);
        
        // If play was successful, trigger extra turn
        if (result !== false) {
            // Make sure handleExtraTurn is called
            if (this.handleExtraTurn) {
                this.handleExtraTurn(player);
                console.log('[EXTRA TURN FIX] Extra turn granted!');
            } else {
                // Fallback if handleExtraTurn doesn't exist
                console.log('[EXTRA TURN FIX] handleExtraTurn not found, setting flag directly');
                if (player === 'player') {
                    this.playerExtraTurn = true;
                } else {
                    this.aiExtraTurn = true;
                }
                this.addLog(`${player === 'player' ? 'You' : 'AI'} will take an extra turn!`);
            }
        }
        
        return result;
    }
    
    // For all other cards, call original
    return _originalPlayCardForExtraTurn.call(this, card, player, target);
};

console.log('✅ Time Warp Extra Turn Fix loaded!');
console.log('   ⏰ Now uses includes() instead of exact match');
console.log('   ✨ Works with "Take an extra turn" and "Extra turn"');
console.log('   🔧 Fixed the missing extra turn bug');
console.log('   🎯 MUST load BEFORE time-warp-restriction patch');
