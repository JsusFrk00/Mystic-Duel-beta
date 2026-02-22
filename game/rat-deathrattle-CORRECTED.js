// ========================================================================
// RAT DEATHRATTLE FIX - CORRECTED VERSION v2
// ========================================================================
// PROBLEM: Original code checked field.length === 0 while Rat was still in array
// SOLUTION: Check field.length === 1 (meaning ONLY the Rat exists)
//
// This handles all cases correctly:
// - Rat dies alone: field.length === 1 → Trigger ✓
// - Rat + others (others survive): field.length > 1 → Don't trigger ✓
// - Board wipe (all die together): field.length > 1 → Don't trigger ✓
//
// Load this AFTER checkDeaths-deathrattle-fix.js

console.log('🐀 Loading CORRECTED Rat Deathrattle Fix v2...');

// Override handleDeathrattle to fix the Rat ability
const _originalHandleDeathrattleForRat = Game.prototype.handleDeathrattle;

Game.prototype.handleDeathrattle = function(card, player) {
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // Rat - Conditional enemy discard (if you control no other creatures)
    if (ability && ability.includes('If you control no other creatures, enemy discards')) {
        console.log('[RAT FIX] Checking Rat deathrattle...');
        console.log(`[RAT FIX] Field length: ${field.length}`);
        
        // FIX: Check if field.length === 1 (meaning ONLY the Rat exists)
        // During filter(), all creatures are still in the array before removal
        // So if field.length === 1, the Rat is the only creature (dying alone)
        // If field.length > 1, there are other creatures (even if also dying in a board wipe)
        if (field.length === 1) {
            console.log('[RAT] Deathrattle triggered - Rat is alone!');
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            
            if (enemyHand.length > 0) {
                // Random discard
                const randomIndex = Math.floor(Math.random() * enemyHand.length);
                const discarded = enemyHand.splice(randomIndex, 1)[0];
                
                this.addLog(`Rat: Enemy discarded ${discarded.name}!`);
                console.log(`[RAT] Enemy discarded ${discarded.name}`);
            } else {
                console.log('[RAT] Enemy hand is empty, nothing to discard');
            }
        } else {
            console.log(`[RAT] Deathrattle not triggered - ${field.length} total creatures (Rat is not alone)`);
        }
        
        // Don't call original for Rat (prevents duplicate/error)
        return;
    }
    
    // For all other deathrattles, call original
    if (_originalHandleDeathrattleForRat) {
        _originalHandleDeathrattleForRat.call(this, card, player);
    }
};

console.log('✅ CORRECTED Rat Deathrattle Fix v2 loaded!');
console.log('   🐀 Checks field.length === 1 (only Rat exists)');
console.log('   🔧 Fixed the "counting itself" bug');
console.log('   💥 Correctly handles board wipes (won\'t trigger if multiple creatures die)');
console.log('   ✨ Deathrattle only triggers when Rat truly dies alone');
