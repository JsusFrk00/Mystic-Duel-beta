// ========================================================================
// MULTI-COLOR & SPLASH 2 FIX - v4 (SAFE VERSION)
// ========================================================================
// Fixes Splash 2 WITHOUT breaking core turn logic

console.log('🎨 Loading Multi-Color + Splash 2 Fix v4 (Safe)...');

// PART 1: Make hasBothColors globally accessible
if (typeof hasBothColors === 'function') {
    window.hasBothColors = hasBothColors;
    hasColorOnBoard = hasColorOnBoard || window.hasColorOnBoard;
}

// PART 2: Fix Splash 2 damage at END of turn instead of start
// This way we don't interfere with core turn start logic

const _origEndTurnSplash = Game.prototype.endTurn;

Game.prototype.endTurn = function() {
    // Before ending turn, apply Splash 2 bonus damage
    // (Original startNewTurn counts Splash 2 as 1, we add +1 more)
    
    // Player's Splash 2 creatures
    const playerSplash2Count = this.playerField.filter(c => 
        c.ability && c.ability.includes('Splash 2')
    ).length;
    
    if (playerSplash2Count > 0) {
        this.dealDamage('ai', playerSplash2Count);
        console.log(`[SPLASH 2 FIX] +${playerSplash2Count} bonus from Splash 2`);
    }
    
    // AI's Splash 2 creatures  
    const aiSplash2Count = this.aiField.filter(c =>
        c.ability && c.ability.includes('Splash 2')
    ).length;
    
    if (aiSplash2Count > 0) {
        this.dealDamage('player', aiSplash2Count);
        console.log(`[SPLASH 2 FIX] +${aiSplash2Count} bonus from AI Splash 2`);
    }
    
    // Call original endTurn
    _origEndTurnSplash.call(this);
};

console.log('✅ Multi-Color + Splash 2 Fix v4 loaded (SAFE)!');
console.log('   🦈 Splash 2 deals correct damage (1 from original + 1 from bonus)');
console.log('   🎨 hasBothColors accessible globally');
console.log('   ✅ Does NOT break turn start logic');
