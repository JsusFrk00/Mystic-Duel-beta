// Storage Management Utilities
// Access ALL_CARDS through global window object

// Check if we're in v3.0.0 secure mode
const isV3Mode = () => window.isV3Mode === true;

// Player Data Management
let playerData = {
    gold: 500,
    gems: 5,
    ownedCards: {},
    lastDailyReward: null,
    lastStoreRefresh: null,
    currentStoreCards: [],
    // Game Statistics for Dynamic Difficulty
    gameStats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        lossStreak: 0,
        bestWinStreak: 0,
        worstLossStreak: 0,
        recentGames: [], // Last 10 games (true = win, false = loss)
        averageCollectionPower: 0,
        difficultyLevel: 'beginner', // beginner, easy, normal, hard, expert
        useDynamicDifficulty: true, // NEW: Toggle for dynamic difficulty
        // Detailed tracking
        gamesWonBy: { // Track how games were won
            damage: 0,
            surrender: 0,
            deckout: 0
        },
        gamesLostBy: { // Track how games were lost
            damage: 0,
            surrender: 0,
            deckout: 0
        },
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalCardsPlayed: 0,
        totalManaSpent: 0,
        creaturesSummoned: 0,
        spellsCast: 0,
        averageGameLength: 0, // in turns
        quickestWin: 999,
        longestGame: 0,
        favoriteCards: {}, // Track most played cards
        difficultyHistory: [], // Track difficulty changes over time
        monthlyStats: {}, // Win/loss by month
        achievements: [] // Future: achievement system
    }
};

// Initialize player data from localStorage or create new
function initializePlayerData() {
    // In v3 mode, NEVER touch localStorage - data comes from server
    if (isV3Mode()) {
        console.log('[V3] Skipping localStorage init - using server data');
        return;
    }
    
    const saved = localStorage.getItem('playerData');
    if (saved) {
        const loadedData = JSON.parse(saved);
        // Update existing object properties instead of creating new object
        Object.assign(playerData, loadedData);
        
        // Ensure gameStats is properly merged
        if (loadedData.gameStats) {
            playerData.gameStats = {
                ...playerData.gameStats, // default gameStats
                ...loadedData.gameStats // loaded gameStats
            };
        }
    } else {
        // Give 30 starter cards for a full deck
        const starterCards = [
            // 15 commons (mixed creatures and spells)
            "Goblin Scout", "Goblin Scout", 
            "Fire Sprite", "Fire Sprite",
            "Shield Bearer", "Shield Bearer",
            "Forest Wolf", "Forest Wolf",
            "Apprentice Mage", "Apprentice Mage",
            "Skeleton Warrior", "Skeleton Warrior",
            "Peasant", "Peasant",
            "Squire",
            
            // 10 common spells
            "Arcane Missile", "Arcane Missile",
            "Healing Touch", "Healing Touch",
            "Frost Bolt", "Frost Bolt",
            "Battle Cry", "Battle Cry",
            "Minor Blessing", "Minor Blessing",
            
            // 5 rares to make it interesting
            "Mystic Owl",
            "Stone Golem",
            "Lightning Bolt",
            "Healing Potion",
            "Wind Dancer"
        ];
        
        starterCards.forEach(cardName => {
            if (!playerData.ownedCards[cardName]) {
                playerData.ownedCards[cardName] = 0;
            }
            playerData.ownedCards[cardName]++;
        });
        
        savePlayerData();
    }
}

// Save player data to localStorage
function savePlayerData() {
    // In v3 mode, prevent localStorage writes
    if (isV3Mode()) {
        console.log('[V3] Skipping localStorage save - data managed by server');
        return;
    }
    
    console.log('[STORAGE] savePlayerData called');
    console.log('[STORAGE] Saving data:', {
        gold: playerData.gold,
        gems: playerData.gems,
        totalGames: playerData.gameStats?.totalGames
    });
    try {
        localStorage.setItem('playerData', JSON.stringify(playerData));
        console.log('[STORAGE] Successfully saved to localStorage');
        
        // Verify the save by reading it back
        const saved = localStorage.getItem('playerData');
        const verified = JSON.parse(saved);
        console.log('[STORAGE] Verification - Gold in localStorage:', verified.gold);
    } catch (error) {
        console.error('[STORAGE] ERROR saving to localStorage:', error);
    }
}

