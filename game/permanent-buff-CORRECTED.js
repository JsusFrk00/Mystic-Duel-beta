// ========================================================================
// PERMANENT BUFF FIX
// ========================================================================
// BUG: Buff spells update attack/health but not baseAttack/baseHealth
//      Aura recalculations at end of turn reset to base, removing buffs
// FIX: Override handleSpell to update base stats for permanent buffs

console.log('💪 Loading Permanent Buff Fix...');

const _origHandleSpellForBuffs = Game.prototype.handleSpell;

Game.prototype.handleSpell = function(card, player, target) {
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // Intercept buff spells to add base stat updates
    if (ability && (ability.includes('All allies +') || ability.includes('All your creatures gain +'))) {
        console.log(`[BUFF FIX] Intercepting ${card.name} to make buff permanent`);
        
        // Parse buff amount
        const match = ability.match(/\+(\d+)\/\+(\d+)/);
        if (match) {
            const attackBuff = parseInt(match[1]);
            const healthBuff = parseInt(match[2]);
            
            console.log(`[BUFF FIX] Applying permanent +${attackBuff}/+${healthBuff} to all allies`);
            
            field.forEach(c => {
                c.attack += attackBuff;
                c.health += healthBuff;
                c.maxHealth += healthBuff;
                // CRITICAL: Update base stats for permanence
                c.baseAttack += attackBuff;
                c.baseHealth += healthBuff;
            });
            
            this.addLog(`All creatures gain +${attackBuff}/+${healthBuff}!`);
            return; // Don't call original
        }
    }
    
    // Color-specific buffs
    if (ability && ability.includes('All Crimson creatures gain +')) {
        const match = ability.match(/\+(\d+)\/\+(\d+)/);
        if (match) {
            const attackBuff = parseInt(match[1]);
            const healthBuff = parseInt(match[2]);
            
            field.forEach(c => {
                if (c.color && c.color.includes('crimson')) {
                    c.attack += attackBuff;
                    c.health += healthBuff;
                    c.maxHealth += healthBuff;
                    c.baseAttack += attackBuff;
                    c.baseHealth += healthBuff;
                }
            });
            
            this.addLog(`All Crimson creatures gain +${attackBuff}/+${healthBuff}!`);
            return;
        }
    }
    
    if (ability && ability.includes('All Verdant creatures gain +')) {
        const match = ability.match(/\+(\d+)\/\+(\d+)/);
        if (match) {
            const attackBuff = parseInt(match[1]);
            const healthBuff = parseInt(match[2]);
            
            field.forEach(c => {
                if (c.color && c.color.includes('verdant')) {
                    c.attack += attackBuff;
                    c.health += healthBuff;
                    c.maxHealth += healthBuff;
                    c.baseAttack += attackBuff;
                    c.baseHealth += healthBuff;
                }
            });
            
            this.addLog(`All Verdant creatures gain +${attackBuff}/+${healthBuff}!`);
            
            // Grant Trample if applicable
            if (ability.includes('and Trample')) {
                field.forEach(c => {
                    if (c.color && c.color.includes('verdant')) {
                        c.trampleGranted = true;
                    }
                });
            }
            return;
        }
    }
    
    // Call original for other spells
    _origHandleSpellForBuffs.call(this, card, player, target);
};

console.log('✅ Permanent Buff Fix loaded!');
console.log('   💪 Buffs now persist through end of turn');
console.log('   🎯 Affects: Battle Cry, Rally, all buff spells');
