// Collection Module - Handles card collection viewing with multi-select selling
// v3.0.0: Clean multi-select UI for selling cards

let currentFilter = 'all';
let selectionMode = false;
let selectedCards = []; // Array of {instanceId, cardName, sellPrice}
let marketValues = {}; // Cache of market values

// Show collection
async function show() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('collectionContainer').style.display = 'block';
    
    // Load market values if using server mode (has card instances)
    const hasInstances = window.playerData && window.playerData.cardInstances;
    if (hasInstances) {
        await loadMarketValues();
        
        // Show select cards button in server mode
        const selectBtn = document.getElementById('selectCardsBtn');
        if (selectBtn) {
            selectBtn.style.display = 'inline-block';
        }
    } else {
        // Hide select button in v2 mode
        const selectBtn = document.getElementById('selectCardsBtn');
        if (selectBtn) {
            selectBtn.style.display = 'none';
        }
    }
    
    updateStats();
    filter('all');
}

// Load market values from API
async function loadMarketValues() {
    try {
        const data = await window.apiClient.getMarketValues();
        marketValues = {};
        
        // Convert array to object for easy lookup
        data.market_values.forEach(mv => {
            marketValues[mv.card_name] = mv.current_market_value;
        });
        
        console.log('[Collection] Loaded market values for', Object.keys(marketValues).length, 'cards');
    } catch (error) {
        console.error('[Collection] Failed to load market values:', error);
        marketValues = {};
    }
}

// Toggle selection mode
function toggleSelectionMode() {
    selectionMode = !selectionMode;
    selectedCards = [];
    
    // Update button text
    const btn = document.getElementById('selectCardsBtn');
    if (btn) {
        btn.textContent = selectionMode ? '❌ Cancel Selection' : '☑️ Select Cards to Sell';
        btn.style.background = selectionMode ? '#6c757d' : 'linear-gradient(135deg, #667eea, #764ba2)';
    }
    
    // Hide/show sell button
    updateSellButton();
    
    // Refresh display
    filter(currentFilter);
}

// Update sell button display
function updateSellButton() {
    let sellBtn = document.getElementById('sellSelectedBtn');
    
    if (selectionMode && selectedCards.length > 0) {
        const totalValue = selectedCards.reduce((sum, card) => sum + card.sellPrice, 0);
        
        if (!sellBtn) {
            // Create sell button
            sellBtn = document.createElement('button');
            sellBtn.id = 'sellSelectedBtn';
            sellBtn.style.cssText = 'position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); padding: 15px 40px; background: linear-gradient(135deg, #f44336, #d32f2f); border: none; border-radius: 15px; color: white; font-weight: bold; font-size: 1.1em; cursor: pointer; box-shadow: 0 8px 20px rgba(244, 67, 54, 0.5); z-index: 1000; transition: all 0.3s;';
            sellBtn.onmouseover = function() { this.style.transform = 'translateX(-50%) scale(1.05)'; };
            sellBtn.onmouseout = function() { this.style.transform = 'translateX(-50%) scale(1)'; };
            sellBtn.onclick = confirmSellSelected;
            document.body.appendChild(sellBtn);
        }
        
        sellBtn.textContent = '💰 Sell ' + selectedCards.length + ' Card' + (selectedCards.length > 1 ? 's' : '') + ' for ' + totalValue + 'g';
        sellBtn.style.display = 'block';
    } else if (sellBtn) {
        sellBtn.style.display = 'none';
    }
}

// Toggle card selection
function toggleCardSelection(cardName, instanceId) {
    const index = selectedCards.findIndex(c => c.instanceId === instanceId);
    
    if (index >= 0) {
        // Deselect
        selectedCards.splice(index, 1);
    } else {
        // Select
        const marketValue = marketValues[cardName] || 0;
        const sellPrice = Math.floor(marketValue * 0.25);
        
        selectedCards.push({
            instanceId,
            cardName,
            sellPrice
        });
    }
    
    updateSellButton();
    
    // Update checkbox visual
    const checkbox = document.querySelector('[data-instance="' + instanceId + '"]');
    if (checkbox) {
        checkbox.style.background = index >= 0 ? 'rgba(255,255,255,0.2)' : '#4CAF50';
        checkbox.textContent = index >= 0 ? '' : '✓';
    }
}

