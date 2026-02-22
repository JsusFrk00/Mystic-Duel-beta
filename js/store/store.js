// Store Module - Handles card store functionality
// v3.0.0: Uses server API for all purchases

let currentPackCards = [];
let currentTab = 'packs';

// Show a store modal (replaces alert())
function showStoreModal(type, message) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10000;';
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const color = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;';
    
    modalContent.innerHTML = '<div style="font-size: 60px; margin-bottom: 20px;">' + icon + '</div>' +
        '<h2 style="color: ' + color + '; margin-bottom: 20px;">' + (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice') + '</h2>' +
        '<p style="margin-bottom: 25px; line-height: 1.6; font-size: 1.1em;">' + message + '</p>' +
        '<button id="storeModalBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button>';
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    document.getElementById('storeModalBtn').onclick = function() {
        document.body.removeChild(modal);
    };
}

// Show store
function show() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('storeContainer').style.display = 'block';
    window.ui.updateCurrencyDisplay();
    refreshIfNeeded();
    showTab('packs');
}

// Refresh store if needed
function refreshIfNeeded() {
    if (window.storage.needsStoreRefresh()) {
        window.storage.refreshStore();
    }
}

// Show store tab
function showTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.store-tab').forEach(function(btn) {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        const tabIndex = tab === 'packs' ? 1 : tab === 'singles' ? 2 : tab === 'used' ? 3 : 4;
        const tabBtn = document.querySelector('.store-tab:nth-child(' + tabIndex + ')');
        if (tabBtn) tabBtn.classList.add('active');
    }
    
    const content = document.getElementById('storeContent');
    
    if (tab === 'packs') {
        showPacksTab(content);
    } else if (tab === 'singles') {
        showSinglesTab(content);
    } else if (tab === 'used') {
        showUsedCardsTab(content);
    } else if (tab === 'deals') {
        showDealsTab(content);
    }
}

// Show packs tab
function showPacksTab(content) {
    content.innerHTML = '<div class="packs-grid">' +
        '<div class="pack-card" onclick="store.buyPack(\'basic\')">' +
            '<div class="pack-icon">📦</div>' +
            '<div class="pack-name">Basic Pack</div>' +
            '<div class="pack-description">5 cards - Mostly common</div>' +
            '<div class="pack-price">🪙 100</div>' +
        '</div>' +
        '<div class="pack-card rare-pack" onclick="store.buyPack(\'rare\')">' +
            '<div class="pack-icon">📦</div>' +
            '<div class="pack-name">Rare Pack</div>' +
            '<div class="pack-description">5 cards - Better odds!</div>' +
            '<div class="pack-price">🪙 300</div>' +
        '</div>' +
        '<div class="pack-card epic-pack" onclick="store.buyPack(\'epic\')">' +
            '<div class="pack-icon">📦</div>' +
            '<div class="pack-name">Epic Pack</div>' +
            '<div class="pack-description">5 cards - Epic guaranteed!</div>' +
            '<div class="pack-price">💎 5</div>' +
        '</div>' +
        '<div class="pack-card legendary-pack" onclick="store.buyPack(\'legendary\')">' +
            '<div class="pack-icon">📦</div>' +
            '<div class="pack-name">Legendary Pack</div>' +
            '<div class="pack-description">5 cards - Amazing odds!</div>' +
            '<div class="pack-price">💎 10</div>' +
        '</div>' +
    '</div>';
}

