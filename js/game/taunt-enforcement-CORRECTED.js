// ========================================================================
// TAUNT ENFORCEMENT FIX
// ========================================================================
// Ensures Taunt creatures must be attacked first
// Load AFTER Game.js

console.log('🛡️ Loading Taunt Enforcement Fix...');

const _origAttackWithCard = Game.prototype.attackWithCard;

Game.prototype.attackWithCard = function(attacker, target) {
    const isTargetCreature = target && typeof target === 'object' && target.health !== undefined;
    const enemyField = this.currentTurn === 'player' ? this.aiField : this.playerField;
    
    // Check for Taunt creatures
    const taunts = enemyField.filter(c => c.taunt || c.ability === 'Taunt' || c.ability?.includes('Taunt'));
    
    // Check if attacker can bypass Taunt
    const canBypass = attacker.ability && (
        attacker.ability.includes('Cannot be blocked') ||
        attacker.ability.includes('Bypass Taunt')
    );
    
    console.log(`[TAUNT FIX] Attacker: ${attacker.name}, Target: ${target === 'ai' || target === 'player' ? 'face' : target.name}`);
    console.log(`[TAUNT FIX] Taunts on board: ${taunts.length}, Can bypass: ${canBypass}`);
    
    // If attacking face or non-Taunt creature while Taunts exist
    if (taunts.length > 0 && !canBypass) {
        if (!isTargetCreature || (!target.taunt && !target.ability?.includes('Taunt'))) {
            console.log(`[TAUNT FIX] ❌ BLOCKED - Must attack Taunt first!`);
            this.addLog("Must attack Taunt creatures first!");
            return false;
        }
    }
    
    console.log(`[TAUNT FIX] ✅ Attack allowed`);
    
    // Call original
    return _origAttackWithCard.call(this, attacker, target);
};

console.log('✅ Taunt Enforcement Fix loaded!');
console.log('   🛡️ Taunt creatures must be attacked first');
console.log('   🎯 Prevents face attacks when Taunt is on board');
