// Deckbuilder Module - Handles deck building functionality
// Access global variables instead of imports

console.log('🔄 deckbuilder.js starting to load...');

let currentDeck = [];
let currentFilter = 'all';

console.log('✅ deckbuilder.js variables initialized');

// Show deckbuilder
function show() {
    console.log('🔄 deckbuilder.show() called');
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('deckbuilder').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameLog').style.display = 'none';
    loadCollection();
    updateDeckDisplay();
    console.log('✅ deckbuilder.show() completed');
}

// Get current deck
function getCurrentDeck() {
    return currentDeck;
}

// Load collection for deckbuilding
function loadCollection() {
    const collection = document.getElementById('cardCollection');
    collection.innerHTML = '';
    
    // Debug: Check total cards and variants
    console.log('[DECKBUILDER] Total cards in ALL_CARDS:', window.ALL_CARDS.length);
    console.log('[DECKBUILDER] Full Art cards:', window.ALL_CARDS.filter(c => c.fullArt || c.variant === 'Full Art').length);
    
    // Use ALL_CARDS to show both standard and Full Art variants
    let filteredCards = window.ALL_CARDS.filter(card => {
        if (currentFilter === 'owned') {
            return window.storage.getOwnedCount(card.name, card.variant || 'standard') > 0;
        }
        if (currentFilter === 'all') return true;
        if (currentFilter === 'creature' || currentFilter === 'spell') {
            return card.type === currentFilter;
        }
        // COLOR FILTERS (v3.0)
        if (currentFilter === 'crimson' || currentFilter === 'azure' || 
            currentFilter === 'verdant' || currentFilter === 'umbral' || currentFilter === 'colorless') {
            // Handle dual-color cards (e.g., "crimson-azure" matches both crimson AND azure filters)
            return card.color && card.color.includes(currentFilter);
        }
        if (currentFilter === 'splash') {
            return card.splashFriendly === true;
        }
        // RARITY FILTERS
        return card.rarity === currentFilter;
    });
    
    console.log('[DECKBUILDER] Filtered cards count:', filteredCards.length);
    
    // Debug: Log cards with variants
    const cardsWithVariants = filteredCards.filter(c => c.name === 'Whale Shark' || c.name === 'Titan of Earth');
    console.log('[DECKBUILDER] Example cards with variants:', cardsWithVariants.map(c => ({
        name: c.name,
        variant: c.variant || 'standard',
        fullArt: c.fullArt
    })));
    
    filteredCards.forEach(cardTemplate => {
        const owned = window.storage.getOwnedCount(cardTemplate.name, cardTemplate.variant || 'standard');
        const cardEl = createDeckbuilderCard(cardTemplate, owned);
        collection.appendChild(cardEl);
    });
}

