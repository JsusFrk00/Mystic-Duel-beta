// Splash Integration - v3.0
// Integrates splash handler with game logic

console.log('🔄 splash-integration.js loading...');

let splashInitAttempts = 0;
const MAX_SPLASH_INIT_ATTEMPTS = 50; // Max 5 seconds (50 * 100ms)

// Wait for game to be ready
function initializeSplashIntegration() {
    if (!window.game) {
        splashInitAttempts++;
        
        if (splashInitAttempts < MAX_SPLASH_INIT_ATTEMPTS) {
            // Only log every 10 attempts to reduce spam
            if (splashInitAttempts % 10 === 1) {
                console.log('[Splash Integration] Waiting for game to load... (attempt ' + splashInitAttempts + ')');
            }
            setTimeout(initializeSplashIntegration, 100);
            return;
        } else {
            console.log('[Splash Integration] Timeout - game not loaded after 5 seconds. Will initialize when game starts.');
            return;
        }
    }
    
    console.log('[Splash Integration] Hooking into game events...');
    
    // Hook into card playing
    const originalHandleCardClick = window.game.handleCardClick;
    if (originalHandleCardClick) {
        window.game.handleCardClick = function(card) {
            // Check for splash bonus BEFORE playing the card
            const isSplash = window.splashHandler && window.splashHandler.isSplashed(card, this.player.deck);
            
            if (isSplash && card.splashBonus) {
                console.log(`✨ [Splash] Detected splash card: ${card.name}`);
                // Store that this card was splashed (for effect application)
                this._currentSplashCard = card;
            }
            
            // Call original function
            const result = originalHandleCardClick.call(this, card);
            
            // Apply splash bonus AFTER card is played
            if (this._currentSplashCard && window.splashHandler) {
                window.splashHandler.applySplashBonus(
                    this._currentSplashCard, 
                    this.player, 
                    this.ai, 
                    this
                );
                this._currentSplashCard = null;
            }
            
            return result;
        };
    }
    
    console.log('✅ Splash integration complete');
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSplashIntegration);
} else {
    initializeSplashIntegration();
}
