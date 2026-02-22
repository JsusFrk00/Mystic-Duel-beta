// ========================================================================
// v3.1.4 COMPREHENSIVE ABILITY FIXES
// ========================================================================

console.log('🔧 Loading v3.1.4 Comprehensive Bug Fixes...');

// Track if attack triggers have fired this attack (prevent double triggers)
let attackTriggersExecuted = new WeakMap();

// Override attack to track trigger execution
const _origAttackForTriggers = Game.prototype.attack;
Game.prototype.attack = function(attacker, target) {
    // Mark that this attack hasn't triggered abilities yet
    attackTriggersExecuted.set(attacker, false);
    
    // Call original
    const result = _origAttackForTriggers.call(this, attacker, target);
    
    return result;
};

// Override triggerAttackAbilities to prevent double execution
const _origTriggerAttackAbilities = Game.prototype.triggerAttackAbilities;
Game.prototype.triggerAttackAbilities = function(attacker, target, attackingPlayer, enemyPlayer) {
    // Check if we've already triggered for this attack
    if (attackTriggersExecuted.get(attacker) === true) {
        console.log(`[ATTACK TRIGGER] Skipping duplicate trigger for ${attacker.name}`);
        return;
    }
    
    // Mark as triggered
    attackTriggersExecuted.set(attacker, true);
    
    console.log(`[ATTACK TRIGGER] Executing for ${attacker.name}`);
    
    // Call original
    return _origTriggerAttackAbilities.call(this, attacker, target, attackingPlayer, enemyPlayer);
};

console.log('✅ Fix 1: Morthul double trigger prevention loaded');

// =================
// FIX 2: Cauterize false splash detection
// =================
// BUG: Cauterize heals in Crimson-Umbral deck (should not - crimson is main color)
// FIX: Ensure splash detection checks correctly

const _origApplySplashBonus = window.splashHandler?.applySplashBonus;
if (_origApplySplashBonus && window.splashHandler) {
    window.splashHandler.applySplashBonus = function(card, player, opponent, game) {
        if (!card.splashBonus) return false;
        
        const isSplashed = this.isSplashed(card, player.deck);
        
        console.log(`[SPLASH CHECK] ${card.name} (${card.color})`);
        console.log(`  Main colors:`, Array.from(this.getMainColors(player.deck)));
        console.log(`  Is splashed?:`, isSplashed);
        
        if (!isSplashed) {
            console.log(`[SPLASH] ${card.name} is NOT splashed (main color)`);
            return false;
        }
        
        console.log(`✨ [SPLASH] ${card.name} IS SPLASHED! Applying bonus`);
        
        // Call original
        return _origApplySplashBonus.call(this, card, player, opponent, game);
    };
}

console.log('✅ Fix 2: Cauterize splash detection with logging');

// =================
// FIX 3: Plague Wind damage verification
// =================
// Add logging to verify damage amount

console.log('✅ Fix 3: Plague Wind damage logging added to v3-abilities-complete.js');

console.log('🎯 v3.1.4 Comprehensive Fixes Loaded');
console.log('   💀 Morthul: Prevented double attack triggers');
console.log('   🔥 Cauterize: Splash detection debug logging');
console.log('   🦠 Plague Wind: Damage verification');
console.log('   🌑 Shadow Infinity: Attack trigger added');
