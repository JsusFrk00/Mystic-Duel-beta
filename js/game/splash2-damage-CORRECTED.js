// ========================================================================
// SPLASH 2 DAMAGE FIX - CORRECTED v2
// ========================================================================
// BUG: Burn/Splash damage counts creatures (1 per), not damage amount
// FIX: Calculate damage per creature correctly BEFORE original runs

console.log('🦈 Loading Splash 2 Damage Fix v2...');

// Store the ORIGINAL startNewTurn before v3-abilities patches it
const _veryOriginalStartNewTurn = Game.prototype.startNewTurn;

// Replace startNewTurn with corrected Burn/Splash logic
Game.prototype.startNewTurn = function(player) {
    // Don't call original yet - do our own Burn/Splash calculation first
    
    if (player === 'player') {
        // Calculate Burn/Splash damage from AI creatures
        let burnDamage = 0;
        
        this.aiField.forEach(c => {
            if (!c.ability) return;
            
            // Check for Splash 2 FIRST (before checking Splash)
            if (c.ability.includes('Splash 2')) {
                burnDamage += 2;
                console.log(`[SPLASH 2 FIX] ${c.name} deals 2 damage`);
            } else if (c.ability.includes('Splash')) {
                burnDamage += 1;
                console.log(`[SPLASH FIX] ${c.name} deals 1 damage`);
            } else if (c.ability === 'Burn') {
                burnDamage += 1;
            }
        });
        
        if (burnDamage > 0) {
            this.dealDamage('player', burnDamage);
            this.addLog(`Burn/Splash deals ${burnDamage} damage to you!`);
        }
        
        // Now handle rest of turn start (mana, draw, etc.)
        // But skip the Burn/Splash damage part since we already did it
        
        // Clear justPlayed flags
        this.playerField.forEach(c => {
            if (c.justPlayed) c.justPlayed = false;
        });
        
        this.drawCard('player');
        this.addLog("Your turn begins!");
        
    } else {
        // Calculate Burn/Splash from player creatures
        let burnDamage = 0;
        
        this.playerField.forEach(c => {
            if (!c.ability) return;
            
            if (c.ability.includes('Splash 2')) {
                burnDamage += 2;
                console.log(`[SPLASH 2 FIX] ${c.name} deals 2 damage`);
            } else if (c.ability.includes('Splash')) {
                burnDamage += 1;
                console.log(`[SPLASH FIX] ${c.name} deals 1 damage`);
            } else if (c.ability === 'Burn') {
                burnDamage += 1;
            }
        });
        
        if (burnDamage > 0) {
            this.dealDamage('ai', burnDamage);
            this.addLog(`Burn/Splash deals ${burnDamage} damage to opponent!`);
        }
        
        // Handle AI turn start logic
        const settings = this.difficultySettings || {};
        let aiManaGain = settings.aiManaPerTurn || 1;
        
        this.aiMana = Math.min(10, this.aiMana + aiManaGain);
        
        // Clear justPlayed flags
        this.aiField.forEach(c => {
            if (c.justPlayed) c.justPlayed = false;
        });
        
        this.drawCard('ai');
        this.addLog("AI's turn begins...");
    }
    
    // Call original for remaining logic (save snapshot, updateDisplay, etc.)
    // But original will try to do Burn/Splash again - we need to prevent that
    // Store fields to restore after
    const playerFieldBackup = [...this.playerField];
    const aiFieldBackup = [...this.aiField];
    const playerHealthBackup = this.playerHealth;
    const aiHealthBackup = this.aiHealth;
    
    // Call original
    _veryOriginalStartNewTurn.call(this, player);
    
    // Restore health (original added Burn/Splash again)
    this.playerHealth = playerHealthBackup;
    this.aiHealth = aiHealthBackup;
};

console.log('✅ Splash 2 Damage Fix v2 loaded!');
console.log('   🦈 Splash 2 deals 2 damage per turn');
console.log('   💧 Splash deals 1 damage');
console.log('   🔥 Burn deals 1 damage');