// Create deckbuilder card element
function createDeckbuilderCard(template, owned) {
    // Use template directly for display (like Collection does)
    // Only create Card object when adding to deck
    const card = template;
    // v3.0: Count by NAME only (variants count together for deck limit)
    const copiesInDeck = currentDeck.filter(c => c.name === card.name).length;
    const maxCopies = card.rarity === 'legendary' ? 1 : 2;
    
    const cardEl = document.createElement('div');
    // v3.0: Add color class, Full Art class, and data attributes
    let classes = `card ${card.type} ${card.rarity} ${card.color || 'colorless'} ${owned === 0 ? 'unowned' : ''} ${card.splashFriendly ? 'splash-friendly' : ''}`;
    if (card.fullArt) classes += ' full-art';
    cardEl.className = classes;
    cardEl.setAttribute('data-color', card.color || 'colorless');
    cardEl.setAttribute('data-rarity', card.rarity);
    
    // v3.0: Hide stat emojis if name OR ability is long
    const hasLongText = card.type === 'creature' && (
        (card.ability && card.ability.length > 10) || 
        (card.name && card.name.length > 12)
    );
    
    cardEl.innerHTML = `
        <div class="card-info-btn" onclick="showCardInfo(event, ${JSON.stringify(card).replace(/"/g, '&quot;')})">i</div>
        <div class="card-cost">${card.cost}</div>
        ${window.cardDisplayUtils ? window.cardDisplayUtils.buildCardNameHTML(card.name) : `<div class="card-name">${card.name}</div>`}
        <div class="card-image">${card.emoji}</div>
        ${card.type === 'creature' ? `
            <div class="card-description">${window.cardDisplayUtils ? window.cardDisplayUtils.getDisplayAbility(card) : (card.ability || 'No ability')}</div>
            <div class="card-stats">
                <span class="attack-stat">${hasLongText ? '' : '⚔️ '}${card.attack}</span>
                <span class="health-stat">${hasLongText ? '' : '❤️ '}${card.health}</span>
            </div>
        ` : `<div class="card-description">${window.cardDisplayUtils ? window.cardDisplayUtils.getDisplayAbility(card) : card.ability}</div>`}
        <div style="text-align: center; margin-top: 5px; font-size: 10px;">
            Deck: ${copiesInDeck}/${maxCopies} | Owned: ${owned}
        </div>
    `;
    
    cardEl.onclick = (e) => {
        if (!e.target.classList.contains('card-info-btn')) {
            if (owned > copiesInDeck) {
                addToDeck(template);
            } else if (owned === 0) {
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
                        <div style="font-size: 60px; margin-bottom: 20px;">🛍️</div>
                        <h2 style="color: #667eea; margin-bottom: 20px;">Card Not Owned</h2>
                        <p style="margin-bottom: 25px; line-height: 1.6;">
                            You don't own this card! Buy it in the store.
                        </p>
                        <button id="notOwnedBtn" style="
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
                
                document.getElementById('notOwnedBtn').onclick = () => {
                    document.body.removeChild(modal);
                };
            }
        }
    };
    
    if (copiesInDeck >= maxCopies || owned <= copiesInDeck) {
        cardEl.style.opacity = '0.5';
    }
    
    return cardEl;
}