// Add gold to player
function addGold(amount) {
    if (isV3Mode()) {
        console.warn('[V3] Cannot add gold client-side - must use server API');
        // In v3, gold is added via API responses, just update display value
        playerData.gold += amount;
        return;
    }
    
    console.log('[STORAGE] addGold called with amount:', amount);
    console.log('[STORAGE] Gold before add:', playerData.gold);
    playerData.gold += amount;
    console.log('[STORAGE] Gold after add:', playerData.gold);
    savePlayerData();
    console.log('[STORAGE] Data saved to localStorage');
}

// Add gems to player
function addGems(amount) {
    if (isV3Mode()) {
        console.warn('[V3] Cannot add gems client-side - must use server API');
        // In v3, gems are added via API responses, just update display value
        playerData.gems += amount;
        return;
    }
    
    console.log('[STORAGE] addGems called with amount:', amount);
    console.log('[STORAGE] Gems before add:', playerData.gems);
    playerData.gems += amount;
    console.log('[STORAGE] Gems after add:', playerData.gems);
    savePlayerData();
    console.log('[STORAGE] Data saved to localStorage');
}

// Spend gold (returns true if successful)
function spendGold(amount) {
    if (playerData.gold >= amount) {
        playerData.gold -= amount;
        savePlayerData();
        return true;
    }
    return false;
}

// Spend gems (returns true if successful)
function spendGems(amount) {
    if (playerData.gems >= amount) {
        playerData.gems -= amount;
        savePlayerData();
        return true;
    }
    return false;
}

// Add card to collection
function addCard(cardName) {
    const ALL_CARDS = window.ALL_CARDS || [];
    const card = ALL_CARDS.find(c => c.name === cardName);
    if (!card) return false;
    
    if (!playerData.ownedCards[cardName]) {
        playerData.ownedCards[cardName] = 0;
    }
    
    // v3.0: No card limits! Always add the card
    playerData.ownedCards[cardName]++;
    savePlayerData();
    return true;
}

// Check if player owns a card
function ownsCard(cardName, count = 1) {
    return (playerData.ownedCards[cardName] || 0) >= count;
}

// Get owned count of a card (with variant support for v3.0)
function getOwnedCount(cardName, variant = 'standard') {
    // v3.0: Use card instances with variant filtering
    if (isV3Mode() && playerData.cardInstances) {
        return Object.values(playerData.cardInstances).filter(instance => {
            // Instance structure: { name: 'Card Name', variant: 'standard' or 'Full Art' }
            return instance.name === cardName && instance.variant === variant;
        }).length;
    }
    
    // v2.1: Legacy - counts all variants together (no variants in v2.1)
    return playerData.ownedCards[cardName] || 0;
}

// Deck Management
function saveDecks(decks) {
    localStorage.setItem('savedDecks', JSON.stringify(decks));
}

function loadDecks() {
    const saved = localStorage.getItem('savedDecks');
    return saved ? JSON.parse(saved) : [];
}

function saveDeck(deckName, cards) {
    const decks = loadDecks();
    const existingIndex = decks.findIndex(d => d.name === deckName);
    
    const deckData = {
        name: deckName,
        cards: cards.map(c => ({
            name: c.name,
            cost: c.cost,
            type: c.type,
            attack: c.attack,
            health: c.health,
            ability: c.ability,
            emoji: c.emoji,
            rarity: c.rarity,
            color: c.color || 'colorless',
            variant: c.variant || 'standard',
            splashFriendly: c.splashFriendly || false,
            splashBonus: c.splashBonus || ''
        }))
    };
    
    if (existingIndex !== -1) {
        decks[existingIndex] = deckData;
    } else {
        decks.push(deckData);
    }
    
    saveDecks(decks);
}

function deleteDeck(index) {
    const decks = loadDecks();
    decks.splice(index, 1);
    saveDecks(decks);
}

// Daily Reward Management
async function claimDailyRewardV3() {
    try {
        const result = await window.apiClient.claimDailyReward();
        
        // Update local data from server response
        playerData.gold = result.newGold;
        playerData.gems = result.newGems;
        playerData.lastDailyReward = new Date().toISOString();
        
        return { success: true, goldReward: result.goldReward, gemsReward: result.gemsReward };
    } catch (error) {
        console.error('[V3] Failed to claim daily reward:', error);
        throw error;
    }
}

