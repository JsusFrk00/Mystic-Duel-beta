// Storage Fix - Ensures players get starter cards
// Run this to fix the "0 cards" issue

// Check if URL has ?reset=true parameter
if (window.location.search.includes('reset=true')) {
    console.log('🔄 Reset parameter detected - clearing player data only...');
    localStorage.removeItem('playerData'); // Only remove playerData, not everything
    // Remove the parameter from URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

(function fixStorage() {
    console.log('🔧 Checking storage...');
    
    // CHECK if we actually need to fix anything
    const existing = localStorage.getItem('playerData');
    let needsReset = false;
    
    if (!existing) {
        console.log('No player data found, creating starter data');
        needsReset = true;
    } else {
        try {
            const parsed = JSON.parse(existing);
            // Check if data is valid
            if (!parsed.ownedCards || Object.keys(parsed.ownedCards).length === 0) {
                console.log('Player data corrupted or empty, resetting');
                needsReset = true;
            } else {
                console.log('Player data looks good, preserving existing collection');
                needsReset = false;
            }
        } catch (e) {
            console.log('Player data corrupt, resetting');
            needsReset = true;
        }
    }
    
    // ONLY reset if needed
    if (needsReset) {
        console.log('🔧 Fixing storage and adding starter cards...');
        
        // Force reset player data with starter cards
    const starterData = {
        gold: 500,
        gems: 5,
        ownedCards: {},
        lastDailyReward: null,
        lastStoreRefresh: null,
        currentStoreCards: [],
        savedDecks: [],
        gameStats: {
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
        }
    };
    
    // Add 30 starter cards
    const starterCards = [
        // Commons (15 creatures)
        "Goblin Scout", "Goblin Scout", 
        "Fire Sprite", "Fire Sprite",
        "Shield Bearer", "Shield Bearer",
        "Forest Wolf", "Forest Wolf",
        "Apprentice Mage", "Apprentice Mage",
        "Skeleton Warrior", "Skeleton Warrior",
        "Peasant", "Peasant",
        "Squire",
        
        // Common spells (10)
        "Arcane Missile", "Arcane Missile",
        "Healing Touch", "Healing Touch",
        "Frost Bolt", "Frost Bolt",
        "Battle Cry", "Battle Cry",
        "Minor Blessing", "Minor Blessing",
        
        // Rare cards (5)
        "Mystic Owl",
        "Stone Golem",
        "Lightning Bolt",
        "Healing Potion",
        "Wind Dancer"
    ];
    
    starterCards.forEach(cardName => {
        if (!starterData.ownedCards[cardName]) {
            starterData.ownedCards[cardName] = 0;
        }
        starterData.ownedCards[cardName]++;
    });
    
        // Save to localStorage
        localStorage.setItem('playerData', JSON.stringify(starterData));
        
        // Update window.storage if it exists
        if (window.storage) {
            window.storage.playerData = starterData;
            console.log('✅ Storage fixed! You now have', Object.keys(starterData.ownedCards).length, 'different cards');
            console.log('📊 Card counts:', starterData.ownedCards);
        }
        
        console.log('✅ Player data reset with starter cards!');
    } else {
        console.log('✅ Existing player data preserved!');
    }
    
    // Update UI if available
    if (window.ui && window.ui.updateCurrencyDisplay) {
        window.ui.updateCurrencyDisplay();
    }
    
    return needsReset ? starterData : JSON.parse(localStorage.getItem('playerData'));
})();

// Fix deckbuilder
if (!window.deckbuilder || typeof window.deckbuilder.show !== 'function') {
    console.log('🔧 Fixing deckbuilder...');
    
    window.deckbuilder = {
        currentDeck: [],
        currentFilter: 'all',
        
        show: function() {
            console.log('📝 Opening deckbuilder...');
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('deckbuilder').style.display = 'block';
            document.getElementById('gameContainer').style.display = 'none';
            
            // Load and display cards
            this.loadCollection();
            this.updateDeckDisplay();
        },
        
        loadCollection: function() {
            const collection = document.getElementById('cardCollection');
            if (!collection) {
                console.log('❌ Card collection element not found');
                return;
            }
            
            collection.innerHTML = '';
            
            const ALL_CARDS = window.ALL_CARDS || [];
            let filteredCards = ALL_CARDS.filter(card => {
                if (this.currentFilter === 'owned') {
                    return window.storage.getOwnedCount(card.name) > 0;
                }
                if (this.currentFilter === 'all') return true;
                if (this.currentFilter === 'creature' || this.currentFilter === 'spell') {
                    return card.type === this.currentFilter;
                }
                return card.rarity === this.currentFilter;
            });
            
            filteredCards.forEach(cardTemplate => {
                const owned = window.storage.getOwnedCount(cardTemplate.name);
                if (owned > 0) {
                    const cardEl = this.createDeckbuilderCard(cardTemplate);
                    collection.appendChild(cardEl);
                }
            });
        },
        
        createDeckbuilderCard: function(template) {
            const card = new window.Card(template);
            const owned = window.storage.getOwnedCount(card.name);
            const copiesInDeck = this.currentDeck.filter(c => c.name === card.name).length;
            const maxCopies = card.rarity === 'legendary' ? 1 : 2;
            
            const cardEl = document.createElement('div');
            cardEl.className = `card ${card.type} ${card.rarity} ${owned === 0 ? 'unowned' : ''}`;
            
            cardEl.innerHTML = `
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-image">${card.emoji}</div>
                ${card.type === 'creature' ? `
                    <div class="card-stats">
                        <span class="attack-stat">⚔️ ${card.attack}</span>
                        <span class="health-stat">❤️ ${card.health}</span>
                    </div>
                ` : ''}
                <div style="text-align: center; margin-top: 5px; font-size: 10px;">
                    Deck: ${copiesInDeck}/${maxCopies} | Owned: ${owned}
                </div>
            `;
            
            cardEl.onclick = () => {
                if (owned > copiesInDeck && copiesInDeck < maxCopies && this.currentDeck.length < 30) {
                    this.addToDeck(template);
                }
            };
            
            if (copiesInDeck >= maxCopies || owned <= copiesInDeck) {
                cardEl.style.opacity = '0.5';
            }
            
            return cardEl;
        },
        
        addToDeck: function(template) {
            if (this.currentDeck.length >= 30) {
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
                        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                        <h2 style="color: #ff9800; margin-bottom: 20px;">Deck Full</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            Deck is full! (30 cards max)
                        </p>
                        <button id="fixStorageDeckFullBtn" style="
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
                
                document.getElementById('fixStorageDeckFullBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
                return;
            }
            
            const owned = window.storage.getOwnedCount(template.name);
            const copiesInDeck = this.currentDeck.filter(c => c.name === template.name).length;
            const maxCopies = template.rarity === 'legendary' ? 1 : 2;
            
            if (copiesInDeck >= maxCopies) {
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
                        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                        <h2 style="color: #ff9800; margin-bottom: 20px;">Max Copies Reached</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            Can't add more copies of <strong>${template.name}</strong>! (${maxCopies} max)
                        </p>
                        <button id="fixStorageMaxCopiesBtn" style="
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
                
                document.getElementById('fixStorageMaxCopiesBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
                return;
            }
            
            if (owned <= copiesInDeck) {
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
                        <h2 style="color: #f44336; margin-bottom: 20px;">Not Enough Copies</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            You don't own enough copies of <strong>${template.name}</strong>!
                        </p>
                        <button id="fixStorageNotEnoughBtn" style="
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
                
                document.getElementById('fixStorageNotEnoughBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
                return;
            }
            
            this.currentDeck.push(new window.Card(template));
            this.updateDeckDisplay();
            this.loadCollection();
        },
        
        updateDeckDisplay: function() {
            const deckCount = document.getElementById('deckCount');
            if (deckCount) {
                deckCount.textContent = this.currentDeck.length;
            }
            
            const deckList = document.getElementById('currentDeckList');
            if (deckList) {
                deckList.innerHTML = '';
                
                const cardGroups = {};
                this.currentDeck.forEach(card => {
                    if (!cardGroups[card.name]) {
                        cardGroups[card.name] = { card: card, count: 0 };
                    }
                    cardGroups[card.name].count++;
                });
                
                const sortedGroups = Object.values(cardGroups).sort((a, b) => a.card.cost - b.card.cost);
                
                sortedGroups.forEach(group => {
                    const item = document.createElement('div');
                    item.className = 'deck-card-item';
                    item.innerHTML = `
                        <span>(${group.card.cost}) ${group.card.name} ${group.card.emoji}</span>
                        <span>x${group.count}</span>
                    `;
                    item.onclick = () => this.removeFromDeck(group.card.name);
                    deckList.appendChild(item);
                });
            }
        },
        
        removeFromDeck: function(cardName) {
            const index = this.currentDeck.findIndex(c => c.name === cardName);
            if (index !== -1) {
                this.currentDeck.splice(index, 1);
                this.updateDeckDisplay();
                this.loadCollection();
            }
        },
        
        getCurrentDeck: function() {
            return this.currentDeck;
        },
        
        filterCards: function(filter) {
            this.currentFilter = filter;
            this.loadCollection();
        },
        
        clearDeck: function() {
            this.currentDeck = [];
            this.updateDeckDisplay();
            this.loadCollection();
        },
        
        saveDeck: function() {
            const deckName = document.getElementById('deckName').value || 'Unnamed Deck';
            if (this.currentDeck.length !== 30) {
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
                        <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                        <h2 style="color: #ff9800; margin-bottom: 20px;">Incomplete Deck</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            Deck must have exactly 30 cards!
                        </p>
                        <button id="fixStorageIncompleteBtn" style="
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
                
                document.getElementById('fixStorageIncompleteBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
                return;
            }
            
            window.storage.saveDeck(deckName, this.currentDeck);
            
            // Show success modal
            const successModal = document.createElement('div');
            successModal.style.cssText = `
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
            
            successModal.innerHTML = `
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
                    <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #4CAF50; margin-bottom: 20px;">Deck Saved!</h2>
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        Deck "<strong>${deckName}</strong>" saved!
                    </p>
                    <button id="fixStorageDeckSavedBtn" style="
                        padding: 12px 40px;
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                    ">OK</button>
                </div>
            `;
            
            document.body.appendChild(successModal);
            
            document.getElementById('fixStorageDeckSavedBtn').onclick = () => {
                document.body.removeChild(successModal);
            };
        },
        
        loadSavedDecks: function() {
            const savedDecks = window.storage.loadDecks();
            const savedDecksList = document.getElementById('savedDecksList');
            
            if (!savedDecksList) {
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
                        max-width: 450px;
                        width: 90%;
                        color: #333;
                    ">
                        <h2 style="text-align: center; color: #667eea; margin-bottom: 20px;">💾 Saved Decks</h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            ${savedDecks.length === 0 ? 
                                '<p style="margin: 0; text-align: center; color: #666;">No saved decks yet!</p>' :
                                savedDecks.map((d, i) => `<p style="margin: 8px 0;"><strong>${i + 1}.</strong> ${d.name} (${d.cards.length} cards)</p>`).join('')
                            }
                        </div>
                        <div style="text-align: center;">
                            <button id="savedDecksOkBtn" style="
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
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                document.getElementById('savedDecksOkBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
                return;
            }
            
            savedDecksList.innerHTML = '';
            
            if (savedDecks.length === 0) {
                savedDecksList.innerHTML = '<p>No saved decks yet!</p>';
            } else {
                savedDecks.forEach((deck, index) => {
                    const deckItem = document.createElement('div');
                    deckItem.className = 'saved-deck-item';
                    deckItem.innerHTML = `
                        <span>${deck.name}</span>
                        <div class="deck-actions">
                            <button onclick="deckbuilder.loadDeck(${index})">Load</button>
                            <button onclick="deckbuilder.playWithDeck(${index})">Play</button>
                            <button onclick="deckbuilder.deleteDeck(${index})">Delete</button>
                        </div>
                    `;
                    savedDecksList.appendChild(deckItem);
                });
            }
            
            document.getElementById('savedDecks').style.display = 'flex';
        },
        
        loadDeck: function(index) {
            const savedDecks = window.storage.loadDecks();
            const deck = savedDecks[index];
            
            this.currentDeck = deck.cards.map(c => new window.Card(c));
            this.show();
        },
        
        playWithDeck: function(index) {
            const savedDecks = window.storage.loadDecks();
            const deck = savedDecks[index];
            
            const deckCards = deck.cards.map(c => new window.Card(c));
            window.gameManager.startGame(deckCards);
        },
        
        deleteDeck: function(index) {
            const savedDecks = window.storage.loadDecks();
            const deckName = savedDecks[index]?.name || 'this deck';
            
            // Show custom HTML confirm modal instead of confirm()
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
                    <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
                    <h2 style="color: #f44336; margin-bottom: 20px;">Delete Deck?</h2>
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        Delete deck "<strong>${deckName}</strong>"?
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="fixStorageDeleteCancelBtn" style="
                            padding: 12px 30px;
                            background: #6c757d;
                            border: none;
                            border-radius: 10px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 1em;
                        ">Cancel</button>
                        <button id="fixStorageDeleteConfirmBtn" style="
                            padding: 12px 30px;
                            background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                            border: none;
                            border-radius: 10px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                            font-size: 1em;
                            box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
                        ">Delete</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('fixStorageDeleteCancelBtn').onclick = () => {
                document.body.removeChild(modal);
            };
            
            document.getElementById('fixStorageDeleteConfirmBtn').onclick = () => {
                document.body.removeChild(modal);
                window.storage.deleteDeck(index);
                this.loadSavedDecks();
            };
        }
    };
    
    console.log('✅ Deckbuilder fixed!');
}

// Update game manager to use fixed deckbuilder
if (window.gameManager) {
    window.gameManager.showDeckbuilder = function() {
        if (window.deckbuilder && window.deckbuilder.show) {
            window.deckbuilder.show();
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
                    <div style="font-size: 60px; margin-bottom: 20px;">⏳</div>
                    <h2 style="color: #667eea; margin-bottom: 20px;">Deckbuilder Loading</h2>
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        Deckbuilder is being prepared. Please try again in a moment.
                    </p>
                    <button id="fixStorageLoadingBtn" style="
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
            
            document.getElementById('fixStorageLoadingBtn').onclick = () => {
                document.body.removeChild(modal);
            };
        }
    };
}

console.log('✅ All storage and deckbuilder issues fixed!');
console.log('📝 You should now have starter cards and working deckbuilder');