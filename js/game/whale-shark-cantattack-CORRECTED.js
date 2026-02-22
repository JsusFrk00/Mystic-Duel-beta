// ========================================================================
// WHALE SHARK CAN'T ATTACK FIX
// ========================================================================
// IMPLEMENTS: Explicit cantAttack flag for creatures with "Can't attack" ability
// Applies to: Whale Shark and any other creatures with this restriction
//
// HOW IT WORKS:
// 1. Checks for "Can't attack" in ability text
// 2. Sets cantAttack = true flag on affected cards
// 3. Checks flag in attack logic to prevent attacks
// 4. Works even if creature gets buffed with +attack

console.log('🦈 Loading Whale Shark Can\'t Attack Fix...');

// Add initialization method to Card prototype
if (window.Card && window.Card.prototype) {
    const _originalCardInit = window.Card.prototype.initializeAbilities || function() {};
    
    window.Card.prototype.initializeAbilities = function() {
        // Call original if exists
        _originalCardInit.call(this);
        
        // Check for "Can't attack" in ability text
        if (this.ability && this.ability.includes("Can't attack")) {
            this.cantAttack = true;
            console.log(`[CAN'T ATTACK] ${this.name} flagged as cantAttack=true`);
        }
    };
}

// Helper function to ensure cantAttack flag is set
function ensureCantAttackFlag(card) {
    if (card && card.ability && card.ability.includes("Can't attack") && !card.cantAttack) {
        card.cantAttack = true;
        console.log(`[CAN'T ATTACK] Set cantAttack flag on ${card.name}`);
    }
}

// Store original attackWithCard function
const _originalAttackWithCard = Game.prototype.attackWithCard;

Game.prototype.attackWithCard = function(card, target, player) {
    // Ensure cantAttack flag is set (in case card was created before patch loaded)
    ensureCantAttackFlag(card);
    
    // Check cantAttack flag FIRST, before any other checks
    if (card.cantAttack) {
        console.log(`[CAN'T ATTACK] ${card.name} is prevented from attacking (cantAttack flag)`);
        this.addLog(`${card.name} can't attack!`);
        return; // Prevent attack
    }
    
    // Call original attack function
    return _originalAttackWithCard.call(this, card, target, player);
};

// Hook into card creation/drawing to set flag early
const _originalDrawCard = Game.prototype.drawCard;

Game.prototype.drawCard = function(player) {
    const result = _originalDrawCard.call(this, player);
    
    // Check newly drawn cards
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    if (hand && hand.forEach) {
        hand.forEach(ensureCantAttackFlag);
    }
    
    return result;
};

// Hook into playCard to set flag on creatures being played
const _originalPlayCardForWhale = Game.prototype.playCard;

Game.prototype.playCard = function(card, player, target) {
    // Set cantAttack flag if needed
    ensureCantAttackFlag(card);
    
    // Call original
    return _originalPlayCardForWhale.call(this, card, player, target);
};

console.log('✅ Whale Shark Can\'t Attack Fix loaded!');
console.log('   🦈 Creatures with "Can\'t attack" ability are explicitly flagged');
console.log('   🚫 Cannot attack even if buffed with +attack');
console.log('   ✨ Applies to: Whale Shark and any similar creatures');