function canClaimDailyReward() {
    if (!playerData.lastDailyReward) return true;
    
    // Get current time in UTC-4 (EDT/EST)
    const now = new Date();
    const utcOffset = -4; // UTC-4
    const nowUTC4 = new Date(now.getTime() + (utcOffset * 60 * 60 * 1000));
    
    // Get last claim time in UTC-4
    const lastReward = new Date(playerData.lastDailyReward);
    const lastRewardUTC4 = new Date(lastReward.getTime() + (utcOffset * 60 * 60 * 1000));
    
    // Get midnight of today in UTC-4
    const todayMidnight = new Date(nowUTC4);
    todayMidnight.setHours(0, 0, 0, 0);
    
    // Get midnight of day when last reward was claimed
    const lastRewardMidnight = new Date(lastRewardUTC4);
    lastRewardMidnight.setHours(0, 0, 0, 0);
    
    // Can claim if we've crossed midnight since last claim
    return todayMidnight > lastRewardMidnight;
}

async function claimDailyReward() {
    // In v3 mode, use server API
    if (isV3Mode()) {
        return await claimDailyRewardV3();
    }
    
    // v2.1 mode - use localStorage
    if (canClaimDailyReward()) {
        playerData.gold += 100;
        playerData.gems += 1;
        playerData.lastDailyReward = new Date().toISOString();
        savePlayerData();
        return true;
    }
    return false;
}

function getTimeUntilDailyReward() {
    if (canClaimDailyReward()) return 0;
    
    // Get current time in UTC-4
    const now = new Date();
    const utcOffset = -4; // UTC-4
    const nowUTC4 = new Date(now.getTime() + (utcOffset * 60 * 60 * 1000));
    
    // Get next midnight in UTC-4
    const nextMidnight = new Date(nowUTC4);
    nextMidnight.setHours(24, 0, 0, 0); // Tomorrow at midnight
    
    // Convert back to local time
    const nextMidnightLocal = new Date(nextMidnight.getTime() - (utcOffset * 60 * 60 * 1000));
    
    // Calculate hours until next midnight
    return Math.ceil((nextMidnightLocal - now) / (60 * 60 * 1000));
}

// Store Management
function needsStoreRefresh() {
    const now = new Date();
    const lastRefresh = playerData.lastStoreRefresh ? new Date(playerData.lastStoreRefresh) : null;
    return !lastRefresh || (now - lastRefresh) > 6 * 60 * 60 * 1000;
}

function refreshStore() {
    const ALL_CARDS = window.ALL_CARDS || [];
    const now = new Date();
    playerData.lastStoreRefresh = now.toISOString();
    
    // Select 20 random cards for the store
    const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
    
    // Ensure variety: 8 common, 6 rare, 4 epic, 2 legendary
    const commonCards = shuffled.filter(c => c.rarity === 'common').slice(0, 8);
    const rareCards = shuffled.filter(c => c.rarity === 'rare').slice(0, 6);
    const epicCards = shuffled.filter(c => c.rarity === 'epic').slice(0, 4);
    const legendaryCards = shuffled.filter(c => c.rarity === 'legendary').slice(0, 2);
    
    playerData.currentStoreCards = [
        ...commonCards.map(c => c.name),
        ...rareCards.map(c => c.name),
        ...epicCards.map(c => c.name),
        ...legendaryCards.map(c => c.name)
    ];
    
    savePlayerData();
}

// Game Statistics Management
async function recordGameResultV3(playerWon, gameData) {
    // In v3 mode, send to server
    try {
        const result = await window.apiClient.completeGame(playerWon, gameData);
        
        // Update local stats from server
        playerData.gold = result.newGold;
        playerData.gems = result.newGems;
        
        console.log('[V3] Game result recorded on server');
        return result;
    } catch (error) {
        console.error('[V3] Failed to record game result:', error);
        throw error;
    }
}