// Show singles tab
function showSinglesTab(content) {
    const hoursLeft = window.storage.getTimeUntilStoreRefresh();
    
    content.innerHTML = '<div class="store-refresh-info">' +
        '<div>Today\'s Selection - 20 Cards Available</div>' +
        '<div class="refresh-timer">Next refresh in ' + hoursLeft + ' hours</div>' +
    '</div>' +
    '<div class="singles-grid" id="singlesGrid"></div>';
    
    const grid = document.getElementById('singlesGrid');
    
    // Check if store needs refresh or if currentStoreCards is empty
    if (window.storage.needsStoreRefresh() || 
        !window.storage.playerData.currentStoreCards || 
        window.storage.playerData.currentStoreCards.length === 0) {
        console.log('[Store] Refreshing store rotation...');
        window.storage.refreshStore();
    }
    
    // Show only the cards in the current store rotation
    window.storage.playerData.currentStoreCards.forEach(function(cardName) {
        const card = window.ALL_CARDS.find(function(c) { return c.name === cardName; });
        if (!card) return;
        
        const owned = window.storage.getOwnedCount(card.name);
        const price = window.CARD_PRICES[card.rarity];
        
        const cardEl = document.createElement('div');
        cardEl.className = 'shop-card';
        
        // v3.0: Hide stat emojis if name OR ability is long
        const hasLongText = card.type === 'creature' && (
            (card.ability && card.ability.length > 10) || 
            (card.name && card.name.length > 12)
        );
        
        // v3.0: Add color classes
        let html = `<div class="card ${card.type} ${card.rarity} ${card.color || 'colorless'}" data-color="${card.color || 'colorless'}" data-rarity="${card.rarity}">`;
        html += '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
        html += '<div class="card-cost">' + card.cost + '</div>';
        html += window.cardDisplayUtils ? window.cardDisplayUtils.buildCardNameHTML(card.name) : '<div class="card-name">' + card.name + '</div>';
        html += '<div class="card-image">' + card.emoji + '</div>';
        
        // v3.0: Use abbreviated text
        const displayText = window.cardDisplayUtils ? window.cardDisplayUtils.getDisplayAbility(card) : (card.ability || 'No ability');
        
        if (card.type === 'creature') {
            html += '<div class="card-description">' + displayText + '</div>';
            html += '<div class="card-stats">';
            html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
            html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
            html += '</div>';
        } else {
            html += '<div class="card-description">' + displayText + '</div>';
        }
        
        // v3.0: No card limits! Just show owned count
        if (owned > 0) {
            html += '<div class="owned-badge">' + owned + '</div>';
        }
        
        html += '<div class="card-price" onclick="store.buyCard(\'' + card.name + '\', ' + price + ')">🪙 ' + price + '</div>';
        html += '</div>';
        
        cardEl.innerHTML = html;
        grid.appendChild(cardEl);
    });
}

