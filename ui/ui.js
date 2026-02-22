// UI Module - Handles all user interface interactions
// Functions will access global window objects instead of imports

// Update currency display in all locations
function updateCurrencyDisplay() {
    const playerData = window.storage ? window.storage.playerData : { gold: 0, gems: 0 };
    document.getElementById('goldAmount').textContent = playerData.gold;
    document.getElementById('gemAmount').textContent = playerData.gems;
    
    const storeGold = document.getElementById('storeGoldAmount');
    const storeGem = document.getElementById('storeGemAmount');
    if (storeGold) storeGold.textContent = playerData.gold;
    if (storeGem) storeGem.textContent = playerData.gems;
}

// Check and update daily reward button state
function checkDailyReward() {
    const dailyRewardBtn = document.getElementById('dailyReward');
    const hoursLeft = window.storage ? window.storage.getTimeUntilDailyReward() : 24;
    
    if (hoursLeft === 0) {
        dailyRewardBtn.classList.remove('claimed');
        dailyRewardBtn.textContent = '🎁 Daily Reward';
        dailyRewardBtn.title = 'Click to claim your daily reward!';
    } else {
        dailyRewardBtn.classList.add('claimed');
        dailyRewardBtn.textContent = `🕒 ${hoursLeft}h until reward`;
        dailyRewardBtn.title = `Daily reward available in ${hoursLeft} hours`;
    }
}