function recordGameResult(playerWon, gameData = {}) {
    // In v3 mode, this is handled by the API
    if (isV3Mode()) {
        console.log('[V3] Game stats managed by server');
        return;
    }
    
    console.log('[STATS] recordGameResult called with:', { playerWon, gameData });
    
    // Prevent double-recording of the same game
    const gameId = `${Date.now()}_${gameData.turnCount}_${gameData.cardsPlayed}`;
    if (playerData.gameStats.lastRecordedGame === gameId) {
        console.log('[STATS] Duplicate game recording prevented for:', gameId);
        return;
    }
    playerData.gameStats.lastRecordedGame = gameId;
    
    const stats = playerData.gameStats;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    console.log('[STATS] Before update - totalGames:', stats.totalGames);
    stats.totalGames++;
    console.log('[STATS] After increment - totalGames:', stats.totalGames);
    
    // Initialize monthly stats if needed
    if (!stats.monthlyStats[currentMonth]) {
        stats.monthlyStats[currentMonth] = { wins: 0, losses: 0, games: 0 };
    }
    stats.monthlyStats[currentMonth].games++;
    
    if (playerWon) {
        stats.wins++;
        stats.winStreak++;
        stats.lossStreak = 0;
        stats.monthlyStats[currentMonth].wins++;
        
        // Track best win streak
        if (stats.winStreak > stats.bestWinStreak) {
            stats.bestWinStreak = stats.winStreak;
        }
        
        // Track win condition
        if (gameData.winBy) {
            stats.gamesWonBy[gameData.winBy] = (stats.gamesWonBy[gameData.winBy] || 0) + 1;
        } else {
            stats.gamesWonBy.damage++; // Default to damage
        }
        
        // Track quickest win
        if (gameData.turnCount && gameData.turnCount < stats.quickestWin) {
            stats.quickestWin = gameData.turnCount;
        }
        
    } else {
        stats.losses++;
        stats.lossStreak++;
        stats.winStreak = 0;
        stats.monthlyStats[currentMonth].losses++;
        
        // Track worst loss streak
        if (stats.lossStreak > stats.worstLossStreak) {
            stats.worstLossStreak = stats.lossStreak;
        }
        
        // Track loss condition
        if (gameData.lostBy) {
            stats.gamesLostBy[gameData.lostBy] = (stats.gamesLostBy[gameData.lostBy] || 0) + 1;
        } else {
            stats.gamesLostBy.damage++; // Default to damage
        }
    }
    
    // Track detailed game stats
    console.log('[STATS] Tracking detailed stats:', {
        damageDealt: gameData.damageDealt,
        damageTaken: gameData.damageTaken,
        cardsPlayed: gameData.cardsPlayed,
        manaSpent: gameData.manaSpent,
        turnCount: gameData.turnCount
    });
    
    if (gameData.damageDealt) {
        console.log(`[STATS] Adding ${gameData.damageDealt} to totalDamageDealt (was ${stats.totalDamageDealt})`);
        stats.totalDamageDealt += gameData.damageDealt;
    }
    if (gameData.damageTaken) {
        console.log(`[STATS] Adding ${gameData.damageTaken} to totalDamageTaken (was ${stats.totalDamageTaken})`);
        stats.totalDamageTaken += gameData.damageTaken;
    }
    if (gameData.cardsPlayed) {
        console.log(`[STATS] Adding ${gameData.cardsPlayed} to totalCardsPlayed (was ${stats.totalCardsPlayed})`);
        stats.totalCardsPlayed += gameData.cardsPlayed;
    }
    if (gameData.manaSpent) {
        console.log(`[STATS] Adding ${gameData.manaSpent} to totalManaSpent (was ${stats.totalManaSpent})`);
        stats.totalManaSpent += gameData.manaSpent;
    }
    if (gameData.creaturesSummoned) stats.creaturesSummoned += gameData.creaturesSummoned;
    if (gameData.spellsCast) stats.spellsCast += gameData.spellsCast;
    
    // Track game length
    if (gameData.turnCount) {
        console.log(`[STATS] Recording game length: ${gameData.turnCount} turns`);
        
        if (gameData.turnCount > stats.longestGame) {
            stats.longestGame = gameData.turnCount;
            console.log(`[STATS] New longest game: ${stats.longestGame}`);
        }
        
        // Update average game length
        const currentAvg = stats.averageGameLength || 0;
        const newAvg = ((currentAvg * (stats.totalGames - 1)) + gameData.turnCount) / stats.totalGames;
        stats.averageGameLength = Math.round(newAvg);
        
        console.log(`[STATS] Average game length: ${currentAvg} -> ${stats.averageGameLength} (added ${gameData.turnCount} turn game)`);
    } else {
        console.log('[STATS] Warning: No turnCount provided in gameData');
    }
    
    // Track favorite cards
    if (gameData.cardsUsed && Array.isArray(gameData.cardsUsed)) {
        gameData.cardsUsed.forEach(cardName => {
            stats.favoriteCards[cardName] = (stats.favoriteCards[cardName] || 0) + 1;
        });
    }
    
    // Track recent games (last 10)
    stats.recentGames.push(playerWon);
    if (stats.recentGames.length > 10) {
        stats.recentGames.shift();
    }
    
    // Update difficulty based on performance
    const previousDifficulty = stats.difficultyLevel;
    updateDifficultyLevel();
    
    // Track difficulty changes
    if (previousDifficulty !== stats.difficultyLevel) {
        stats.difficultyHistory.push({
            date: new Date().toISOString(),
            from: previousDifficulty,
            to: stats.difficultyLevel,
            reason: playerWon ? 'win_adjustment' : 'loss_adjustment'
        });
    }
    
    console.log('[STATS] Final stats after recording:', {
        totalGames: stats.totalGames,
        totalCardsPlayed: stats.totalCardsPlayed,
        totalManaSpent: stats.totalManaSpent,
        averageGameLength: stats.averageGameLength,
        longestGame: stats.longestGame,
        quickestWin: stats.quickestWin
    });
    
    savePlayerData();
}

