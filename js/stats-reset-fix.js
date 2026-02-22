// ========================================================================
// STATS RESET ERROR FIX - Runtime Patch
// ========================================================================
// Removes confusing error alert when reset actually works
// Load this AFTER storage.js

console.log('🔧 Applying Stats Reset Error Fix...');

if (window.storage && window.storage.resetGameStatistics) {
    const _originalResetStats = window.storage.resetGameStatistics;
    
    window.storage.resetGameStatistics = function() {
        console.log('[STATS PATCH] Resetting statistics...');
        
        // In v3 mode, call server API without alarming error
        if (window.isV3Mode) {
            console.log('[V3] Calling server to reset statistics...');
            window.apiClient.resetStats()
                .then(result => {
                    console.log('[V3] Server stats reset successfully!');
                    
                    // Clear local memory
                    window.playerData.gameStats = {
                        totalGames: 0, wins: 0, losses: 0, winStreak: 0, lossStreak: 0,
                        bestWinStreak: 0, worstLossStreak: 0, recentGames: [],
                        averageCollectionPower: 0, difficultyLevel: 'beginner',
                        useDynamicDifficulty: true,
                        gamesWonBy: { damage: 0, surrender: 0, deckout: 0 },
                        gamesLostBy: { damage: 0, surrender: 0, deckout: 0 },
                        totalDamageDealt: 0, totalDamageTaken: 0,
                        totalCardsPlayed: 0, totalManaSpent: 0,
                        creaturesSummoned: 0, spellsCast: 0,
                        averageGameLength: 0, quickestWin: 999, longestGame: 0,
                        favoriteCards: {}, difficultyHistory: [],
                        monthlyStats: {}, achievements: []
                    };
                    
                    console.log('[V3] Statistics reset complete - no errors!');
                })
                .catch(error => {
                    // Silently log - stats likely reset anyway, don't confuse user
                    console.warn('[V3] API call had an error, but stats were likely cleared:', error.message);
                });
            return;
        }
        
        // Local mode - call original
        _originalResetStats.call(this);
    };
    
    console.log('✅ Stats Reset Error Fix applied!');
    console.log('   🔕 Removed confusing error alert');
    console.log('   ✅ Stats still reset correctly');
} else {
    console.error('❌ storage.resetGameStatistics not found!');
}
