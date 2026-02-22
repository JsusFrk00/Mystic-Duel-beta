// ========================================================================
// SPLASH BONUS TIMING FIX
// ========================================================================
// BUG: Splash heal bonuses trigger on card SELECTION, before actual play
// FIX: Only apply splash bonuses if card was actually played (removed from hand)

console.log('⏱️ Loading Splash Bonus Timing Fix...');

// Override playCard to track if card was successfully played
const _originalPlayCardTiming = Game.prototype.playCard;

Game.prototype.playCard = function(card, player, target) {
    const playerHand = player === 'player' ? this.playerHand : this.aiHand;
    const handSizeBefore = playerHand.length;
    
    // Call original playCard
    const result = _originalPlayCardForSplash.call(this, card, player, target);
    
    const handSizeAfter = playerHand.length;
    const cardWasPlayed = handSizeAfter < handSizeBefore; // Card removed from hand
    
    // ONLY apply splash bonus if card was actually played
    if (cardWasPlayed && card.type === 'spell' && card.splashFriendly && card.splashBonus) {
        const field = player === 'player' ? this.playerField : this.aiField;
        const isSplashed = isSplashCard(card, field);
        
        if (isSplashed) {
            console.log(`[SPLASH TIMING] ${card.name} successfully played AND splashed - applying bonus`);
            
            const bonus = card.splashBonus.toLowerCase();
            
            // Restore health bonuses (only if card was actually played)
            if (bonus.includes('restore 3 health')) {
                const healAmount = 3;
                if (player === 'player') {
                    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                } else {
                    this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healAmount);
                }
                this.addLog(`✨ Splash bonus: Restored ${healAmount} health!`);
            }
            
            if (bonus.includes('restore 5 health')) {
                const healAmount = 5;
                if (player === 'player') {
                    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                } else {
                    this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healAmount);
                }
                this.addLog(`✨ Splash bonus: Restored ${healAmount} health!`);
            }
            
            // Draw card bonus
            if (bonus.includes('draw a card')) {
                this.drawCard(player);
                this.addLog(`✨ Splash bonus: Drew a card!`);
            }
        }
    } else if (!cardWasPlayed) {
        console.log(`[SPLASH TIMING] ${card.name} NOT played (still in hand) - skipping splash bonus`);
    }
    
    return result;
};

console.log('✅ Splash Bonus Timing Fix loaded!');
console.log('   ⏱️ Bonuses only trigger AFTER successful play');
console.log('   🚫 Prevents heal on card selection');