function getWinRate() {
    const stats = playerData.gameStats;
    if (stats.totalGames === 0) return 0;
    return (stats.wins / stats.totalGames * 100).toFixed(1);
}

function getRecentWinRate() {
    const recent = playerData.gameStats.recentGames;
    if (recent.length === 0) return 0;
    const recentWins = recent.filter(win => win).length;
    return (recentWins / recent.length * 100).toFixed(1);
}

function calculateCollectionPower() {
    const ALL_CARDS = window.ALL_CARDS || [];
    const CARD_POWER = { common: 1, rare: 3, epic: 8, legendary: 20 };
    let totalPower = 0;
    
    for (const [cardName, count] of Object.entries(playerData.ownedCards)) {
        const card = ALL_CARDS.find(c => c.name === cardName);
        if (card) {
            totalPower += CARD_POWER[card.rarity] * count;
        }
    }
    
    playerData.gameStats.averageCollectionPower = totalPower;
    return totalPower;
}

function updateDifficultyLevel() {
    const stats = playerData.gameStats;
    const recentWinRate = parseFloat(getRecentWinRate());
    const overallWinRate = parseFloat(getWinRate());
    
    // Dynamic difficulty adjustment
    if (stats.totalGames < 3) {
        // New players start on beginner
        stats.difficultyLevel = 'beginner';
    } else if (stats.totalGames < 10) {
        // Early games - focus on recent performance
        if (recentWinRate >= 70) {
            stats.difficultyLevel = 'easy';
        } else if (recentWinRate >= 50) {
            stats.difficultyLevel = 'beginner';
        } else {
            stats.difficultyLevel = 'beginner'; // Keep it easy for new players
        }
    } else {
        // Established players - balance recent and overall
        const combinedRate = (recentWinRate * 0.7) + (overallWinRate * 0.3);
        
        if (stats.winStreak >= 5 || combinedRate >= 80) {
            stats.difficultyLevel = 'expert';
        } else if (stats.winStreak >= 3 || combinedRate >= 70) {
            stats.difficultyLevel = 'hard';
        } else if (combinedRate >= 60) {
            stats.difficultyLevel = 'normal';
        } else if (combinedRate >= 40) {
            stats.difficultyLevel = 'easy';
        } else {
            stats.difficultyLevel = 'beginner';
        }
        
        // Safety net: If losing too much, force easier difficulty
        if (stats.lossStreak >= 4) {
            stats.difficultyLevel = 'beginner';
        } else if (stats.lossStreak >= 2 && stats.difficultyLevel !== 'beginner') {
            const levels = ['beginner', 'easy', 'normal', 'hard', 'expert'];
            const currentIndex = levels.indexOf(stats.difficultyLevel);
            if (currentIndex > 0) {
                stats.difficultyLevel = levels[currentIndex - 1];
            }
        }
    }
    
    console.log(`[DIFFICULTY] Updated to ${stats.difficultyLevel} - Recent: ${recentWinRate}%, Overall: ${overallWinRate}%, Streak: ${stats.winStreak}W/${stats.lossStreak}L`);
}

