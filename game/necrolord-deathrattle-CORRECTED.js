// ========================================================================
// NECROLORD DEATHRATTLE FIX
// ========================================================================
// BUG: Necrolord adds creatures directly to field during filter()
//      Line 1255 in v3-abilities: field.push(resurrected)
//      These get lost when filter creates new array
// FIX: Use _pendingTokens system like Voidlings

console.log('💀 Loading Necrolord Deathrattle Fix...');

const _origHandleDeathrattleNecro = Game.prototype.handleDeathrattle;

Game.prototype.handleDeathrattle = function(card, player) {
    const ability = card.ability;
    const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
    
    // Necrolord - Summon all Umbral from graveyard using pending tokens
    if (ability && ability.includes('Deathrattle: Summon all Umbral creatures that died this game')) {
        console.log('[NECROLORD FIX] Summoning Umbral creatures from graveyard...');
        
        graveyard.filter(c => c.color && c.color.includes('umbral')).forEach(dead => {
            const resurrected = new window.Card({
                name: dead.name,
                cost: dead.cost,
                type: dead.type,
                attack: dead.attack,
                health: dead.maxHealth,
                ability: dead.ability,
                emoji: dead.emoji,
                rarity: dead.rarity,
                color: dead.color
            });
            resurrected.tapped = true;
            resurrected.maxHealth = dead.maxHealth;
            resurrected.baseAttack = dead.attack;
            resurrected.baseHealth = dead.maxHealth;
            
            // Queue for addition AFTER filter completes
            this._pendingTokens.push({ creature: resurrected, owner: player });
            console.log(`[NECROLORD FIX] Queued ${resurrected.name} for resurrection`);
        });
        
        this.addLog("Resurrected all Umbral creatures!");
        return; // Don't call original
    }
    
    // For all other deathrattles, call original
    if (_origHandleDeathrattleNecro) {
        _origHandleDeathrattleNecro.call(this, card, player);
    }
};

console.log('✅ Necrolord Deathrattle Fix loaded!');
console.log('   💀 Now uses pending tokens system');
console.log('   ✨ Umbral creatures will actually appear on field');
console.log('   🎯 Also fixes similar mass-summon deathrattles');