// Claim daily reward
async function claimDailyReward() {
    const hoursLeft = window.storage ? window.storage.getTimeUntilDailyReward() : 24;
    
    if (hoursLeft > 0) {
        // Show custom HTML modal instead of alert()
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">🕒</div>
                <h2 style="color: #667eea; margin-bottom: 20px;">Daily Reward Not Ready</h2>
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 1.1em;">
                    Daily reward available in <strong>${hoursLeft} hours</strong>!
                </p>
                <button id="rewardNoticeBtn" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                ">OK</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('rewardNoticeBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    if (window.storage) {
        try {
            const result = await window.storage.claimDailyReward();
            
            if (result && result.success) {
                updateCurrencyDisplay();
                checkDailyReward();
                showNotification(`Daily Reward Claimed! +${result.goldReward} Gold 🪙 +${result.gemsReward} Gem 💎`, 'success');
            } else {
                // Show custom HTML modal instead of alert()
                const modal = document.createElement('div');
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                `;
                
                modal.innerHTML = `
                    <div style="
                        background: white;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                        max-width: 400px;
                        width: 90%;
                        color: #333;
                        text-align: center;
                    ">
                        <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                        <h2 style="color: #f44336; margin-bottom: 20px;">Claim Failed</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            Could not claim daily reward. Please try again.
                        </p>
                        <button id="rewardFailBtn" style="
                            padding: 12px 40px;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            border: none;
                            border-radius: 10px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 1em;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                        ">OK</button>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                document.getElementById('rewardFailBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
            }
        } catch (error) {
            console.error('[UI] Failed to claim daily reward:', error);
            
            // Show custom HTML modal instead of alert()
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            
            modal.innerHTML = `
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    max-width: 400px;
                    width: 90%;
                    color: #333;
                    text-align: center;
                ">
                    <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                    <h2 style="color: #f44336; margin-bottom: 20px;">Error</h2>
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        ${error.message || 'Could not claim daily reward. Please try again.'}
                    </p>
                    <button id="rewardErrorBtn" style="
                        padding: 12px 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    ">OK</button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('rewardErrorBtn').onclick = () => {
                document.body.removeChild(modal);
            };
        }
    }
}

// Show main menu
function showMainMenu() {
    // Hide all containers
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('deckbuilder').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('storeContainer').style.display = 'none';
    document.getElementById('collectionContainer').style.display = 'none';
    document.getElementById('savedDecks').style.display = 'none';
    document.getElementById('multiplayerSection').style.display = 'none';
    document.getElementById('winnerScreen').style.display = 'none';
    document.getElementById('gameLog').style.display = 'none';
    document.getElementById('gameLog').innerHTML = '';
    
    // Show main menu buttons
    document.querySelector('.menu-buttons').style.display = 'flex';
    
    updateCurrencyDisplay();
    checkDailyReward(); // Make sure daily reward state is updated
}

// Show multiplayer section
function showMultiplayer() {
    // Hide main menu buttons, show multiplayer section
    document.querySelector('.menu-buttons').style.display = 'none';
    document.getElementById('savedDecks').style.display = 'none';
    document.getElementById('multiplayerSection').style.display = 'block';
}

// Show card ability information tooltip
function showCardInfo(event, card) {
    event.stopPropagation();
    
    // Remove any existing tooltips
    const existingTooltip = document.querySelector('.ability-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'ability-tooltip show';
    
    const rarityColors = {
        'common': '#888',
        'rare': '#00c9ff',
        'epic': '#8e2de2',
        'legendary': '#ffd700'
    };
    
    // Get ability description - prioritize ABILITY_DESCRIPTIONS, fall back to showing the ability text itself
    let abilityDescription = '';
    if (card.ability) {
        if (window.ABILITY_DESCRIPTIONS && window.ABILITY_DESCRIPTIONS[card.ability]) {
            abilityDescription = window.ABILITY_DESCRIPTIONS[card.ability];
        } else {
            // If no description exists, show the ability text as the description
            // This prevents "A basic card with no special effects" for cards that DO have effects
            abilityDescription = card.ability;
        }
    } else {
        abilityDescription = 'A basic card with no special effects.';
    }
    
    // Add splash bonus info if present
    if (card.splashFriendly && card.splashBonus) {
        abilityDescription += '<br><br><span style="color: #ffd700;">💫 Splash Bonus:</span> ' + card.splashBonus;
    }
    
    tooltip.innerHTML = `
        <h4>${card.emoji} ${card.name}</h4>
        <p><span class="ability-name">Cost:</span> ${card.cost} mana</p>
        ${card.type === 'creature' ? 
            `<p><span class="ability-name">Stats:</span> ${card.attack} Attack / ${card.health} Health</p>` : 
            `<p><span class="ability-name">Type:</span> Spell</p>`
        }
        ${card.color ? `<p><span class="ability-name">Color:</span> ${card.color.charAt(0).toUpperCase() + card.color.slice(1)}</p>` : ''}
        <p><span class="ability-name">Ability:</span> ${card.ability || 'None'}</p>
        <p>${abilityDescription}</p>
        <div class="rarity-info" style="color: ${rarityColors[card.rarity]}">
            <strong>${card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}</strong>
            ${card.rarity === 'legendary' ? ' (Max 1 copy)' : ' (Max 2 copies)'}
        </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.right + 10 + 'px';
    tooltip.style.top = rect.top + 'px';
    
    // Adjust if tooltip goes off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (rect.left - tooltipRect.width - 10) + 'px';
    }
    if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = (window.innerHeight - tooltipRect.height - 10) + 'px';
    }
    
    // Remove tooltip when clicking elsewhere
    setTimeout(() => {
        document.addEventListener('click', function removeTooltip() {
            tooltip.remove();
            document.removeEventListener('click', removeTooltip);
        }, { once: true });
    }, 100);
}