function getDifficultySettings() {
    // Check if dynamic difficulty is enabled
    if (!playerData.gameStats.useDynamicDifficulty) {
        // Return classic difficulty settings (balanced, fair play)
        console.log('[DIFFICULTY] Using Classic Mode - AI has same mana growth as player');
        return {
            aiManaPerTurn: 1,
            aiMaxMana: 10,
            rarityBias: 0.3,
            faceTargetChance: 0.5,
            playStyle: 'balanced',
            cardPlayLimit: 3,
            healthBonus: 0,
            turnDelay: 1
        };
    }
    
    const level = playerData.gameStats.difficultyLevel;
    
    const settings = {
        beginner: {
            aiManaPerTurn: 1,       // Same mana growth as player
            aiMaxMana: 10,
            rarityBias: 0.05,       // Only 5% rare+ cards (mostly commons)
            faceTargetChance: 0.2,  // 20% face damage (focuses on trades)
            playStyle: 'defensive',
            cardPlayLimit: 1,       // Max 1 card per turn (very slow)
            healthBonus: -5,        // AI starts with 25 health vs your 30
            turnDelay: 1            // AI gets mana every turn (no delay)
        },
        easy: {
            aiManaPerTurn: 1,       // Same mana growth as player  
            aiMaxMana: 10,
            rarityBias: 0.15,       // 15% rare+ cards
            faceTargetChance: 0.3,  // 30% face damage
            playStyle: 'defensive',
            cardPlayLimit: 2,       // Max 2 cards per turn
            healthBonus: 0,         // Same health (30)
            turnDelay: 1            // AI gets mana every turn
        },
        normal: {
            aiManaPerTurn: 1,       // Same mana growth as player
            aiMaxMana: 12,          // But higher max mana
            rarityBias: 0.3,
            faceTargetChance: 0.4,
            playStyle: 'balanced',
            cardPlayLimit: 3,
            healthBonus: 0,
            turnDelay: 1,
            manaBoostTurn: 4        // After turn 4, AI gets +1 extra mana per turn
        },
        hard: {
            aiManaPerTurn: 1,       // Same growth, but...
            aiMaxMana: 14,
            rarityBias: 0.5,
            faceTargetChance: 0.6,
            playStyle: 'balanced',
            cardPlayLimit: 4,
            healthBonus: 5,
            turnDelay: 1,
            manaBoostTurn: 2,       // After turn 2, AI gets +1 extra per turn
            startingManaBonus: 1    // AI starts with 1 extra mana
        },
        expert: {
            aiManaPerTurn: 2,       // AI gets 2 mana per turn (the old problem!)
            aiMaxMana: 15,
            rarityBias: 0.8,
            faceTargetChance: 0.8,
            playStyle: 'aggressive',
            cardPlayLimit: 6,
            healthBonus: 15,
            turnDelay: 1,
            startingManaBonus: 2    // AI starts with 2 extra mana
        }
    };
    
    return settings[level] || settings.normal;
}

