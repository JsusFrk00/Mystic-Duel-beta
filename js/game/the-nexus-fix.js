// ========================================================================
// THE NEXUS FIX - Multi-Color Identity + Draw Fix
// ========================================================================
// Fixes two issues with The Nexus:
// 1. Double draw (modular system + v3 both draw)
// 2. Multi-color identity (updated in cards.js)
// NOTE: Cost reduction is handled in v3-abilities-complete.js (no need to wrap here)
// MUST load AFTER all ability systems

console.log('🌈 Loading The Nexus Fix...');

// FIX 1: Remove duplicate draw from modular system
// The modular system's onStartOfTurn already draws, v3 also draws = double draw
const _originalOnStartOfTurn = AbilityEventSystem.prototype.onStartOfTurn;
AbilityEventSystem.prototype.onStartOfTurn = function(player) {
    console.log(`[EVENT: START_OF_TURN] ${player}`);
    
    const field = player === 'player' ? this.game.playerField : this.game.aiField;
    
    field.forEach(creature => {
        const ability = creature.ability;
        if (!ability) return;
        
        // Regenerate: Restore to full health
        if (ability === 'Regenerate' || ability.includes('Regenerate')) {
            creature.health = creature.maxHealth;
        }
        
        // Draw cards each turn - SKIP if v3-abilities-complete is loaded
        // v3-abilities-complete.js has comprehensive draw-per-turn handling
        // This modular system should ONLY handle basic cases
        if (ability === 'Draw a card each turn' && !ability.includes('Draw 2')) {
            // Only simple "Draw a card each turn", not complex ones
            this.game.drawCard(player);
            console.log(`[MODULAR] ${creature.name} drew a card (simple case)`);
        }
        // Skip complex ones like The Nexus - let v3-abilities handle them
    });
};

console.log('✅ The Nexus Fix loaded!');
console.log('   🔄 Fixed: Duplicate draw removed from modular system');
console.log('   🌈 Multi-color identity: Set in cards.js');
console.log('   💰 Cost reduction: Handled by v3-abilities-complete.js');
