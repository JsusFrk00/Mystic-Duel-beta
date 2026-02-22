// ========================================================================
// TIME WARP RESTRICTION FIX
// ========================================================================
// IMPLEMENTS: "Can't play Time Warp next turn" restriction
// Legacy Time Warp's full text: "Take an extra turn. You can't play Time Warp next turn"
//
// HOW IT WORKS:
// 1. When Time Warp is played, set timeWarpBlockedTurns counter to 2
// 2. Decrement counter each turn
// 3. Check counter before allowing Time Warp to be played
// 4. Display message if blocked

console.log('⏰ Loading Time Warp Restriction Fix...');

// Store original playCard function
const _originalPlayCardForTimeWarp = Game.prototype.playCard;

Game.prototype.playCard = function(card, player, target) {
    const ability = card.ability;
    
    // Check if Time Warp is blocked
    if (ability && ability.includes('extra turn') && card.name.includes('Time Warp')) {
        console.log('[TIME WARP] Checking if Time Warp is allowed...');
        
        // Initialize turn counter if needed
        if (!this.playerTimeWarpBlockedTurns) {
            this.playerTimeWarpBlockedTurns = 0;
        }
        if (!this.aiTimeWarpBlockedTurns) {
            this.aiTimeWarpBlockedTurns = 0;
        }
        
        // Check if blocked for this player
        const blockedTurns = player === 'player' ? this.playerTimeWarpBlockedTurns : this.aiTimeWarpBlockedTurns;
        
        if (blockedTurns > 0) {
            console.log(`[TIME WARP] Blocked! ${blockedTurns} turn(s) remaining`);
            this.addLog("You can't play Time Warp this turn!");
            return false; // Prevent playing
        }
        
        console.log('[TIME WARP] Allowed! Setting block for next turn...');
    }
    
    // Call original playCard
    const result = _originalPlayCardForTimeWarp.call(this, card, player, target);
    
    // AFTER Time Warp is played successfully, set the block
    if (result !== false && ability && ability.includes('extra turn') && card.name.includes('Time Warp')) {
        console.log('[TIME WARP] Time Warp played! Blocking for next turn...');
        if (player === 'player') {
            this.playerTimeWarpBlockedTurns = 2; // Block for 2 turns (current extra turn + next regular turn)
        } else {
            this.aiTimeWarpBlockedTurns = 2;
        }
    }
    
    return result;
};

// Store original startNewTurn function to decrement counters
const _originalStartNewTurnForTimeWarp = Game.prototype.startNewTurn;

Game.prototype.startNewTurn = function(player) {
    // Initialize counters if needed
    if (this.playerTimeWarpBlockedTurns === undefined) {
        this.playerTimeWarpBlockedTurns = 0;
    }
    if (this.aiTimeWarpBlockedTurns === undefined) {
        this.aiTimeWarpBlockedTurns = 0;
    }
    
    // Decrement block counter for the player whose turn is starting
    if (player === 'player' && this.playerTimeWarpBlockedTurns > 0) {
        this.playerTimeWarpBlockedTurns--;
        console.log(`[TIME WARP] Player block decremented: ${this.playerTimeWarpBlockedTurns} turns remaining`);
    } else if (player === 'ai' && this.aiTimeWarpBlockedTurns > 0) {
        this.aiTimeWarpBlockedTurns--;
        console.log(`[TIME WARP] AI block decremented: ${this.aiTimeWarpBlockedTurns} turns remaining`);
    }
    
    // Call original
    _originalStartNewTurnForTimeWarp.call(this, player);
};

console.log('✅ Time Warp Restriction Fix loaded!');
console.log('   ⏰ Time Warp can only be played once per 2 turns');
console.log('   🚫 Prevents Time Warp chaining exploits');
console.log('   ✨ "Can\'t play next turn" restriction now enforced');
