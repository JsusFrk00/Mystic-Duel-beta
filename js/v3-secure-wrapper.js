// V3.0.0 Secure Mode Wrapper
// This file intercepts game actions and redirects them to the server API

console.log('🔒 Loading v3.0.0 Secure Mode Wrapper...');

// Only activate if in v3 mode
if (window.isV3Mode) {
    console.log('[V3] Activating secure mode interceptors');

    // Intercept Game.prototype.endGame to use API
    const OriginalGame = window.Game;
    
    if (OriginalGame) {
        const originalEndGame = OriginalGame.prototype.endGame;
        
        OriginalGame.prototype.endGame = async function(winner) {
            this.gameOver = true;
            
            // Compile game statistics
            const gameData = {
                turnCount: this.totalTurns,
                damageDealt: this.gameStats.playerDamageDealt,
                damageTaken: this.gameStats.playerDamageTaken,
                cardsPlayed: this.gameStats.playerCardsPlayed,
                manaSpent: this.gameStats.playerManaSpent,
                creaturesSummoned: this.gameStats.playerCreaturesSummoned,
                spellsCast: this.gameStats.playerSpellsCast,
                cardsUsed: Array.from(this.gameStats.cardsUsedThisGame),
                winBy: winner === 'player' ? this.determineWinCondition() : null,
                lostBy: winner !== 'player' ? this.determineWinCondition() : null
            };
            
            console.log('[V3] Game ended. Sending to server...');
            
            try {
                const result = await window.apiClient.completeGame(winner === 'player', gameData);
                
                // Update from server
                window.playerData.gold = result.newGold;
                window.playerData.gems = result.newGems;
                
                console.log('[V3] Server rewards:', result.goldReward, 'gold,', result.gemsReward, 'gems');
                
                // Update UI
                window.ui.updateCurrencyDisplay();
                window.ui.showWinnerScreen(winner, result.goldReward || 0, result.gemsReward || 0);
                
            } catch (error) {
                console.error('[V3] Failed to save game result:', error);
                alert('Failed to save game result. Rewards not granted.');
                window.ui.showWinnerScreen(winner, 0, 0);
            }
        };
        
        console.log('[V3] ✅ Game.endGame() intercepted for API use');
    }

    // Intercept daily reward to use API
    const originalClaimDaily = window.ui.claimDailyReward;
    
    window.ui.claimDailyReward = async function() {
        const hoursLeft = window.storage.getTimeUntilDailyReward();
        
        if (hoursLeft > 0) {
            alert(`Daily reward available in ${hoursLeft} hours!`);
            return;
        }
        
        try {
            console.log('[V3] Claiming daily reward via API...');
            const result = await window.storage.claimDailyRewardV3();
            
            if (result.success) {
                window.ui.updateCurrencyDisplay();
                window.ui.checkDailyReward();
                window.ui.showNotification(`Daily Reward Claimed! +${result.goldReward} Gold 🪙 +${result.gemsReward} Gem 💎`, 'success');
            }
        } catch (error) {
            alert('Failed to claim daily reward: ' + error.message);
        }
    };
    
    console.log('[V3] ✅ Daily reward intercepted for API use');

    console.log('[V3] ✅ All secure mode interceptors active!');
}

console.log('✅ V3 Secure Wrapper loaded');
