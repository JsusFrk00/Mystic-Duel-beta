// ========================================================================
// ARCHMAGE SOLARIUS FIX - Double Spell Damage
// ========================================================================
// Implements "Double spell damage" aura effect
// While Archmage Solarius is alive, all player spell damage is multiplied by 2
// MUST load AFTER v3-abilities-complete.js

console.log('🧙 Loading Archmage Solarius Fix...');

// Helper function: Check if player has Archmage Solarius
Game.prototype.hasArchmageSolarius = function(player) {
    const field = player === 'player' ? this.playerField : this.aiField;
    return field.some(c => c.ability === 'Double spell damage' || c.name === 'Archmage Solarius');
};

// Store original handleSpell
const _originalHandleSpellForArchmage = Game.prototype.handleSpell;

// Patch handleSpell to apply double damage multiplier
Game.prototype.handleSpell = function(card, player, target = null) {
    // Check if player has Archmage Solarius
    const hasArchmage = this.hasArchmageSolarius(player);
    
    if (hasArchmage) {
        console.log('[ARCHMAGE] Archmage Solarius is on field - doubling spell damage!');
        
        // Set a temporary flag that spell damage handlers can check
        this._archmageActive = true;
    }
    
    // Call original handleSpell
    _originalHandleSpellForArchmage.call(this, card, player, target);
    
    // Clear flag after spell resolves
    this._archmageActive = false;
};

// Patch dealDamage to apply Archmage multiplier
const _originalDealDamage = Game.prototype.dealDamage;
Game.prototype.dealDamage = function(target, amount) {
    // If Archmage is active and this is spell damage, double it
    if (this._archmageActive && amount > 0) {
        console.log(`[ARCHMAGE] Doubling spell damage: ${amount} → ${amount * 2}`);
        amount = amount * 2;
    }
    
    // Call original dealDamage with modified amount
    return _originalDealDamage.call(this, target, amount);
};

// Patch Card.takeDamage to apply Archmage multiplier for spell damage to creatures
const _originalCardTakeDamageForArchmage = window.Card.prototype.takeDamage;
window.Card.prototype.takeDamage = function(amount, source) {
    // Get game instance
    const game = window.game;
    
    // If Archmage is active and this is spell damage, double it
    if (game && game._archmageActive && amount > 0) {
        console.log(`[ARCHMAGE] Doubling spell damage to ${this.name}: ${amount} → ${amount * 2}`);
        amount = amount * 2;
    }
    
    // Call original takeDamage with modified amount
    return _originalCardTakeDamageForArchmage.call(this, amount, source);
};

console.log('✅ Archmage Solarius Fix loaded!');
console.log('   🧙 Double spell damage aura implemented');
console.log('   ✨ Applies to damage spells targeting creatures');
console.log('   💥 Applies to damage spells targeting players');
console.log('   📊 Works with all spell damage bonuses (additive then multiply)');
console.log('   🎯 Example: 3 damage spell + 2 bonus = 5, then ×2 = 10 total');