// Show used cards tab
async function showUsedCardsTab(content) {
    // Only show in v3 mode
    if (!window.isV3Mode) {
        content.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: white;">' +
            '<h3 style="font-size: 28px; margin-bottom: 20px;">🏷️ Used Cards Market</h3>' +
            '<p>Used cards are only available in Secure Server mode.</p>' +
            '<p>Click Multiplayer in the main menu to enable server mode!</p>' +
        '</div>';
        return;
    }
    
    try {
        const data = await window.apiClient.getUsedCards();
        const usedCards = data.used_cards || [];

        if (usedCards.length === 0) {
            content.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: white;">' +
                '<h3 style="font-size: 28px; margin-bottom: 20px;">🏪 No Used Cards Available</h3>' +
                '<p>Cards sold to the store will appear here at discounted prices!</p>' +
            '</div>';
            return;
        }

        // 20% smaller: 200px -> 160px, gaps 20px -> 16px
        let html = '<div style="padding: 20px;"><h2 style="color: white; margin-bottom: 20px;">🏷️ Used Cards Market</h2>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">';

        usedCards.forEach(function(cardGroup) {
            const cardData = (window.ALL_CARDS || []).find(function(c) { return c.name === cardGroup.card_name; });
            const emoji = cardData ? cardData.emoji : '🃏';
            const rarity = cardData ? cardData.rarity : 'common';

            // 20% smaller padding: 20px -> 16px
            html += '<div style="background: white; border-radius: 10px; padding: 16px; text-align: center; position: relative;">';
            
            // USED badge - smaller
            html += '<div style="position: absolute; top: 8px; right: 8px; background: #ff9800; color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.7em; font-weight: bold;">USED</div>';
            
            // Quantity badge (if multiple available) - smaller
            if (cardGroup.quantity > 1) {
                html += '<div style="position: absolute; top: 8px; left: 8px; background: #2196F3; color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.7em; font-weight: bold;">x' + cardGroup.quantity + '</div>';
            }
            
            // Emoji 20% smaller: 48px -> 38px, margins 20px -> 16px
            html += '<div style="font-size: 38px; margin: 16px 0;">' + emoji + '</div>';
            html += '<h3 style="margin: 8px 0; color: #333; font-size: 0.95em;">' + cardGroup.card_name + '</h3>';
            html += '<p style="color: #666; font-size: 0.75em; text-transform: capitalize; margin: 3px 0;">' + rarity + '</p>';
            
            // Price info - smaller margins and padding
            html += '<div style="margin: 12px 0; padding: 8px; background: #f8f9fa; border-radius: 6px;">';
            html += '<p style="margin: 0; color: #999; font-size: 0.75em; text-decoration: line-through;">' + cardGroup.base_list_price + 'g</p>';
            html += '<p style="margin: 3px 0; color: #4CAF50; font-size: 1.1em; font-weight: bold;">' + cardGroup.current_price + 'g</p>';
            
            if (cardGroup.depreciation !== '0%') {
                html += '<p style="margin: 0; color: #f44336; font-size: 0.7em; font-weight: bold;">' + cardGroup.depreciation + ' OFF!</p>';
            }
            html += '</div>';
            
            // Days listed - smaller
            html += '<p style="color: #666; font-size: 0.7em; margin: 6px 0;">Listed ' + cardGroup.days_listed + ' days ago</p>';
            
            // Buy button - FIXED quote escaping!
            const safeName = cardGroup.card_name.replace(/'/g, "\\'");
            const safeVariant = (cardGroup.art_variant || 'standard').replace(/'/g, "\\'");
            html += '<button onclick="store.buyUsedCard(\'' + safeName + '\', \'' + safeVariant + '\', ' + cardGroup.current_price + ')" ';
            html += 'style="width: 100%; padding: 10px; margin-top: 8px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; font-size: 0.9em;">Buy Now</button>';
            
            html += '</div>';
        });

        html += '</div></div>';
        content.innerHTML = html;

    } catch (error) {
        console.error('Error loading used cards:', error);
        content.innerHTML = '<div style="text-align: center; padding: 40px; color: white;"><p>Error loading used cards</p></div>';
    }
}

// Buy a used card
async function buyUsedCard(cardName, artVariant, price) {
    try {
        const playerData = window.playerData || window.storage.playerData;
        
        if (playerData.gold < price) {
            showStoreModal('error', 'Not enough gold!');
            return;
        }

        const result = await window.apiClient.buyUsedCard(cardName, artVariant);

        if (result.success) {
            // Update local data
            const data = await window.apiClient.getPlayerData();
            window.storage.setPlayerDataFromServer(data);
            window.ui.updateCurrencyDisplay();

            // Show success and refresh
            showStoreModal('success', 'Purchased used ' + cardName + ' for ' + price + 'g!');
            showTab('used'); // Refresh used cards tab
        }
    } catch (error) {
        showStoreModal('error', 'Purchase failed: ' + error.message);
    }
}

// Show deals tab
function showDealsTab(content) {
    content.innerHTML = '<div class="packs-grid">' +
        '<div class="pack-card legendary-pack" onclick="store.buyStarterBundle()">' +
            '<div class="pack-icon">🎁</div>' +
            '<div class="pack-name">Starter Bundle</div>' +
            '<div class="pack-description">3 Packs + 500 Gold!</div>' +
            '<div class="pack-price">💎 15</div>' +
        '</div>' +
    '</div>';
}

// Buy a pack
async function buyPack(packType) {
    // v3.0.0: Use server API
    if (window.isV3Mode) {
        try {
            console.log('[V3] Buying pack via API:', packType);
            
            const result = await window.apiClient.buyPack(packType);
            
            // Update local data from server response
            window.playerData.gold = result.newGold;
            window.playerData.gems = result.newGems;
            
            // Add cards to local collection display
            result.cards.forEach(function(card) {
                if (!window.playerData.ownedCards[card.name]) {
                    window.playerData.ownedCards[card.name] = 0;
                }
                window.playerData.ownedCards[card.name]++;
            });
            
            // Apply Full Art upgrade for legendary packs (5% chance)
            let cards = result.cards;
            if (packType === 'legendary') {
                cards = applyFullArtUpgrade(cards);
            }
            
            // Show pack opening with server-generated cards
            showPackOpening(cards);
            window.ui.updateCurrencyDisplay();
            
            console.log('[V3] Pack purchased successfully!');
        } catch (error) {
            showStoreModal('error', error.message || 'Purchase failed. Please check your connection.');
            console.error('[V3] Pack purchase failed:', error);
        }
        return;
    }
    
    // v2.1: Local purchase (localStorage)
    const pack = window.PACK_PRICES[packType];
    
    if (pack.gold && !window.storage.spendGold(pack.gold)) {
        showStoreModal('error', 'Not enough gold!');
        return;
    }
    
    if (pack.gems && !window.storage.spendGems(pack.gems)) {
        showStoreModal('error', 'Not enough gems!');
        return;
    }
    
    // Generate cards client-side
    let cards = [];
    for (let i = 0; i < pack.cards; i++) {
        const rarity = getRandomRarity(pack.rates);
        const possibleCards = window.ALL_CARDS.filter(function(c) { return c.rarity === rarity && !c.fullArt; });
        const card = possibleCards[Math.floor(Math.random() * possibleCards.length)];
        cards.push(card);
    }
    
    // Apply Full Art upgrade for legendary packs (5% chance)
    if (packType === 'legendary') {
        cards = applyFullArtUpgrade(cards);
    }
    
    // Show pack opening animation
    showPackOpening(cards);
    window.ui.updateCurrencyDisplay();
}

// Get random rarity based on rates
function getRandomRarity(rates) {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const rarity in rates) {
        cumulative += rates[rarity];
        if (rand < cumulative) return rarity;
    }
    
    return 'common';
}

// Apply Full Art upgrade (5% chance per card)
function applyFullArtUpgrade(cards) {
    return cards.map(function(card) {
        // 5% chance to upgrade to Full Art if variant exists
        if (Math.random() < 0.05) {
            const fullArtVersion = window.ALL_CARDS.find(function(c) {
                return c.name === card.name && c.fullArt === true;
            });
            if (fullArtVersion) {
                console.log('[✨ Full Art] Upgraded', card.name, 'to Full Art!');
                return fullArtVersion;
            }
        }
        return card;
    });
}

// Show pack opening animation
function showPackOpening(cards) {
    currentPackCards = cards;
    document.getElementById('packOpening').style.display = 'flex';
    document.getElementById('revealedCards').innerHTML = '';
    document.getElementById('openPackBtn').style.display = 'block';
    document.getElementById('closePackBtn').style.display = 'none';
}

// Open pack animation
function openPack() {
    document.getElementById('openPackBtn').style.display = 'none';
    const revealedCards = document.getElementById('revealedCards');
    
    currentPackCards.forEach(function(card, index) {
        setTimeout(function() {
            // v3.0: Hide stat emojis if name OR ability is long
            const hasLongText = card.type === 'creature' && (
                (card.ability && card.ability.length > 10) || 
                (card.name && card.name.length > 12)
            );
            
            const cardEl = document.createElement('div');
            // v3.0: Add color classes and Full Art class if applicable
            let classes = `card ${card.type} ${card.rarity} ${card.color || 'colorless'} revealed-card`;
            if (card.fullArt) {
                classes += ' full-art';
                console.log('[✨ Pack Opening] Revealing Full Art:', card.name);
            }
            cardEl.className = classes;
            cardEl.setAttribute('data-color', card.color || 'colorless');
            cardEl.setAttribute('data-rarity', card.rarity);
            
            let html = '<div class="card-cost">' + card.cost + '</div>';
            html += window.cardDisplayUtils ? window.cardDisplayUtils.buildCardNameHTML(card.name) : '<div class="card-name">' + card.name + '</div>';
            html += '<div class="card-image">' + card.emoji + '</div>';
            
            // v3.0: Use abbreviated text
            const displayText = window.cardDisplayUtils ? window.cardDisplayUtils.getDisplayAbility(card) : (card.ability || 'No ability');
            
            if (card.type === 'creature') {
                html += '<div class="card-description">' + displayText + '</div>';
                html += '<div class="card-stats">';
                html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
                html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
                html += '</div>';
            } else {
                html += '<div class="card-description">' + displayText + '</div>';
            }
            
            cardEl.innerHTML = html;
            revealedCards.appendChild(cardEl);
            
            // In v2.1, add to collection; in v3, already added by server
            if (!window.isV3Mode) {
                window.storage.addCard(card.name);
            }
        }, index * 300);
    });
    
    setTimeout(function() {
        document.getElementById('closePackBtn').style.display = 'block';
        document.getElementById('packAnimation').style.display = 'none';
    }, currentPackCards.length * 300);
}

// Close pack opening
function closePack() {
    document.getElementById('packOpening').style.display = 'none';
    document.getElementById('packAnimation').style.display = 'block';
    window.ui.updateCurrencyDisplay();
}

// Buy single card
async function buyCard(cardName, price) {
    event.stopPropagation();
    
    // v3.0.0: Use server API
    if (window.isV3Mode) {
        try {
            console.log('[V3] Buying card via API:', cardName);
            
            const result = await window.apiClient.buyCard(cardName, price);
            
            // Update local data from server response
            window.playerData.gold = result.newGold;
            
            // Add card to local collection display
            if (!window.playerData.ownedCards[cardName]) {
                window.playerData.ownedCards[cardName] = 0;
            }
            window.playerData.ownedCards[cardName]++;
            
            // Update UI
            window.ui.updateCurrencyDisplay();
            showSinglesTab(document.getElementById('storeContent'));
            
            // Show success modal
            showStoreModal('success', 'Purchased ' + cardName + '!');
            console.log('[V3] Card purchased successfully!');
        } catch (error) {
            showStoreModal('error', error.message || 'Purchase failed.');
            console.error('[V3] Card purchase failed:', error);
        }
        return;
    }
    
    // v2.1: Local purchase (localStorage)
    const card = window.ALL_CARDS.find(function(c) { return c.name === cardName; });
    
    if (!window.storage.spendGold(price)) {
        showStoreModal('error', 'Not enough gold!');
        return;
    }
    
    window.storage.addCard(cardName);
    window.ui.updateCurrencyDisplay();
    showSinglesTab(document.getElementById('storeContent')); // Refresh the store
    
    showStoreModal('success', 'Purchased ' + cardName + '!');
}

// Buy starter bundle
async function buyStarterBundle() {
    // v3.0.0: Use server API
    if (window.isV3Mode) {
        try {
            console.log('[V3] Buying starter bundle via API');
            
            const result = await window.apiClient.buyStarterBundle();
            
            // Update local data from server response
            window.playerData.gold = result.newGold;
            window.playerData.gems = result.newGems;
            
            // Add cards to local collection display
            result.cards.forEach(function(card) {
                if (!window.playerData.ownedCards[card.name]) {
                    window.playerData.ownedCards[card.name] = 0;
                }
                window.playerData.ownedCards[card.name]++;
            });
            
            // Apply Full Art upgrade (5% chance per card)
            const cards = applyFullArtUpgrade(result.cards);
            
            // Show pack opening with all 15 cards
            showPackOpening(cards);
            window.ui.updateCurrencyDisplay();
            
            console.log('[V3] Starter bundle purchased! Gold bonus:', result.goldBonus);
        } catch (error) {
            showStoreModal('error', error.message || 'Purchase failed.');
            console.error('[V3] Starter bundle purchase failed:', error);
        }
        return;
    }
    
    // v2.1: Local purchase (localStorage)
    if (!window.storage.spendGems(15)) {
        showStoreModal('error', 'Not enough gems!');
        return;
    }
    
    window.storage.playerData.gold += 500;
    window.storage.savePlayerData();
    
    // Give 3 rare packs worth of cards
    let allCards = [];
    for (let p = 0; p < 3; p++) {
        for (let i = 0; i < 5; i++) {
            const rarity = getRandomRarity(window.PACK_PRICES.rare.rates);
            const possibleCards = window.ALL_CARDS.filter(function(c) { return c.rarity === rarity && !c.fullArt; });
            const card = possibleCards[Math.floor(Math.random() * possibleCards.length)];
            allCards.push(card);
        }
    }
    
    // Apply Full Art upgrade (5% chance per card)
    allCards = applyFullArtUpgrade(allCards);
    
    showPackOpening(allCards);
    window.ui.updateCurrencyDisplay();
}

// Make store functions globally available
window.store = {
    show: show,
    refreshIfNeeded: refreshIfNeeded,
    showTab: showTab,
    buyPack: buyPack,
    openPack: openPack,
    closePack: closePack,
    buyCard: buyCard,
    buyStarterBundle: buyStarterBundle,
    buyUsedCard: buyUsedCard
};

console.log('✅ Store module loaded');