// Filter cards
function filterCards(filter) {
    currentFilter = filter;
    document.querySelectorAll('#deckbuilder .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    loadCollection();
}

// Add card to deck
function addToDeck(template) {
    if (currentDeck.length >= 30) {
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
                <button id="deckFullBtn" style="
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
        
        document.getElementById('deckFullBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    const owned = window.storage.getOwnedCount(template.name, template.variant || 'standard');
    // v3.0: Count by NAME only (variants count together)
    const copiesInDeck = currentDeck.filter(c => c.name === template.name).length;
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
                <p style="margin-bottom: 15px; font-size: 0.9em; color: #666;">
                    You already have ${copiesInDeck} ${template.name}(s) in your deck.
                </p>
                <button id="maxCopiesBtn" style="
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
        
        document.getElementById('maxCopiesBtn').onclick = () => {
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
                <button id="notEnoughBtn" style="
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
        
        document.getElementById('notEnoughBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    currentDeck.push(new window.Card(template));
    updateDeckDisplay();
    loadCollection();
}

// Remove card from deck
function removeFromDeck(cardName) {
    const index = currentDeck.findIndex(c => c.name === cardName);
    if (index !== -1) {
        currentDeck.splice(index, 1);
        updateDeckDisplay();
        loadCollection();
    }
}

// Update deck display
function updateDeckDisplay() {
    // Update deck count
    document.getElementById('deckCount').textContent = currentDeck.length;
    
    // v3.0: Show deck colors
    let mainColors = new Set();
    let splashCards = [];
    
    // FIRST PASS: Only NON-splashFriendly cards determine main colors
    currentDeck.forEach(card => {
        if (card.color === 'colorless') return;
        if (!card.splashFriendly) {
            card.color.split('-').forEach(c => mainColors.add(c));
        }
    });
    
    // SECOND PASS: Only splashFriendly NOT in main colors are splash
    currentDeck.forEach(card => {
        if (card.splashFriendly && card.color !== 'colorless') {
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
        document.getElementById('deckCount').parentElement.appendChild(colorDisplay);
    }
    
    const colorIcons = {
        crimson: '🔴',
        azure: '🔵',
        verdant: '🟢',
        umbral: '🟣'
    };
    
    let colorText = '';
    if (mainColors.size > 0) {
        colorText = ' | ' + Array.from(mainColors).map(c => colorIcons[c] || c).join(' ');
    }
    if (splashCards.length > 0) {
        colorText += ` | ✨${splashCards.length}`;
    }
    colorDisplay.textContent = colorText;
    
    // Update deck list
    const deckList = document.getElementById('currentDeckList');
    deckList.innerHTML = '';
    
    // Group cards by name
    const cardGroups = {};
    currentDeck.forEach(card => {
        if (!cardGroups[card.name]) {
            cardGroups[card.name] = { card: card, count: 0 };
        }
        cardGroups[card.name].count++;
    });
    
    // Sort by mana cost
    const sortedGroups = Object.values(cardGroups).sort((a, b) => a.card.cost - b.card.cost);
    
    sortedGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'deck-card-item';
        item.innerHTML = `
            <span>(${group.card.cost}) ${group.card.name} ${group.card.emoji}</span>
            <span>x${group.count}</span>
        `;
        item.onclick = () => removeFromDeck(group.card.name);
        deckList.appendChild(item);
    });
    
    // Update mana curve
    updateManaCurve();
}

// Update mana curve visualization
function updateManaCurve() {
    const curve = document.getElementById('manaCurve');
    curve.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 10px; font-weight: bold; font-size: 14px; text-align: center;';
    header.textContent = 'Mana Curve:';
    curve.appendChild(header);
    
    // Count cards at each mana cost
    const manaCounts = {};
    for (let i = 0; i <= 10; i++) {
        manaCounts[i] = 0;
    }
    
    currentDeck.forEach(card => {
        const cost = Math.min(card.cost, 10);
        manaCounts[cost]++;
    });
    
    const maxCount = Math.max(...Object.values(manaCounts), 1);
    
    // Create bars container matching CSS expectations
    const barsContainer = document.createElement('div');
    barsContainer.style.cssText = 'height: 100px; display: flex; align-items: flex-end; gap: 5px; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 10px; position: relative;';
    
    for (let i = 0; i <= 10; i++) {
        const bar = document.createElement('div');
        bar.className = 'mana-bar';
        const heightPercent = (manaCounts[i] / maxCount) * 100;
        bar.style.height = `${heightPercent}%`;
        
        // Add count label inside bar (at top)
        if (manaCounts[i] > 0) {
            const countLabel = document.createElement('div');
            countLabel.style.cssText = 'position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 11px; color: white; font-weight: bold;';
            countLabel.textContent = manaCounts[i];
            bar.appendChild(countLabel);
        }
        
        // Add cost label (use existing CSS positioning)
        const costSpan = document.createElement('span');
        costSpan.textContent = i === 10 ? '10+' : i;
        bar.appendChild(costSpan);
        
        barsContainer.appendChild(bar);
    }
    
    curve.appendChild(barsContainer);
}

// Clear deck
function clearDeck() {
    currentDeck = [];
    updateDeckDisplay();
    loadCollection();
}

// v3.0: Validate deck follows color rules
function validateDeckColors(deck) {
    let mainColors = new Set();
    let splashCards = [];
    let colorlessCards = [];
    
    // FIRST PASS: Only NON-splashFriendly cards determine main colors
    deck.forEach(card => {
        // Skip colorless cards
        if (card.color === 'colorless') {
            colorlessCards.push(card);
            return;
        }
        
        // Only NON-splashFriendly cards count as main colors
        if (!card.splashFriendly) {
            const colors = card.color.split('-');
            colors.forEach(c => mainColors.add(c));
        }
    });
    
    // SECOND PASS: Now check which splashFriendly cards are actually 3rd color
    deck.forEach(card => {
        if (card.splashFriendly && card.color !== 'colorless') {
            // Check if this card's color is NOT in the 2 most common main colors
            // For now, if it matches ANY main color, it's not a splash
            const cardColors = card.color.split('-');
            const matchesMainColor = cardColors.some(c => mainColors.has(c));
            
            if (!matchesMainColor) {
                // This is truly a 3rd color
                splashCards.push(card);
            }
            // Otherwise it's just a regular card in your main colors
        }
    });
    
    // RULE 1: Max 2 main colors
    if (mainColors.size > 2) {
        return { 
            valid: false, 
            error: `Too many main colors! You have ${mainColors.size} colors (${Array.from(mainColors).join(', ')}). Max 2 allowed.` 
        };
    }
    
    // RULE 2: Max 3 splash cards
    if (splashCards.length > 3) {
        return { 
            valid: false, 
            error: `Too many splash cards! You have ${splashCards.length} splash cards. Max 3 allowed.` 
        };
    }
    
    // RULE 3: All splash cards must be from the same color
    if (splashCards.length > 0) {
        const splashColors = new Set();
        splashCards.forEach(card => {
            card.color.split('-').forEach(c => splashColors.add(c));
        });
        
        if (splashColors.size > 1) {
            const splashList = Array.from(splashColors).join(', ');
            return {
                valid: false,
                error: `Splash cards must all be from the same color! You have splash cards from: ${splashList}`
            };
        }
    }
    
    return { valid: true };
}

// Save deck
function saveDeck() {
    const deckName = document.getElementById('deckName').value || 'Unnamed Deck';
    
    // Check deck has 30 cards
    if (currentDeck.length < 30) {
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
                <p style="margin-bottom: 25px; color: #666;">
                    Current: <strong>${currentDeck.length}/30</strong> cards
                </p>
                <button id="deckIncompleteBtn" style="
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
        
        document.getElementById('deckIncompleteBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    // v3.0: Removed redundant save validation - live validation already enforces color rules
    
    const decks = window.storage.loadDecks();
    const existingDeckIndex = decks.findIndex(deck => deck.name === deckName);
    
    if (existingDeckIndex !== -1) {
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
                <h2 style="color: #ff9800; margin-bottom: 20px;">Overwrite Deck?</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">
                    A deck named "<strong>${deckName}</strong>" already exists. Do you want to overwrite it?
                </p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="overwriteCancelBtn" style="
                        padding: 12px 30px;
                        background: #6c757d;
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                    ">Cancel</button>
                    <button id="overwriteConfirmBtn" style="
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
                    ">Overwrite</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('overwriteCancelBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        
        document.getElementById('overwriteConfirmBtn').onclick = () => {
            document.body.removeChild(modal);
            window.storage.saveDeck(deckName, currentDeck);
            
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
                    <h2 style="color: #4CAF50; margin-bottom: 20px;">Deck Updated!</h2>
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        Deck "<strong>${deckName}</strong>" has been updated!
                    </p>
                    <button id="deckUpdatedBtn" style="
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
            
            document.getElementById('deckUpdatedBtn').onclick = () => {
                document.body.removeChild(successModal);
            };
        };
    } else {
        window.storage.saveDeck(deckName, currentDeck);
        
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
                <button id="deckSavedBtn" style="
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
        
        document.getElementById('deckSavedBtn').onclick = () => {
            document.body.removeChild(successModal);
        };
    }
}

// Load saved decks list
function loadSavedDecks() {
    const savedDecks = window.storage.loadDecks();
    const savedDecksList = document.getElementById('savedDecksList');
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
                    <button class="small-btn" onclick="deckbuilder.loadDeck(${index})">Load</button>
                    <button class="small-btn" onclick="deckbuilder.playWithDeck(${index})">Play</button>
                    <button class="small-btn" onclick="deckbuilder.deleteDeck(${index})">Delete</button>
                </div>
            `;
            savedDecksList.appendChild(deckItem);
        });
    }
    
    document.getElementById('savedDecks').style.display = 'flex';
}

// Load a saved deck
function loadDeck(index) {
    const savedDecks = window.storage.loadDecks();
    const deck = savedDecks[index];
    
    // Check if player owns all cards
    let canLoad = true;
    let missingCard = null;
    const cardCounts = {};
    
    deck.cards.forEach(card => {
        if (!cardCounts[card.name]) cardCounts[card.name] = 0;
        cardCounts[card.name]++;
    });
    
    for (const [cardName, count] of Object.entries(cardCounts)) {
        if (window.storage.getOwnedCount(cardName) < count) {
            canLoad = false;
            missingCard = cardName;
            break;
        }
    }
    
    if (!canLoad) {
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
                <h2 style="color: #f44336; margin-bottom: 20px;">Cannot Load Deck</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">
                    You don't own enough copies of <strong>${missingCard}</strong>!
                </p>
                <button id="cantLoadBtn" style="
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
        
        document.getElementById('cantLoadBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    currentDeck = deck.cards.map(c => new window.Card(c));
    show();
}

// Play with a saved deck
function playWithDeck(index) {
    const savedDecks = window.storage.loadDecks();
    const deck = savedDecks[index];
    
    // Check if player owns all cards
    let canPlay = true;
    let missingCard = null;
    const cardCounts = {};
    
    deck.cards.forEach(card => {
        if (!cardCounts[card.name]) cardCounts[card.name] = 0;
        cardCounts[card.name]++;
    });
    
    for (const [cardName, count] of Object.entries(cardCounts)) {
        if (window.storage.getOwnedCount(cardName) < count) {
            canPlay = false;
            missingCard = cardName;
            break;
        }
    }
    
    if (!canPlay) {
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
                <h2 style="color: #f44336; margin-bottom: 20px;">Cannot Play Deck</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">
                    You don't own enough copies of <strong>${missingCard}</strong>!
                </p>
                <button id="cantPlayBtn" style="
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
        
        document.getElementById('cantPlayBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    const deckCards = deck.cards.map(c => new window.Card(c));
    window.gameManager.startGame(deckCards);
}

// Delete a saved deck
function deleteDeck(index) {
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
                <button id="deleteCancelBtn" style="
                    padding: 12px 30px;
                    background: #6c757d;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                ">Cancel</button>
                <button id="deleteConfirmBtn" style="
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
    
    document.getElementById('deleteCancelBtn').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('deleteConfirmBtn').onclick = () => {
        document.body.removeChild(modal);
        window.storage.deleteDeck(index);
        loadSavedDecks();
    };
}

// Make deckbuilder functions globally available
console.log('🔧 Creating deckbuilder object...');
window.deckbuilder = {
    show: show,
    getCurrentDeck: getCurrentDeck,
    filterCards: filterCards,
    clearDeck: clearDeck,
    saveDeck: saveDeck,
    loadSavedDecks: loadSavedDecks,
    loadDeck: loadDeck,
    playWithDeck: playWithDeck,
    deleteDeck: deleteDeck,
    validateDeckColors: validateDeckColors,
    debugDeck: function() {
        const deck = currentDeck;
        console.log('=== DECK DEBUG ===');
        console.log('Total cards:', deck.length);
        deck.forEach(c => {
            if (c.color !== 'colorless') {
                console.log(`  ${c.name}: color="${c.color}", splashFriendly=${c.splashFriendly}`);
            }
        });
        const validation = validateDeckColors(deck);
        console.log('Validation:', validation);
        return validation;
    }
};
console.log('✅ Deckbuilder module loaded with functions:', Object.keys(window.deckbuilder));
