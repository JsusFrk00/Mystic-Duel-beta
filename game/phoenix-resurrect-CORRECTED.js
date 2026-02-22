// ========================================================================
// PHOENIX RESURRECT FIX
// ========================================================================
// BUG: checkDeaths-deathrattle-fix.js has early return that blocks non-"Deathrattle:" abilities
// Line 22: if (!ability || !ability.includes('Deathrattle:')) { return; }
// PROBLEM: Phoenix ability is "Resurrect", doesn't contain "Deathrattle:"
// SOLUTION: Remove overly strict early return check
//
// Load this AFTER checkDeaths-deathrattle-fix.js

console.log('🦅 Loading Phoenix Resurrect Fix...');

// Override handleDeathrattle to fix the early return bug
const _originalHandleDeathrattleForPhoenix = Game.prototype.handleDeathrattle;

Game.prototype.handleDeathrattle = function(card, player) {
    console.log(`[PHOENIX FIX] Processing ${card.name}: "${card.ability}"`);
    
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    
    // FIX: Don't do early return for missing "Deathrattle:" text!
    // OLD CODE HAD: if (!ability || !ability.includes('Deathrattle:')) { return; }
    // This blocked Phoenix "Resurrect" from working
    
    if (!ability) {
        // Only return if NO ability at all
        return;
    }
    
    // Phoenix / Resurrect - Return to hand
    if (ability.includes('Return to hand') || ability === 'Resurrect') {
        console.log('[PHOENIX FIX] Resurrect triggered!');
        const bonus = ability.includes('with +2/+2') ? 2 : 0;
        const newCard = new window.Card({
            name: card.name, 
            cost: card.cost, 
            type: card.type,
            attack: card.attack + bonus, 
            health: card.maxHealth + bonus,
            ability: card.ability, 
            emoji: card.emoji, 
            rarity: card.rarity, 
            color: card.color
        });
        newCard.maxHealth = card.maxHealth + bonus;
        newCard.baseAttack = card.attack + bonus;
        newCard.baseHealth = card.maxHealth + bonus;
        
        if (hand.length < 10) {
            hand.push(newCard);
            this.addLog(`${card.name} returns to hand${bonus > 0 ? ' with +2/+2' : ''}!`);
            console.log(`[PHOENIX FIX] Added ${card.name} back to hand`);
        } else {
            console.log('[PHOENIX FIX] Hand full, cannot add Phoenix');
        }
        return;
    }
    
    // For all other deathrattles, call original
    if (_originalHandleDeathrattleForPhoenix) {
        _originalHandleDeathrattleForPhoenix.call(this, card, player);
    }
};

console.log('✅ Phoenix Resurrect Fix loaded!');
console.log('   🦅 Removed overly strict early return check');
console.log('   ✨ Phoenix and Resurrect abilities now work correctly');
console.log('   🔧 Also fixes: Crimson Phoenix, Azure Phoenix, Verdant Phoenix, Umbral Phoenix, Phoenix Eternal');