// Show detailed game statistics
function showGameStatistics() {
    const stats = window.storage ? window.storage.getAdvancedStats() : {};
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
        overflow-y: auto;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'statistics-modal';
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #232526, #414345);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 20px;
        padding: 30px;
        max-width: 900px;
        max-height: 90vh;
        overflow-y: auto;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h2 style="margin: 0; color: #00bcd4; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);">📊 Game Statistics</h2>
            <div style="display: flex; gap: 10px;">
                <button onclick="window.confirmResetStats()" style="background: #ff9800; border: none; color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: bold;">🔄 Reset Stats</button>
                <button onclick="this.closest('.modal-overlay').remove()" style="background: #f44336; border: none; color: white; padding: 8px 15px; border-radius: 20px; cursor: pointer; font-weight: bold;">✕ Close</button>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            
            <!-- Basic Performance -->
            <div class="stat-card">
                <h3>🎯 Performance Overview</h3>
                <div class="stat-row"><span>Total Games:</span> <strong>${stats.totalGames}</strong></div>
                <div class="stat-row"><span>Wins:</span> <strong style="color: #4CAF50;">${stats.wins}</strong></div>
                <div class="stat-row"><span>Losses:</span> <strong style="color: #f44336;">${stats.losses}</strong></div>
                <div class="stat-row"><span>Win Rate:</span> <strong style="color: ${stats.winRate >= 50 ? '#4CAF50' : '#ff9800'};">${stats.winRate}%</strong></div>
                <div class="stat-row"><span>Recent Win Rate:</span> <strong style="color: ${stats.recentWinRate >= 50 ? '#4CAF50' : '#ff9800'};">${stats.recentWinRate}%</strong></div>
                <div class="stat-row"><span>Current Difficulty:</span> <span class="difficulty-badge-big ${stats.currentDifficulty}">${stats.currentDifficulty.toUpperCase()}</span></div>
            </div>
            
            <!-- Streaks -->
            <div class="stat-card">
                <h3>🔥 Streaks & Records</h3>
                <div class="stat-row"><span>Current Win Streak:</span> <strong style="color: #4CAF50;">${stats.currentWinStreak}</strong></div>
                <div class="stat-row"><span>Current Loss Streak:</span> <strong style="color: #f44336;">${stats.currentLossStreak}</strong></div>
                <div class="stat-row"><span>Best Win Streak:</span> <strong style="color: #ffd700;">${stats.bestWinStreak}</strong></div>
                <div class="stat-row"><span>Worst Loss Streak:</span> <strong style="color: #ff5722;">${stats.worstLossStreak}</strong></div>
                <div class="stat-row"><span>Quickest Victory:</span> <strong style="color: #00bcd4;">${stats.quickestWin} turns</strong></div>
                <div class="stat-row"><span>Longest Game:</span> <strong>${stats.longestGame} turns</strong></div>
            </div>
            
            <!-- Game Performance -->
            <div class="stat-card">
                <h3>⚡ Game Performance</h3>
                <div class="stat-row"><span>Avg Game Length:</span> <strong>${stats.averageGameLength} turns</strong></div>
                <div class="stat-row"><span>Total Damage Dealt:</span> <strong style="color: #f44336;">${stats.totalDamageDealt.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Total Damage Taken:</span> <strong style="color: #ff9800;">${stats.totalDamageTaken.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Damage Ratio:</span> <strong style="color: ${stats.damageRatio > 1 ? '#4CAF50' : '#ff9800'};">${stats.damageRatio}</strong></div>
                <div class="stat-row"><span>Difficulty Changes:</span> <strong>${stats.difficultyChanges}</strong></div>
            </div>
            
            <!-- Card Usage -->
            <div class="stat-card">
                <h3>🃏 Card Usage</h3>
                <div class="stat-row"><span>Total Cards Played:</span> <strong>${stats.totalCardsPlayed.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Total Mana Spent:</span> <strong style="color: #00bcd4;">${stats.totalManaSpent.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Creatures Summoned:</span> <strong style="color: #c31432;">${stats.creaturesSummoned.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Spells Cast:</span> <strong style="color: #2c5364;">${stats.spellsCast.toLocaleString()}</strong></div>
                <div class="stat-row"><span>Avg Cards/Game:</span> <strong>${stats.averageCardsPerGame}</strong></div>
                <div class="stat-row"><span>Avg Mana/Game:</span> <strong>${stats.averageManaPerGame}</strong></div>
            </div>
            
            <!-- Win/Loss Breakdown -->
            <div class="stat-card">
                <h3>🏆 Victory Conditions</h3>
                <div style="margin-bottom: 15px;">
                    <strong style="color: #4CAF50;">Wins By:</strong>
                    <div class="stat-row small"><span>• Damage:</span> <strong>${stats.winsBy.damage}</strong></div>
                    <div class="stat-row small"><span>• Surrender:</span> <strong>${stats.winsBy.surrender}</strong></div>
                    <div class="stat-row small"><span>• Deck Out:</span> <strong>${stats.winsBy.deckout}</strong></div>
                </div>
                <div>
                    <strong style="color: #f44336;">Losses By:</strong>
                    <div class="stat-row small"><span>• Damage:</span> <strong>${stats.lossesBy.damage}</strong></div>
                    <div class="stat-row small"><span>• Surrender:</span> <strong>${stats.lossesBy.surrender}</strong></div>
                    <div class="stat-row small"><span>• Deck Out:</span> <strong>${stats.lossesBy.deckout}</strong></div>
                </div>
            </div>
            
            <!-- Favorite Cards -->
            <div class="stat-card">
                <h3>💖 Most Played Cards</h3>
                ${stats.favoriteCards.length > 0 ? 
                    stats.favoriteCards.map((card, index) => 
                        `<div class="stat-row"><span>${index + 1}. ${card.name}:</span> <strong>${card.count}x</strong></div>`
                    ).join('') : 
                    '<div style="color: rgba(255, 255, 255, 0.6); font-style: italic;">No data yet - play some games!</div>'
                }
            </div>
        </div>
        
        ${stats.monthlyPerformance.length > 0 ? `
            <div class="stat-card" style="margin-top: 20px;">
                <h3>📈 Monthly Performance</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 15px;">
                    ${stats.monthlyPerformance.map(month => `
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 10px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 12px; opacity: 0.8;">${month.month}</div>
                            <div style="color: #4CAF50; font-weight: bold;">${month.wins}W</div>
                            <div style="color: #f44336; font-weight: bold;">${month.losses}L</div>
                            <div style="color: ${month.winRate >= 50 ? '#4CAF50' : '#ff9800'}; font-size: 12px;">${month.winRate}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Make reset function available globally for the button
    window.resetStats = function() {
        if (window.storage) window.storage.resetGameStatistics();
        modal.remove();
        showNotification('Statistics reset successfully!', 'success');
    };
    
    // Make confirm reset function available globally
    window.confirmResetStats = function() {
        // Create custom HTML confirm modal instead of native confirm()
        const confirmModal = document.createElement('div');
        confirmModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        confirmModal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                <h2 style="color: #ff9800; margin-bottom: 20px;">Reset All Statistics?</h2>
                <p style="margin-bottom: 25px; line-height: 1.6; font-weight: bold; color: #f44336;">
                    This cannot be undone!
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="resetCancelBtn" style="
                        padding: 12px 30px;
                        background: #6c757d;
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                    ">Cancel</button>
                    <button id="resetConfirmBtn" style="
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
                    ">Reset Stats</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        document.getElementById('resetCancelBtn').onclick = () => {
            document.body.removeChild(confirmModal);
        };
        
        document.getElementById('resetConfirmBtn').onclick = () => {
            document.body.removeChild(confirmModal);
            window.resetStats();
        };
    };
    
    // Add styles for the modal
    if (!document.getElementById('stats-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'stats-modal-styles';
        styles.textContent = `
            .stat-card {
                background: rgba(255, 255, 255, 0.08);
                border-radius: 15px;
                padding: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .stat-card h3 {
                margin: 0 0 15px 0;
                color: #00bcd4;
                font-size: 16px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }
            .stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px 0;
                font-size: 14px;
            }
            .stat-row.small {
                font-size: 12px;
                padding: 3px 0;
                padding-left: 10px;
            }
            .stat-row span:first-child {
                color: rgba(255, 255, 255, 0.8);
            }
            .difficulty-badge-big {
                padding: 4px 12px;
                border-radius: 15px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .difficulty-badge-big.beginner { background-color: #4CAF50; }
            .difficulty-badge-big.easy { background-color: #8BC34A; }
            .difficulty-badge-big.normal { background-color: #FFC107; color: black; }
            .difficulty-badge-big.hard { background-color: #FF9800; }
            .difficulty-badge-big.expert { background-color: #F44336; }
        `;
        document.head.appendChild(styles);
    }
}
function showGameHelp() {
    const existingTooltip = document.querySelector('.ability-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const helpModal = document.createElement('div');
    helpModal.className = 'ability-tooltip show';
    helpModal.style.maxWidth = '400px';
    helpModal.style.left = '50%';
    helpModal.style.top = '50%';
    helpModal.style.transform = 'translate(-50%, -50%)';
    
    helpModal.innerHTML = `
        <h4>🎮 How to Play Mystic Duel</h4>
        
        <p><span class="ability-name">Objective:</span> Reduce your opponent's health from 30 to 0.</p>
        
        <p><span class="ability-name">Getting Started:</span></p>
        <ul style="margin-left: 20px; font-size: 12px;">
            <li>You start with 30 cards to build your first deck</li>
            <li>Collect more cards from the store</li>
            <li>AI difficulty adapts to your deck power</li>
        </ul>
        
        <p><span class="ability-name">Earning Currency:</span></p>
        <ul style="margin-left: 20px; font-size: 12px;">
            <li>Win games: +50-100 Gold</li>
            <li>Daily reward: +100 Gold, +1 Gem</li>
            <li>Duplicate cards: Convert to Gold</li>
        </ul>
        
        <p><span class="ability-name">Card Store:</span></p>
        <ul style="margin-left: 20px; font-size: 12px;">
            <li>Singles refresh every 6 hours (20 cards)</li>
            <li>Packs always available</li>
            <li>Use Gold for basic items, Gems for premium</li>
        </ul>
        
        <p><span class="ability-name">Each Turn:</span></p>
        <ul style="margin-left: 20px; font-size: 12px;">
            <li>Draw a card</li>
            <li>Gain +1 maximum mana (up to 10)</li>
            <li>Play cards by spending mana</li>
            <li>Attack with creatures</li>
        </ul>
        
        <button onclick="this.parentElement.remove()" style="margin-top: 15px; width: 100%;">Close</button>
    `;
    
    document.body.appendChild(helpModal);
}

function toggleDifficultyMode() {
    if (!window.storage) return;
    
    const isEnabled = window.storage.toggleDynamicDifficulty();
    const button = document.getElementById('difficultyToggleBtn');
    
    if (button) {
        if (isEnabled) {
            button.textContent = '⚙️ Dynamic Difficulty: ON';
            button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        } else {
            button.textContent = '⚙️ Classic Difficulty';
            button.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
        }
    }
    
    const mode = isEnabled ? 'Dynamic' : 'Classic';
    const description = isEnabled ? 
        'AI difficulty will adjust based on your performance' : 
        'AI will have balanced mana growth and targeting (no scaling)';
    
    showNotification(`${mode} Difficulty Mode enabled! ${description}`, 'success', 4000);
}

// Create a card element for display
function createCardElement(card, isPlayerCard = true, onField = false, clickHandler = null) {
    const cardEl = document.createElement('div');
    let classes = `card ${card.type} ${card.rarity}`;
    if (card.fullArt) classes += ' full-art';
    cardEl.className = classes;
    cardEl.setAttribute('data-color', card.color || 'colorless');
    
    // Add additional classes based on card state
    if (card.unowned) cardEl.classList.add('unowned');
    if (card.playable) cardEl.classList.add('playable');
    if (card.selected) cardEl.classList.add('selected');
    if (card.tapped) cardEl.classList.add('tapped');
    
    // Add special visual effects for card states
    if (card.frozen) {
        cardEl.style.filter = 'hue-rotate(180deg)';
    }
    if (card.immune || card.tempImmune) {
        cardEl.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.8)';
    }
    if (card.stealth) {
        cardEl.style.opacity = '0.7';
    }
    
    cardEl.innerHTML = `
        <div class="card-info-btn" onclick="showCardInfo(event, ${JSON.stringify(card).replace(/"/g, '&quot;')})">i</div>
        <div class="card-cost">${card.cost}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-image">${card.emoji}</div>
        ${card.type === 'creature' ? `
            <div class="card-description">${card.ability || 'No ability'}</div>
            <div class="card-stats">
                <span class="attack-stat">⚔️ ${card.attack}</span>
                <span class="health-stat">❤️ ${card.health}</span>
            </div>
        ` : `<div class="card-description">${card.ability}</div>`}
        ${card.divineShield ? '<div class="divine-shield-indicator">🛡️</div>' : ''}
    `;
    
    // Add click handler if provided
    if (clickHandler) {
        cardEl.onclick = (e) => {
            if (!e.target.classList.contains('card-info-btn')) {
                clickHandler(card, isPlayerCard);
            }
        };
    }
    
    return cardEl;
}

// Show a modal dialog
function showModal(title, content, buttons = []) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #667eea, #764ba2);
        padding: 30px;
        border-radius: 20px;
        max-width: 500px;
        text-align: center;
        color: white;
    `;
    
    modalContent.innerHTML = `
        <h2>${title}</h2>
        <div style="margin: 20px 0;">${content}</div>
        <div class="modal-buttons" style="display: flex; gap: 10px; justify-content: center;">
            ${buttons.map(btn => `<button onclick="${btn.onclick}">${btn.text}</button>`).join('')}
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    return modal;
}

// Remove a modal
function removeModal(modal) {
    if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
    }
}

// Show a notification
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// Animate a value change (for gold/health displays)
function animateValue(element, start, end, duration = 500) {
    const startTime = performance.now();
    const difference = end - start;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const value = Math.floor(start + difference * progress);
        element.textContent = value;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Create floating damage/heal text
function createFloatingText(text, x, y, color = '#ff4444') {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: 24px;
        font-weight: bold;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        z-index: 1000;
    `;
    floatingText.textContent = text;
    
    document.body.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
}

// Add CSS animations if not already present
function ensureAnimations() {
    if (!document.getElementById('ui-animations')) {
        const style = document.createElement('style');
        style.id = 'ui-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes floatUp {
                0% { transform: translateY(0); opacity: 1; }
                100% { transform: translateY(-50px); opacity: 0; }
            }
            .divine-shield-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 40px;
                opacity: 0.5;
                animation: pulse 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize UI animations on load
ensureAnimations();

// Initialize difficulty button state
function initDifficultyButton() {
    const button = document.getElementById('difficultyToggleBtn');
    if (button && window.storage) {
        const isEnabled = window.storage.isDynamicDifficultyEnabled();
        if (isEnabled) {
            button.textContent = '⚙️ Dynamic Difficulty: ON';
            button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        } else {
            button.textContent = '⚙️ Classic Difficulty';
            button.style.background = 'linear-gradient(135deg, #f093fb, #f5576c)';
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDifficultyButton);
} else {
    initDifficultyButton();
}

// Show winner screen
function showWinnerScreen(winner, goldReward, gemReward) {
    const screen = document.getElementById('winnerScreen');
    const text = document.getElementById('winnerText');
    const message = document.getElementById('winnerMessage');
    const rewardText = document.getElementById('rewardText');
    
    if (winner === 'player') {
        text.textContent = 'Victory!';
        message.textContent = 'Your strategic mastery has prevailed!';
    } else {
        text.textContent = 'Defeat';
        message.textContent = 'The AI has bested you this time. Try again!';
    }
    
    rewardText.innerHTML = `🪙 ${goldReward} Gold`;
    if (gemReward > 0) {
        rewardText.innerHTML += `<br>💎 ${gemReward} Gem`;
    }
    
    screen.style.display = 'flex';
    updateCurrencyDisplay();
}

// Make functions globally available
window.ui = {
    updateCurrencyDisplay,
    checkDailyReward,
    claimDailyReward,
    showMainMenu,
    showMultiplayer,
    showCardInfo,
    showGameStatistics,
    showGameHelp,
    toggleDifficultyMode,
    createCardElement,
    showWinnerScreen,
    showModal,
    removeModal,
    showNotification,
    animateValue,
    createFloatingText,
    ensureAnimations
};

// Also make individual functions globally available for HTML onclick handlers
window.updateCurrencyDisplay = updateCurrencyDisplay;
window.checkDailyReward = checkDailyReward;
window.claimDailyReward = claimDailyReward;
window.showMainMenu = showMainMenu;
window.showMultiplayer = showMultiplayer;
window.showCardInfo = showCardInfo;
window.showGameStatistics = showGameStatistics;
window.showGameHelp = showGameHelp;
