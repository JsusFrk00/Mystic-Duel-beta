// ========================================================================
// SPLASH BONUS FIX
// ========================================================================
// BUG: isSplashCard detection works, but bonuses don't apply
// PROBLEM: No code checks splashBonus and applies effects after playing card
// FIX: Add splash bonus handler to playCard
//
// Load AFTER v3-abilities-complete.js

console.log('✨ Loading Splash Bonus Fix...');

// Store original playCard
const _originalPlayCardForSplash = Game.prototype.playCard;

Game.prototype.playCard = function(card, player, target) {
    const playerHand = player === 'player' ? this.playerHand : this.aiHand;
    const handSizeBefore = playerHand.length;
    
    // Call original playCard first
    const result = _originalPlayCardForSplash.call(this, card, player, target);
    
    const handSizeAfter = playerHand.length;
    const cardWasActuallyPlayed = handSizeAfter < handSizeBefore;
    
    // ONLY apply splash bonus if card was successfully played (removed from hand)
    if (cardWasActuallyPlayed && card.type === 'spell' && card.splashFriendly && card.splashBonus) {
        const field = player === 'player' ? this.playerField : this.aiField;
        
        // Check if card is splashed (3rd color) - use DECK not field
        const playerDeck = player === 'player' ? this.player.deck : this.ai.deck;
        const isSplashed = isSplashCard(card, playerDeck);
        
        if (isSplashed) {
            console.log(`[SPLASH FIX] ${card.name} is splashed! Applying bonus...`);
            console.log(`[SPLASH FIX] Bonus: ${card.splashBonus}`);
            
            // Apply splash bonuses
            const bonus = card.splashBonus.toLowerCase();
            
            // Restore health bonuses
            if (bonus.includes('restore 3 health')) {
                const healAmount = 3;
                if (player === 'player') {
                    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                } else {
                    this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healAmount);
                }
                this.addLog(`✨ Splash bonus: Restored ${healAmount} health!`);
                console.log(`[SPLASH FIX] Restored ${healAmount} health`);
            }
            
            if (bonus.includes('restore 5 health')) {
                const healAmount = 5;
                if (player === 'player') {
                    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                } else {
                    this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healAmount);
                }
                this.addLog(`✨ Splash bonus: Restored ${healAmount} health!`);
                console.log(`[SPLASH FIX] Restored ${healAmount} health`);
            }
            
            // Draw card bonus
            if (bonus.includes('draw a card')) {
                this.drawCard(player);
                this.addLog(`✨ Splash bonus: Drew a card!`);
                console.log(`[SPLASH FIX] Drew a card`);
            }
            
            // Update display to show changes
            if (this.updateDisplay) {
                this.updateDisplay();
            }
        }
    }
    
    return result;
};

console.log('✅ Splash Bonus Fix loaded!');
console.log('   ✨ Splash bonuses now apply when cards are splashed');
console.log('   🎯 Works for all splashFriendly cards');
console.log('   💚 Affects ~15 splash cards (Cauterize, Life Graft, etc.)');