// Confirm sell selected cards
function confirmSellSelected() {
    const totalValue = selectedCards.reduce((sum, card) => sum + card.sellPrice, 0);
    const cardsList = selectedCards.map(c => c.cardName).join(', ');
    
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 500px; width: 90%; color: #333; text-align: center;">' +
        '<h2 style="color: #667eea; margin-bottom: 20px;">Sell Cards to Store?</h2>' +
        '<p style="margin-bottom: 15px; font-size: 1.1em; font-weight: bold;">Selling ' + selectedCards.length + ' card' + (selectedCards.length > 1 ? 's' : '') + '</p>' +
        '<p style="margin-bottom: 15px; color: #666; font-size: 0.9em; max-height: 100px; overflow-y: auto;">' + cardsList + '</p>' +
        '<p style="margin-bottom: 25px; line-height: 1.6; color: #666;">You will receive: <strong style="color: #4CAF50; font-size: 1.3em;">' + totalValue + ' gold</strong></p>' +
        '<div style="display: flex; gap: 15px; justify-content: center;">' +
            '<button id="cancelSellBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '<button id="confirmSellBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #f44336, #d32f2f); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);">Sell All</button>' +
        '</div>' +
    '</div>';
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmSellBtn').onclick = async () => {
        modal.remove();
        await executeSellSelected();
    };
    
    document.getElementById('cancelSellBtn').onclick = () => {
        modal.remove();
    };
}

// Execute selling selected cards
async function executeSellSelected() {
    const cardsToSell = [...selectedCards];
    const totalValue = cardsToSell.reduce((sum, card) => sum + card.sellPrice, 0);
    let successCount = 0;
    let errorCount = 0;
    
    // Show progress modal
    const progressModal = document.createElement('div');
    progressModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    progressModal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;">' +
        '<div style="font-size: 60px; margin-bottom: 20px;">⏳</div>' +
        '<h2 style="color: #667eea; margin-bottom: 20px;">Selling Cards...</h2>' +
        '<p id="progressText" style="margin-bottom: 25px;">Processing 0 of ' + cardsToSell.length + '</p>' +
    '</div>';
    
    document.body.appendChild(progressModal);
    
    // Sell cards one by one
    for (let i = 0; i < cardsToSell.length; i++) {
        const card = cardsToSell[i];
        document.getElementById('progressText').textContent = 'Processing ' + (i + 1) + ' of ' + cardsToSell.length;
        
        try {
            await window.apiClient.sellCard(card.instanceId);
            successCount++;
        } catch (error) {
            console.error('[Collection] Failed to sell', card.cardName, error);
            errorCount++;
        }
    }
    
    progressModal.remove();
    
    // Show success modal
    const successModal = document.createElement('div');
    successModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    const icon = errorCount === 0 ? '✅' : successCount > 0 ? '⚠️' : '❌';
    const title = errorCount === 0 ? 'Cards Sold!' : successCount > 0 ? 'Partially Sold' : 'Sale Failed';
    const color = errorCount === 0 ? '#4CAF50' : successCount > 0 ? '#ff9800' : '#f44336';
    
    successModal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;">' +
        '<div style="font-size: 60px; margin-bottom: 20px;">' + icon + '</div>' +
        '<h2 style="color: ' + color + '; margin-bottom: 20px;">' + title + '</h2>' +
        '<p style="margin-bottom: 15px;">Sold <strong>' + successCount + '</strong> card' + (successCount !== 1 ? 's' : '') + '</p>' +
        (errorCount > 0 ? '<p style="margin-bottom: 15px; color: #f44336;">Failed to sell ' + errorCount + ' card' + (errorCount !== 1 ? 's' : '') + '</p>' : '') +
        '<p style="margin-bottom: 25px; color: #4CAF50; font-size: 1.2em; font-weight: bold;">+' + totalValue + ' gold</p>' +
        '<button id="sellDoneBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #4CAF50, #45a049); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);">OK</button>' +
    '</div>';
    
    document.body.appendChild(successModal);
    
    document.getElementById('sellDoneBtn').onclick = async () => {
        successModal.remove();
        
        // CRITICAL: Properly exit selection mode and clean up UI
        selectionMode = false;
        selectedCards = [];
        
        // Remove the sell button from DOM
        const sellBtn = document.getElementById('sellSelectedBtn');
        if (sellBtn) {
            sellBtn.remove();
        }
        
        // Reset the select cards button text and style
        const selectBtn = document.getElementById('selectCardsBtn');
        if (selectBtn) {
            selectBtn.textContent = '☑️ Select Cards to Sell';
            selectBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }
        
        // Refresh player data and collection
        const data = await window.apiClient.getPlayerData();
        window.storage.setPlayerDataFromServer(data);
        window.ui.updateCurrencyDisplay();
        
        // Reload collection (this will show cards without checkboxes)
        await show();
    };
}