function getAdvancedStats() {
    // Ensure gameStats exists with proper fallbacks
    const stats = playerData.gameStats || {};
    
    console.log('[STATS] Raw gameStats from storage:', stats);
    
    // Initialize any missing properties with defaults
    const safeStats = {
        totalGames: stats.totalGames || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        winStreak: stats.winStreak || 0,
        lossStreak: stats.lossStreak || 0,
        bestWinStreak: stats.bestWinStreak || 0,
        worstLossStreak: stats.worstLossStreak || 0,
        averageGameLength: stats.averageGameLength || 0,
        quickestWin: stats.quickestWin === undefined ? 999 : stats.quickestWin,
        longestGame: stats.longestGame || 0,
        totalDamageDealt: stats.totalDamageDealt || 0,
        totalDamageTaken: stats.totalDamageTaken || 0,
        totalCardsPlayed: stats.totalCardsPlayed || 0,
        totalManaSpent: stats.totalManaSpent || 0,
        creaturesSummoned: stats.creaturesSummoned || 0,
        spellsCast: stats.spellsCast || 0,
        gamesWonBy: stats.gamesWonBy || { damage: 0, surrender: 0, deckout: 0 },
        gamesLostBy: stats.gamesLostBy || { damage: 0, surrender: 0, deckout: 0 },
        favoriteCards: stats.favoriteCards || {},
        difficultyLevel: stats.difficultyLevel || 'beginner',
        difficultyHistory: stats.difficultyHistory || [],
        monthlyStats: stats.monthlyStats || {}
    };
    
    console.log('[STATS] Processed safeStats:', {
        totalGames: safeStats.totalGames,
        averageGameLength: safeStats.averageGameLength,
        quickestWin: safeStats.quickestWin,
        longestGame: safeStats.longestGame
    });
    
    return {
        // Basic stats
        totalGames: safeStats.totalGames,
        wins: safeStats.wins,
        losses: safeStats.losses,
        winRate: safeStats.totalGames > 0 ? ((safeStats.wins / safeStats.totalGames) * 100).toFixed(1) : '0.0',
        recentWinRate: getRecentWinRate(),
        
        // Streaks
        currentWinStreak: safeStats.winStreak,
        currentLossStreak: safeStats.lossStreak,
        bestWinStreak: safeStats.bestWinStreak,
        worstLossStreak: safeStats.worstLossStreak,
        
        // Game performance
        averageGameLength: safeStats.averageGameLength,
        quickestWin: safeStats.quickestWin === 999 ? 'N/A' : safeStats.quickestWin,
        longestGame: safeStats.longestGame,
        
        // Combat stats
        totalDamageDealt: safeStats.totalDamageDealt,
        totalDamageTaken: safeStats.totalDamageTaken,
        damageRatio: safeStats.totalDamageTaken > 0 ? 
            (safeStats.totalDamageDealt / safeStats.totalDamageTaken).toFixed(2) : 'N/A',
        
        // Card usage
        totalCardsPlayed: safeStats.totalCardsPlayed,
        totalManaSpent: safeStats.totalManaSpent,
        creaturesSummoned: safeStats.creaturesSummoned,
        spellsCast: safeStats.spellsCast,
        averageCardsPerGame: safeStats.totalGames > 0 ? 
            Math.round(safeStats.totalCardsPlayed / safeStats.totalGames) : 0,
        averageManaPerGame: safeStats.totalGames > 0 ? 
            Math.round(safeStats.totalManaSpent / safeStats.totalGames) : 0,
        
        // Win/loss conditions
        winsBy: {
            damage: safeStats.gamesWonBy.damage || 0,
            surrender: safeStats.gamesWonBy.surrender || 0,
            deckout: safeStats.gamesWonBy.deckout || 0
        },
        lossesBy: {
            damage: safeStats.gamesLostBy.damage || 0,
            surrender: safeStats.gamesLostBy.surrender || 0,
            deckout: safeStats.gamesLostBy.deckout || 0
        },
        
        // Favorite cards (top 5)
        favoriteCards: Object.entries(safeStats.favoriteCards)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count })),
        
        // Difficulty progression
        currentDifficulty: safeStats.difficultyLevel,
        difficultyChanges: safeStats.difficultyHistory.length,
        
        // Monthly performance (last 6 months)
        monthlyPerformance: Object.entries(safeStats.monthlyStats)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([month, data]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                wins: data.wins || 0,
                losses: data.losses || 0,
                winRate: (data.games || 0) > 0 ? Math.round(((data.wins || 0) / (data.games || 1)) * 100) : 0
            }))
    };
}

function resetGameStatistics() {
    console.log('[STATS] Resetting all game statistics');
    
    // In v3 mode, call server API
    if (isV3Mode()) {
        console.log('[V3] Calling server to reset statistics...');
        window.apiClient.resetStats()
            .then(result => {
                console.log('[V3] Server stats reset:', result);
                
                // Also clear local memory
                playerData.gameStats = {
                    totalGames: 0,
                    wins: 0,
                    losses: 0,
                    winStreak: 0,
                    lossStreak: 0,
                    bestWinStreak: 0,
                    worstLossStreak: 0,
                    recentGames: [],
                    averageCollectionPower: 0,
                    difficultyLevel: 'beginner',
                    useDynamicDifficulty: true,
                    gamesWonBy: { damage: 0, surrender: 0, deckout: 0 },
                    gamesLostBy: { damage: 0, surrender: 0, deckout: 0 },
                    totalDamageDealt: 0,
                    totalDamageTaken: 0,
                    totalCardsPlayed: 0,
                    totalManaSpent: 0,
                    creaturesSummoned: 0,
                    spellsCast: 0,
                    averageGameLength: 0,
                    quickestWin: 999,
                    longestGame: 0,
                    favoriteCards: {},
                    difficultyHistory: [],
                    monthlyStats: {},
                    achievements: []
                };
                
                console.log('[V3] Local stats cleared');
            })
            .catch(error => {
                console.error('[V3] Failed to reset stats on server:', error);
                alert('Failed to reset statistics on server');
            });
        return; // Don't save to localStorage
    }
    
    // Local mode - use localStorage
    playerData.gameStats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        lossStreak: 0,
        bestWinStreak: 0,
        worstLossStreak: 0,
        recentGames: [],
        averageCollectionPower: 0,
        difficultyLevel: 'beginner',
        useDynamicDifficulty: true,
        gamesWonBy: { damage: 0, surrender: 0, deckout: 0 },
        gamesLostBy: { damage: 0, surrender: 0, deckout: 0 },
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalCardsPlayed: 0,
        totalManaSpent: 0,
        creaturesSummoned: 0,
        spellsCast: 0,
        averageGameLength: 0,
        quickestWin: 999,
        longestGame: 0,
        favoriteCards: {},
        difficultyHistory: [],
        monthlyStats: {},
        achievements: []
    };
    
    savePlayerData();
    console.log('[STATS] Statistics reset complete');
}

