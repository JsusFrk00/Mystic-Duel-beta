// Splash Handler - v3.0
// Handles splash card bonus detection and application

console.log('🔄 splash-handler.js loading...');

class SplashHandler {
    constructor() {
        this.activeSplashBonuses = new Map(); // Track active splash bonuses
    }

    // Determine player's main colors from their deck
    getMainColors(deck) {
        const mainColors = new Set();
        
        deck.forEach(card => {
            // Skip colorless cards
            if (card.color === 'colorless') return;
            
            // Skip splash-friendly cards (they don't count as main colors)
            if (card.splashFriendly) return;
            
            // Handle dual-color cards (e.g., "crimson-azure" counts as BOTH)
            const colors = card.color.split('-');
            colors.forEach(c => mainColors.add(c));
        });
        
        return mainColors;
    }

    // Check if a card is being splashed (3rd color)
    isSplashed(card, playerDeck) {
        // Must be splash-friendly
        if (!card.splashFriendly) return false;
        
        // Get player's main colors
        const mainColors = this.getMainColors(playerDeck);
        
        // Card is splashed if its color is NOT in main colors
        return !mainColors.has(card.color);
    }

    // Apply splash bonus when card is played
    applySplashBonus(card, player, opponent, game) {
        if (!card.splashBonus) return false;
        
        const isSplashed = this.isSplashed(card, player.deck);
        
        if (!isSplashed) {
            console.log(`[Splash] ${card.name} is NOT splashed (main color)`);
            return false;
        }
        
        console.log(`✨ [Splash] ${card.name} IS SPLASHED! Applying bonus: ${card.splashBonus}`);
        
        // Show splash animation
        this.showSplashAnimation(card);
        
        // Parse and apply the bonus effect
        this.applyBonusEffect(card.splashBonus, player, opponent, game);
        
        return true;
    }

    // Apply the actual bonus effect
    applyBonusEffect(bonusText, player, opponent, game) {
        // Parse splash bonus text and apply effects
        
        if (bonusText.includes('restore 3 health to your hero')) {
            player.health = Math.min(30, player.health + 3);
            game.updateUI();
            game.log(`✨ Splash Bonus: Restored 3 health`);
        }
        
        if (bonusText.includes('restore 5 health to your hero')) {
            player.health = Math.min(30, player.health + 5);
            game.updateUI();
            game.log(`✨ Splash Bonus: Restored 5 health`);
        }
        
        if (bonusText.includes('draw a card')) {
            game.drawCard(player);
            game.log(`✨ Splash Bonus: Drew a card`);
        }
        
        if (bonusText.includes("don't take the self-damage")) {
            // This prevents self-damage - handled in card effect logic
            this.activeSplashBonuses.set('preventSelfDamage', true);
            game.log(`✨ Splash Bonus: No self-damage`);
        }
        
        if (bonusText.includes("don't lose health") || bonusText.includes("don't take damage")) {
            // Prevent health loss
            this.activeSplashBonuses.set('preventHealthLoss', true);
            game.log(`✨ Splash Bonus: No health loss`);
        }
        
        if (bonusText.includes('only lose 2 health')) {
            // Reduce health loss from 5 to 2
            this.activeSplashBonuses.set('reduceHealthLoss', 5);
            game.log(`✨ Splash Bonus: Reduced health loss`);
        }
        
        if (bonusText.includes('ignore the cost penalty')) {
            // This is handled during cost calculation
            game.log(`✨ Splash Bonus: No cost penalty`);
        }
        
        if (bonusText.includes('always draw a card regardless of health')) {
            // Force draw regardless of condition
            game.drawCard(player);
            game.log(`✨ Splash Bonus: Always draw`);
        }
        
        if (bonusText.includes('+5 armor this turn')) {
            // Temporary immunity
            player.tempArmor = (player.tempArmor || 0) + 5;
            game.log(`✨ Splash Bonus: +5 armor`);
        }
        
        if (bonusText.includes('freeze all creatures adjacent to it')) {
            // Multi-freeze effect - would need target info
            game.log(`✨ Splash Bonus: Multi-freeze`);
        }
        
        if (bonusText.includes("don't take damage and also restore 3 health")) {
            // Prevent self-damage AND heal
            this.activeSplashBonuses.set('preventSelfDamage', true);
            player.health = Math.min(30, player.health + 3);
            game.updateUI();
            game.log(`✨ Splash Bonus: No damage + heal 3`);
        }
    }

    // Check if a splash bonus is active
    hasSplashBonus(bonusType) {
        return this.activeSplashBonuses.has(bonusType);
    }

    // Clear splash bonuses (after they're used)
    clearSplashBonuses() {
        this.activeSplashBonuses.clear();
    }

    // Show visual splash animation
    showSplashAnimation(card) {
        const sparkle = document.createElement('div');
        sparkle.textContent = '✨ Splash Bonus! ✨';
        sparkle.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 36px;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                         0 0 20px rgba(255, 215, 0, 0.6),
                         0 0 30px rgba(255, 215, 0, 0.4);
            animation: splashFadeOut 2s forwards;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(sparkle);
        
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.remove();
            }
        }, 2000);
        
        // Also log to game log
        if (window.game && window.game.log) {
            window.game.log(`✨ ${card.name} triggered Splash Bonus!`);
        }
    }
}

// Create global splash handler instance
window.splashHandler = new SplashHandler();

console.log('✅ Splash handler loaded');