// Update collection statistics
function updateStats() {
    const totalOwned = Object.values(window.storage.playerData.ownedCards).reduce((sum, count) => sum + count, 0);
    const uniqueOwned = Object.keys(window.storage.playerData.ownedCards).length;
    const totalUnique = window.ALL_CARDS.length; // 150 total unique cards
    
    document.getElementById('totalCardsOwned').textContent = totalOwned;
    document.getElementById('totalCardsAvailable').textContent = '∞'; // Infinity symbol
    document.getElementById('uniqueCardsOwned').textContent = uniqueOwned + ' / ' + totalUnique;
}

// Filter collection
function filter(filterType) {
    currentFilter = filterType;
    
    // Update filter buttons
    document.querySelectorAll('.collection-container .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const grid = document.getElementById('collectionGrid');
    grid.innerHTML = '';
    
    let cards = window.ALL_CARDS;
    
    if (filterType === 'owned') {
        cards = cards.filter(c => window.storage.getOwnedCount(c.name) > 0);
    } else if (filterType === 'creature' || filterType === 'spell') {
        cards = cards.filter(c => c.type === filterType);
    } else if (['common', 'rare', 'epic', 'legendary'].includes(filterType)) {
        cards = cards.filter(c => c.rarity === filterType);
    } else if (filterType === 'crimson' || filterType === 'azure' || 
               filterType === 'verdant' || filterType === 'umbral' || filterType === 'colorless') {
        // v3.0: Color filters (handle dual-color cards)
        cards = cards.filter(c => c.color && c.color.includes(filterType));
    } else if (filterType === 'splash') {
        // v3.0: Splash filter
        cards = cards.filter(c => c.splashFriendly === true);
    }
    
    cards.forEach(card => {
        const owned = window.storage.getOwnedCount(card.name, card.variant || 'standard');
        const cardEl = createCollectionCard(card, owned);
        grid.appendChild(cardEl);
    });
}

// Create a collection card element
function createCollectionCard(card, owned) {
    const cardEl = document.createElement('div');
    // v3.0: Add color classes and Full Art class if applicable
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
    
    // Build HTML using string concatenation to avoid template literal issues
    let html = '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
    html += '<div class="card-cost">' + card.cost + '</div>';
    html += window.cardDisplayUtils ? window.cardDisplayUtils.buildCardNameHTML(card.name) : '<div class="card-name">' + card.name + '</div>';
    html += '<div class="card-image">' + card.emoji + '</div>';
    
    // v3.0: Use abbreviated text
    const displayText = window.cardDisplayUtils ? 
        window.cardDisplayUtils.getDisplayAbility(card) : 
        (card.ability || 'No ability');
    
    if (card.type === 'creature') {
        html += '<div class="card-description">' + displayText + '</div>';
        html += '<div class="card-stats">';
        html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
        html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
        html += '</div>';
    } else {
        html += '<div class="card-description">' + displayText + '</div>';
    }
    
    if (owned > 0) {
        html += '<div class="owned-badge">' + owned + '</div>';
    }
    
    // Add selection checkbox if in selection mode and card is owned
    const hasInstances = window.playerData && window.playerData.cardInstances;
    
    if (selectionMode && owned > 0 && hasInstances) {
        console.log(`[SELECTION DEBUG] Checking ${card.name}, owned: ${owned}`);
        
        const instances = Object.entries(window.playerData.cardInstances || {})
            .filter(function(entry) { return entry[1].name === card.name; })
            .map(function(entry) { return entry[0]; });
        
        console.log(`[SELECTION DEBUG] Found ${instances.length} instances for ${card.name}`);
        
        if (instances.length > 0) {
            const instanceId = instances[0];
            const isSelected = selectedCards.some(function(c) { return c.instanceId === instanceId; });
            
            html += '<div class="selection-checkbox" data-instance="' + instanceId + '" onclick="event.stopPropagation(); collection.toggleCardSelection(\'' + card.name.replace(/'/g, "\\'") + '\', \'' + instanceId + '\');" style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-radius: 50%; background: ' + (isSelected ? '#4CAF50' : 'rgba(255,255,255,0.2)') + '; border: 2px solid white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 1.2em; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">' + (isSelected ? '✓' : '') + '</div>';
        }
    }
    
    cardEl.innerHTML = html;
    
    return cardEl;
}

// Make collection functions globally available
window.collection = {
    show: show,
    filter: filter,
    toggleSelectionMode: toggleSelectionMode,
    toggleCardSelection: toggleCardSelection
};

console.log('✅ Collection module loaded (multi-select)');
