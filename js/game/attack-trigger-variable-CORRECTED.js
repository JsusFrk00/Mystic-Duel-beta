// ========================================================================
// ATTACK TRIGGER VARIABLE FIX - Complete
// ========================================================================
// BUG: triggerAttackAbilities uses "player" variable that doesn't exist
//      Parameter is "attackingPlayer" not "player"
//      Affects: Thought Stealer, Gaia's Wrath
// FIX: Override with correct variable names

console.log('🗡️ Loading Attack Trigger Variable Fix (Complete)...');

const _origTriggerAttack = Game.prototype.triggerAttackAbilities;

Game.prototype.triggerAttackAbilities = function(attacker, target, attackingPlayer, enemyPlayer) {
    const ability = attacker.ability;
    const field = attackingPlayer === 'player' ? this.playerField : this.aiField;
    const enemyField = attackingPlayer === 'player' ? this.aiField : this.playerField;
    
    // Attack Trigger: Enemy discards - FIX: use attackingPlayer not player
    if (ability && ability.includes('Attack Trigger: Enemy discards a card')) {
        const enemyHand = attackingPlayer === 'player' ? this.aiHand : this.playerHand; // FIXED
        if (enemyHand.length > 0) {
            enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1);
            this.addLog("Enemy discarded a card!");
            console.log('[ATTACK FIX] Enemy discarded a card');
        }
        return; // Handled, don't call original
    }
    
    // Attack Trigger: All allies gain +2/+2, You gain 5 health - FIX: use attackingPlayer
    if (ability && ability.includes('Attack Trigger: All allies gain +2/+2')) {
        field.forEach(c => {
            if (c !== attacker) {
                c.attack += 2;
                c.health += 2;
                c.maxHealth += 2;
            }
        });
        // FIX: use attackingPlayer not player
        if (attackingPlayer === 'player') {
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
        } else {
            this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
        }
        this.addLog("All allies gain +2/+2! You gain 5 health!");
        console.log('[ATTACK FIX] Buffed allies and healed');
        return; // Handled
    }
    
    // Call original for all other attack triggers
    if (_origTriggerAttack) {
        _origTriggerAttack.call(this, attacker, target, attackingPlayer, enemyPlayer);
    }
};

console.log('✅ Attack Trigger Variable Fix loaded!');
console.log('   🧠 Thought Stealer: Enemy discards fixed');
console.log('   🌍 Gaia\'s Wrath: Heal + buff fixed');
console.log('   🗡️ Fixed all player/attackingPlayer mismatches');
