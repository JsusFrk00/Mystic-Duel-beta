// Deckbuilder Complete Fix - v3.0 with full color system support
console.log('🔨 Loading deckbuilder fix v3.0...');

// Create deckbuilder in global scope
window.deckbuilder = {
    currentDeck: [],
    currentFilter: 'all',
    currentSort: 'rarity', // 'rarity', 'cost', 'name'
    
    show: function() {
        console.log('📝 Opening deckbuilder...');
        
        // Hide other screens
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('storeContainer').style.display = 'none';
        document.getElementById('collectionContainer').style.display = 'none';
        
        // Show deckbuilder
        const deckbuilderDiv = document.getElementById('deckbuilder');
        if (deckbuilderDiv) {
            deckbuilderDiv.style.display = 'block';
        } else {
            console.error('❌ Deckbuilder element not found!');
            return;
        }
        
        // Initialize
        this.loadCollection();
        this.updateDeckDisplay();
    },
    
    loadCollection: function() {
        console.log('📚 Loading card collection...');
        const collection = document.getElementById('cardCollection');
        
        if (!collection) {
            console.error('❌ Card collection element not found');
            return;
        }
        
        collection.innerHTML = '';
        collection.style.display = 'grid';
        
        const ALL_CARDS = window.ALL_CARDS || [];
        if (ALL_CARDS.length === 0) {
            console.error('❌ No cards defined!');
            return;
        }
        
        // Filter cards based on current filter
        let filteredCards = ALL_CARDS.filter(card => {
            if (this.currentFilter === 'owned') {
                const owned = (window.storage && window.storage.getOwnedCount) ? 
                    window.storage.getOwnedCount(card.name) : 0;
                return owned > 0;
            }
            if (this.currentFilter === 'all') return true;
            if (this.currentFilter === 'creature' || this.currentFilter === 'spell') {
                return card.type === this.currentFilter;
            }
            // v3.0: COLOR FILTERS
            if (this.currentFilter === 'crimson' || this.currentFilter === 'azure' || 
                this.currentFilter === 'verdant' || this.currentFilter === 'umbral' || 
                this.currentFilter === 'colorless') {
                return card.color && card.color.includes(this.currentFilter);
            }
            if (this.currentFilter === 'splash') {
                return card.splashFriendly === true;
            }
            // RARITY FILTERS
            if (['common', 'rare', 'epic', 'legendary'].includes(this.currentFilter)) {
                return card.rarity === this.currentFilter;
            }
            return false;
        });
        
        console.log(`[DECKBUILDER] Found ${filteredCards.length} cards matching filter: ${this.currentFilter}`);
        
        // v3.0 Debug: Check for Full Art cards
        const fullArtCards = filteredCards.filter(c => c.fullArt || c.variant === 'Full Art');
        console.log(`[DECKBUILDER] Full Art cards in filtered set: ${fullArtCards.length}`);
        if (fullArtCards.length > 0) {
            console.log('[DECKBUILDER] Sample Full Art cards:', fullArtCards.slice(0, 3).map(c => ({
                name: c.name,
                variant: c.variant,
                fullArt: c.fullArt
            })));
        }
        
        filteredCards = this.sortCards(filteredCards);
        
        filteredCards.forEach(cardTemplate => {
            const cardEl = this.createDeckbuilderCard(cardTemplate);
            if (cardEl) {
                collection.appendChild(cardEl);
            }
        });
        
        if (filteredCards.length === 0) {
            collection.innerHTML = '<div style="padding: 20px; text-align: center;">No cards found.</div>';
        }
    },
    
    createDeckbuilderCard: function(template) {
        // v3.0: Check ownership by variant
        const owned = (window.storage && window.storage.getOwnedCount) ? 
            window.storage.getOwnedCount(template.name, template.variant || 'standard') : 0;
        
        const copiesInDeck = this.currentDeck.filter(c => c.name === template.name).length;
        const maxCopies = template.rarity === 'legendary' ? 1 : 2;
        
        const cardEl = document.createElement('div');
        // v3.0: Add color classes AND full-art class
        let classes = `card ${template.type} ${template.rarity} ${template.color || 'colorless'} ${owned === 0 ? 'unowned' : ''} ${template.splashFriendly ? 'splash-friendly' : ''}`;
        if (template.fullArt) classes += ' full-art';
        cardEl.className = classes;
        cardEl.setAttribute('data-color', template.color || 'colorless');
        cardEl.setAttribute('data-rarity', template.rarity);
        
        if (owned === 0) {
            cardEl.style.cursor = 'not-allowed';
        } else if (copiesInDeck >= maxCopies || copiesInDeck >= owned) {
            cardEl.style.opacity = '0.5';
            cardEl.style.cursor = 'not-allowed';
        }
        
        cardEl.style.position = 'relative';
        
        // v3.0: Hide emojis if name OR ability is long
        const hasLongText = template.type === 'creature' && (
            (template.ability && template.ability.length > 10) || 
            (template.name && template.name.length > 12)
        );
        
        // v3.0: Get abbreviated text and dynamic name sizing
        const displayAbility = window.cardDisplayUtils ? 
            window.cardDisplayUtils.getDisplayAbility(template) : 
            (template.ability || 'No ability');
        
        const nameHTML = window.cardDisplayUtils ? 
            window.cardDisplayUtils.buildCardNameHTML(template.name) : 
            `<div class="card-name">${template.name}</div>`;
        
        cardEl.innerHTML = `
            <div class="card-info-btn" onclick="showCardInfo(event, ${JSON.stringify(template).replace(/"/g, '&quot;')})">i</div>
            <div class="card-cost">${template.cost}</div>
            ${nameHTML}
            <div class="card-image">${template.emoji || '🎴'}</div>
            ${template.type === 'creature' ? `
                <div class="card-description">${displayAbility}</div>
                <div class="card-stats">
                    <span class="attack-stat">${hasLongText ? '' : '⚔️ '}${template.attack}</span>
                    <span class="health-stat">${hasLongText ? '' : '❤️ '}${template.health}</span>
                </div>
            ` : `<div class="card-description">${displayAbility}</div>`}
            <div style="position: absolute; bottom: -30px; left: 0; right: 0; font-size: 10px; text-align: center; background: rgba(0,0,0,0.5); padding: 2px;">
                In Deck: ${copiesInDeck}/${Math.min(maxCopies, owned)} | Owned: ${owned}
            </div>
        `;
        
        cardEl.onclick = (e) => {
            if (e.target.classList.contains('card-info-btn')) return;
            
            if (owned === 0) {
                this.showModal('Card Not Owned', `You don't own <strong>${template.name}</strong>! Buy it from the store.`);
            } else if (copiesInDeck < maxCopies && copiesInDeck < owned && this.currentDeck.length < 30) {
                this.addToDeck(template);
            } else if (this.currentDeck.length >= 30) {
                this.showModal('Deck Full', 'Deck is full! (30 cards maximum)');
            } else if (copiesInDeck >= maxCopies) {
                this.showModal('Max Copies', `Maximum <strong>${maxCopies}</strong> copies of ${template.rarity} cards allowed!`);
            } else if (copiesInDeck >= owned) {
                this.showModal('Not Enough Copies', `You don't own enough copies of <strong>${template.name}</strong>!`);
            }
        };
        
        return cardEl;
    },
    
    showModal: function(title, message) {
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">⚠️</div><h2 style="color: #ff9800; margin-bottom: 20px;">${title}</h2><p style="margin-bottom: 25px; line-height: 1.6;">${message}</p><button id="modalOkBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em;">OK</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('modalOkBtn').onclick = () => { document.body.removeChild(modal); };
    },
    
    addToDeck: function(template) {
        const card = window.Card ? new window.Card(template) : { ...template };
        
        // v3.0: Check if adding this card would violate color rules
        const testDeck = [...this.currentDeck, card];
        const colorValidation = this.checkColorRulesForCard(testDeck, card);
        
        if (!colorValidation.valid) {
            this.showModal('Color Rules Violation', colorValidation.error);
            return;
        }
        
        this.currentDeck.push(card);
        console.log(`➕ Added ${template.name} to deck (${this.currentDeck.length}/30)`);
        this.updateDeckDisplay();
        this.loadCollection();
    },
    
    removeFromDeck: function(cardName) {
        const index = this.currentDeck.findIndex(c => c.name === cardName);
        if (index !== -1) {
            this.currentDeck.splice(index, 1);
            console.log(`➖ Removed ${cardName} from deck (${this.currentDeck.length}/30)`);
            this.updateDeckDisplay();
            this.loadCollection();
        }
    },
    
    updateDeckDisplay: function() {
        const deckCount = document.getElementById('deckCount');
        if (deckCount) {
            deckCount.textContent = this.currentDeck.length;
            deckCount.style.color = this.currentDeck.length === 30 ? '#4CAF50' : 
                                   this.currentDeck.length < 30 ? '#FFA500' : '#F44336';
        }
        
        // v3.0: Show deck colors
        this.updateDeckColorDisplay();
        
        const deckList = document.getElementById('currentDeckList');
        if (deckList) {
            deckList.innerHTML = '';
            
            if (this.currentDeck.length === 0) {
                deckList.innerHTML = '<div style="padding: 10px; text-align: center;">Click cards to add!</div>';
                return;
            }
            
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
                    <span>
                        <span style="color: #4FC3F7;">(${group.card.cost})</span>
                        ${group.card.name} ${group.card.emoji || '🎴'}
                    </span>
                    <span style="color: #FFA500;">x${group.count}</span>
                `;
                item.onclick = () => this.removeFromDeck(group.card.name);
                item.title = 'Click to remove';
                deckList.appendChild(item);
            });
        }
        
        this.updateManaCurve();
    },
    
    // v3.0: Show deck color composition
    updateDeckColorDisplay: function() {
        let mainColors = new Set();
        let splashCards = [];
        
        // FIRST PASS: Only NON-splashFriendly determine main colors
        this.currentDeck.forEach(card => {
            if (card.color && card.color.includes('colorless')) return;
            if (!card.splashFriendly) {
                (card.color || '').split('-').forEach(c => mainColors.add(c));
            }
        });
        
        // SECOND PASS: Only splashFriendly NOT in main colors are splash
        this.currentDeck.forEach(card => {
            if (card.splashFriendly && card.color && !card.color.includes('colorless')) {
                const cardColors = card.color.split('-');
                const matchesMainColor = cardColors.some(c => mainColors.has(c));
                if (!matchesMainColor) {
                    splashCards.push(card);
                }
            }
        });
        
        let colorDisplay = document.getElementById('deckColorDisplay');
        if (!colorDisplay) {
            colorDisplay = document.createElement('span');
            colorDisplay.id = 'deckColorDisplay';
            colorDisplay.style.cssText = 'margin-left: 15px; font-size: 14px;';
            const deckCount = document.getElementById('deckCount');
            if (deckCount && deckCount.parentElement) {
                deckCount.parentElement.appendChild(colorDisplay);
            }
        }
        
        const colorIcons = { crimson: '🔴', azure: '🔵', verdant: '🟢', umbral: '🟣' };
        let colorText = '';
        if (mainColors.size > 0) {
            colorText = ' | ' + Array.from(mainColors).map(c => colorIcons[c] || c).join(' ');
        }
        if (splashCards.length > 0) {
            colorText += ` | ✨${splashCards.length}`;
        }
        colorDisplay.textContent = colorText;
    },
    
    updateManaCurve: function() {
        const curve = document.getElementById('manaCurve');
        if (!curve) return;
        
        curve.innerHTML = '';
        
        const manaCounts = {};
        for (let i = 0; i <= 10; i++) manaCounts[i] = 0;
        
        this.currentDeck.forEach(card => {
            const cost = Math.min(card.cost, 10);
            manaCounts[cost]++;
        });
        
        const maxCount = Math.max(...Object.values(manaCounts), 1);
        
        for (let i = 0; i <= 10; i++) {
            const bar = document.createElement('div');
            bar.className = 'mana-bar';
            const heightPercent = (manaCounts[i] / maxCount) * 100;
            bar.style.height = `${heightPercent}%`;
            
            if (manaCounts[i] > 0) {
                const countLabel = document.createElement('div');
                countLabel.style.cssText = 'position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 11px; color: white; font-weight: bold;';
                countLabel.textContent = manaCounts[i];
                bar.appendChild(countLabel);
            }
            
            const costLabel = document.createElement('span');
            costLabel.textContent = i === 10 ? '10+' : i;
            bar.appendChild(costLabel);
            
            curve.appendChild(bar);
        }
    },
    
    getCurrentDeck: function() {
        return this.currentDeck;
    },
    
    filterCards: function(filter) {
        console.log(`🔍 Filtering cards by: ${filter}`);
        this.currentFilter = filter;
        
        document.querySelectorAll('#deckbuilder .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        this.loadCollection();
    },
    
    sortCards: function(cards) {
        const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
        
        if (this.currentSort === 'cost') {
            return cards.sort((a, b) => {
                if (a.cost !== b.cost) return a.cost - b.cost;
                return a.name.localeCompare(b.name);
            });
        } else if (this.currentSort === 'name') {
            return cards.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            return cards.sort((a, b) => {
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) {
                    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                }
                if (a.cost !== b.cost) return a.cost - b.cost;
                return a.name.localeCompare(b.name);
            });
        }
    },
    
    setSorting: function(sortType) {
        console.log(`🔢 Sorting cards by: ${sortType}`);
        this.currentSort = sortType;
        
        document.querySelectorAll('#deckbuilder .sort-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        this.loadCollection();
    },
    
    clearDeck: function() {
        if (this.currentDeck.length > 0) {
            const modal = document.createElement('div');
            modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
            modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">⚠️</div><h2 style="color: #ff9800; margin-bottom: 20px;">Clear Deck?</h2><p style="margin-bottom: 25px;">Clear all cards from deck?</p><div style="display: flex; gap: 15px; justify-content: center;"><button id="clearCancelBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button><button id="clearConfirmBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #f44336, #d32f2f); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Clear</button></div></div>`;
            document.body.appendChild(modal);
            document.getElementById('clearCancelBtn').onclick = () => { document.body.removeChild(modal); };
            document.getElementById('clearConfirmBtn').onclick = () => {
                document.body.removeChild(modal);
                this.currentDeck = [];
                this.updateDeckDisplay();
                this.loadCollection();
            };
        }
    },
    
    // v3.0: Real-time color validation when adding cards
    checkColorRulesForCard: function(deck, newCard) {
        let mainColors = new Set();
        let splashCards = [];
        
        // FIRST PASS: Only NON-splashFriendly cards determine main colors
        deck.forEach(card => {
            if (card.color && card.color.includes('colorless')) return;
            if (!card.splashFriendly) {
                (card.color || '').split('-').forEach(c => mainColors.add(c));
            }
        });
        
        // SECOND PASS: Only splashFriendly cards NOT in main colors are splash
        deck.forEach(card => {
            if (card.splashFriendly && card.color && !card.color.includes('colorless')) {
                const cardColors = card.color.split('-');
                const matchesMainColor = cardColors.some(c => mainColors.has(c));
                if (!matchesMainColor) {
                    splashCards.push(card);
                }
            }
        });
        
        // Check main color limit
        if (mainColors.size > 2) {
            const colorIcons = { crimson: '🔴', azure: '🔵', verdant: '🟢', umbral: '🟣' };
            const colorList = Array.from(mainColors).map(c => `${colorIcons[c] || ''} ${c}`).join(', ');
            return { 
                valid: false, 
                error: `<strong>Too many colors!</strong><br><br>You can only have up to <strong>2 main colors</strong> in your deck.<br><br>Current colors: ${colorList}<br><br><em>Tip: Use Splash-friendly cards (✨) for a 3rd color (max 3 splash cards)</em>` 
            };
        }
        
        // Check splash card limit
        if (splashCards.length > 3) {
            return { 
                valid: false, 
                error: `<strong>Too many splash cards!</strong><br><br>You have ${splashCards.length} splash cards. Maximum is <strong>3</strong>.<br><br>Splash cards: ${splashCards.map(c => c.name).join(', ')}` 
            };
        }
        
        // Check splash cards are all from same color
        if (splashCards.length > 0) {
            const splashColors = new Set();
            splashCards.forEach(card => {
                card.color.split('-').forEach(c => splashColors.add(c));
            });
            
            if (splashColors.size > 1) {
                const colorIcons = { crimson: '🔴', azure: '🔵', verdant: '🟢', umbral: '🟣' };
                const splashList = Array.from(splashColors).map(c => `${colorIcons[c] || ''} ${c}`).join(', ');
                return {
                    valid: false,
                    error: `<strong>Splash cards must be from one color!</strong><br><br>Your splash cards are from: ${splashList}<br><br>Choose splash cards from only <strong>one</strong> 3rd color.`
                };
            }
        }
        
        return { valid: true };
    },
    
    // v3.0: Validate deck colors
    validateDeckColors: function(deck) {
        if (deck.length !== 30) {
            return { valid: false, error: `Deck must have exactly 30 cards! Current: ${deck.length}/30` };
        }
        
        let mainColors = new Set();
        let splashCards = [];
        
        // FIRST PASS: Only NON-splashFriendly cards determine main colors
        deck.forEach(card => {
            if (card.color === 'colorless') return;
            if (!card.splashFriendly) {
                (card.color || '').split('-').forEach(c => mainColors.add(c));
            }
        });
        
        // SECOND PASS: Determine which splashFriendly cards are truly 3rd color
        deck.forEach(card => {
            if (card.splashFriendly && card.color && !card.color.includes('colorless')) {
                const cardColors = card.color.split('-');
                const matchesMainColor = cardColors.some(c => mainColors.has(c));
                if (!matchesMainColor) {
                    splashCards.push(card);
                }
            }
        });
        
        if (mainColors.size > 2) {
            return { 
                valid: false, 
                error: `Too many main colors! You have ${mainColors.size} colors (${Array.from(mainColors).join(', ')}). Max 2 allowed.` 
            };
        }
        
        if (splashCards.length > 3) {
            return { 
                valid: false, 
                error: `Too many splash cards! You have ${splashCards.length}. Max 3 allowed.` 
            };
        }
        
        return { valid: true };
    },
    
    saveDeck: function() {
        const deckNameEl = document.getElementById('deckName');
        const name = deckNameEl ? deckNameEl.value : 'Unnamed Deck';
        
        // Color validation removed - live validation already handles this
        // if (!validation.valid) {
        //     this.showModal('Invalid Deck', validation.error);
        //     return;
        // }
        
        if (window.storage && window.storage.saveDeck) {
            window.storage.saveDeck(name || 'Unnamed Deck', this.currentDeck);
            this.showModal('Deck Saved!', `Deck "<strong>${name}</strong>" saved successfully!`);
            if (deckNameEl) deckNameEl.value = '';
        }
    },
    
    loadSavedDecks: function() {
        const decks = (window.storage && window.storage.loadDecks) ? window.storage.loadDecks() : [];
        const savedDecksList = document.getElementById('savedDecksList');
        const savedDecksDiv = document.getElementById('savedDecks');
        
        if (savedDecksDiv) savedDecksDiv.style.display = 'flex';
        
        if (savedDecksList) {
            savedDecksList.innerHTML = '';
            
            if (decks.length === 0) {
                savedDecksList.innerHTML = '<p>No saved decks yet!</p>';
            } else {
                decks.forEach((deck, index) => {
                    const deckItem = document.createElement('div');
                    deckItem.className = 'saved-deck-item';
                    deckItem.innerHTML = `
                        <div>${deck.name}</div>
                        <div class="deck-actions">
                            <button class="small-btn" onclick="deckbuilder.loadDeck(${index})">Load</button>
                            <button class="small-btn" onclick="deckbuilder.playWithDeck(${index})">Play</button>
                            <button class="small-btn" onclick="deckbuilder.deleteDeck(${index})">Delete</button>
                        </div>
                    `;
                    savedDecksList.appendChild(deckItem);
                });
            }
        }
    },
    
    loadDeck: function(index) {
        const decks = (window.storage && window.storage.loadDecks) ? window.storage.loadDecks() : [];
        if (index >= 0 && index < decks.length) {
            const deck = decks[index];
            this.currentDeck = deck.cards.map(c => window.Card ? new window.Card(c) : c);
            this.show();
        }
    },
    
    playWithDeck: function(index) {
        const decks = (window.storage && window.storage.loadDecks) ? window.storage.loadDecks() : [];
        if (index >= 0 && index < decks.length) {
            const deck = decks[index];
            const deckCards = deck.cards.map(c => window.Card ? new window.Card(c) : c);
            if (window.gameManager && window.gameManager.startGame) {
                window.gameManager.startGame(deckCards);
            }
        }
    },
    
    deleteDeck: function(index) {
        const decks = (window.storage && window.storage.loadDecks) ? window.storage.loadDecks() : [];
        const deckName = decks[index]?.name || 'this deck';
        
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">⚠️</div><h2 style="color: #f44336; margin-bottom: 20px;">Delete Deck?</h2><p style="margin-bottom: 25px;">Delete "<strong>${deckName}</strong>"?</p><div style="display: flex; gap: 15px; justify-content: center;"><button id="deleteCancelBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button><button id="deleteConfirmBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #f44336, #d32f2f); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Delete</button></div></div>`;
        document.body.appendChild(modal);
        document.getElementById('deleteCancelBtn').onclick = () => { document.body.removeChild(modal); };
        document.getElementById('deleteConfirmBtn').onclick = () => {
            document.body.removeChild(modal);
            if (window.storage && window.storage.deleteDeck) {
                window.storage.deleteDeck(index);
                this.loadSavedDecks();
            }
        };
    }
};

console.log('✅ Deckbuilder fix v3.0 loaded successfully!');
