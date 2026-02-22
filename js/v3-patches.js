// V3.0.0 Runtime Patches
// This file runs LAST and patches all game modules to use server APIs
// Applied at runtime to avoid modifying core game files

console.log('🔒 Applying v3.0.0 runtime patches...');

// Only apply patches if in v3 mode
if (window.isV3Mode) {
    
    // ============ PATCH: Game.endGame() ============
    if (window.Game && window.Game.prototype.endGame) {
        const originalEndGame = window.Game.prototype.endGame;
        
        window.Game.prototype.endGame = async function(winner) {
            this.gameOver = true;
            
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
            
            console.log('[V3] Game ended. Submitting to server...');
            
            try {
                const result = await window.apiClient.completeGame(winner === 'player', gameData);
                
                // Update local data from server
                window.playerData.gold = result.newGold;
                window.playerData.gems = result.newGems;
                
                // Update local game stats from server
                if (result.gameStats) {
                    window.playerData.gameStats = {
                        ...window.playerData.gameStats,
                        ...result.gameStats
                    };
                    console.log('[V3] Updated local stats from server:', result.gameStats);
                }
                
                console.log('[V3] Server rewards:', result.goldReward, 'gold,', result.gemsReward, 'gems');
                
                window.ui.updateCurrencyDisplay();
                window.ui.showWinnerScreen(winner, result.goldReward || 0, result.gemsReward || 0);
                
            } catch (error) {
                console.error('[V3] Failed to save game result:', error);
                alert('⚠️ Failed to save game result to server.\n\nRewards not granted. Please check your connection.');
                window.ui.showWinnerScreen(winner, 0, 0);
            }
        };
        
        console.log('[V3] ✅ Patched: Game.endGame() → uses /api/game/complete');
    }
    
    // ============ PATCH: Daily Reward ============
    if (window.ui && window.ui.claimDailyReward) {
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
                    window.ui.showNotification(
                        `Daily Reward Claimed! +${result.goldReward} Gold 🪙 +${result.gemsReward} Gem 💎`, 
                        'success'
                    );
                }
            } catch (error) {
                console.error('[V3] Daily reward failed:', error);
                alert('Failed to claim daily reward: ' + error.message);
            }
        };
        
        console.log('[V3] ✅ Patched: ui.claimDailyReward() → uses /api/player/daily-reward');
    }

    console.log('[V3] ✅ All runtime patches applied successfully!');
    console.log('[V3] Game is now using server-authoritative architecture');
    console.log('[V3] 🔒 localStorage is READ-ONLY (migration only)');
    
} else {
    console.log('[V2.1] Skipping v3 patches - running in v2.1 mode');
}
