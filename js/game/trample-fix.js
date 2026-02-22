// ========================================================================
// TRAMPLE FIX - Calculate Excess Before Combat
// ========================================================================
// Problem: takeDamage() clamps health to 0, losing excess damage info
// Solution: Calculate potential excess BEFORE combat, apply AFTER
// MUST load AFTER Game.js

console.log('⚔️ Loading Trample Fix...');

// Store the original creatureCombat
const _originalCreatureCombatForTrample = Game.prototype.creatureCombat;

// Patch creatureCombat to fix Trample
Game.prototype.creatureCombat = function(attacker, target) {
    // Check if attacker has Trample
    const hasTrample = attacker.ability?.includes('Trample') || attacker.trampleGranted;
    
    console.log(`[TRAMPLE] ${attacker.name} vs ${target.name}, hasTrample: ${hasTrample}`);
    
    // Calculate potential excess damage BEFORE combat
    // This is the damage that would "trample over" if target dies
    const targetHealthBefore = target.health;
    const attackDamage = attacker.attack;
    const potentialExcess = attackDamage - targetHealthBefore;
    
    console.log(`[TRAMPLE] Attack: ${attackDamage}, Target health: ${targetHealthBefore}, Potential excess: ${potentialExcess}`);
    
    // Check if target has Divine Shield (which would block all damage)
    const divineShieldWillBlock = target.divineShield;
    
    // Call original combat (handles all damage, shields, first strike, etc.)
    _originalCreatureCombatForTrample.call(this, attacker, target);
    
    // AFTER combat, check if Trample should trigger
    // Conditions:
    // 1. Attacker has Trample
    // 2. Target died (health <= 0)
    // 3. There was excess damage (potentialExcess > 0)
    // 4. Divine Shield didn't block (would prevent any damage)
    if (hasTrample && target.health <= 0 && potentialExcess > 0 && !divineShieldWillBlock) {
        // Determine which player to damage
        const attackerOwner = this.playerField.includes(attacker) ? 'player' : 'ai';
        const enemyPlayer = attackerOwner === 'player' ? 'ai' : 'player';
        
        console.log(`[TRAMPLE] ✅ Triggering! Dealing ${potentialExcess} to ${enemyPlayer}`);
        
        this.dealDamage(enemyPlayer, potentialExcess);
        this.addLog(`💥 Trample! ${potentialExcess} excess damage!`);
    } else {
        console.log(`[TRAMPLE] Not triggered - died: ${target.health <= 0}, excess: ${potentialExcess}, shield: ${divineShieldWillBlock}`);
    }
};

console.log('✅ Trample Fix loaded!');
console.log('   📊 Calculates excess BEFORE combat');
console.log('   💥 Applies excess AFTER target dies');
console.log('   🛡️ Respects Divine Shield blocking');
console.log('   ✨ Works with trampleGranted flag');