function toggleDynamicDifficulty() {
    playerData.gameStats.useDynamicDifficulty = !playerData.gameStats.useDynamicDifficulty;
    const status = playerData.gameStats.useDynamicDifficulty ? 'ENABLED' : 'DISABLED';
    console.log(`[DIFFICULTY] Dynamic Difficulty ${status}`);
    savePlayerData();
    return playerData.gameStats.useDynamicDifficulty;
}

function isDynamicDifficultyEnabled() {
    return playerData.gameStats.useDynamicDifficulty !== false; // Default to true if not set
}

function getTimeUntilStoreRefresh() {
    if (!playerData.lastStoreRefresh) {
        return 0; // No refresh time set, needs refresh now
    }
    
    const now = new Date();
    const lastRefresh = new Date(playerData.lastStoreRefresh);
    
    // Check if date is valid
    if (isNaN(lastRefresh.getTime())) {
        console.warn('[Storage] Invalid lastStoreRefresh date, resetting');
        playerData.lastStoreRefresh = null;
        return 0;
    }
    
    const nextRefresh = new Date(lastRefresh.getTime() + 6 * 60 * 60 * 1000);
    const hoursUntil = Math.ceil((nextRefresh - now) / (60 * 60 * 1000));
    
    // If negative, refresh is overdue
    return Math.max(0, hoursUntil);
}

// Set player data from server (v3.0.0)
function setPlayerDataFromServer(serverData) {
    console.log('[V3] Loading player data from server:', serverData);
    playerData.gold = serverData.gold;
    playerData.gems = serverData.gems;
    playerData.ownedCards = serverData.ownedCards;
    playerData.cardInstances = serverData.cardInstances || {};  // NEW: Store card instances
    playerData.lastDailyReward = serverData.lastDailyReward;
    
    // Only update store rotation if server provides valid data
    // Don't overwrite existing rotation with empty data
    if (serverData.currentStoreCards && serverData.currentStoreCards.length > 0) {
        playerData.currentStoreCards = serverData.currentStoreCards;
        playerData.lastStoreRefresh = serverData.lastStoreRefresh;
    } else if (!playerData.currentStoreCards || playerData.currentStoreCards.length === 0) {
        // Only set empty if we also have empty (initialize)
        playerData.currentStoreCards = serverData.currentStoreCards || [];
        playerData.lastStoreRefresh = serverData.lastStoreRefresh || null;
    }
    // Otherwise preserve existing rotation
    
    if (serverData.gameStats) {
        playerData.gameStats = {
            ...playerData.gameStats,
            ...serverData.gameStats
        };
    }
    console.log('[V3] Player data loaded from server successfully');
    console.log('[V3] Card instances loaded:', Object.keys(playerData.cardInstances).length);
    console.log('[V3] Store cards preserved:', playerData.currentStoreCards.length);
}

// Make all storage functions globally available
window.storage = {
    playerData,
    initializePlayerData,
    savePlayerData,
    addGold,
    addGems,
    spendGold,
    spendGems,
    addCard,
    ownsCard,
    getOwnedCount,
    saveDecks,
    loadDecks,
    saveDeck,
    deleteDeck,
    canClaimDailyReward,
    claimDailyReward,
    claimDailyRewardV3,
    getTimeUntilDailyReward,
    needsStoreRefresh,
    refreshStore,
    getTimeUntilStoreRefresh,
    recordGameResult,
    recordGameResultV3,
    getWinRate,
    getRecentWinRate,
    calculateCollectionPower,
    getDifficultySettings,
    getAdvancedStats,
    resetGameStatistics,
    toggleDynamicDifficulty,
    isDynamicDifficultyEnabled,
    setPlayerDataFromServer
};

// Make playerData directly accessible for backwards compatibility
window.playerData = playerData;
