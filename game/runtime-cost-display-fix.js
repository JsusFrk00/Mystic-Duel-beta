// ========================================================================
// FORCEFUL COST DISPLAY FIX - Complete Function Replacement
// ========================================================================
// Completely replaces createCardElement to show reduced costs
// This is a nuclear option but should guarantee it works

console.log('💥 Applying FORCEFUL Cost Display Fix...');

setTimeout(function() {
    if (typeof window.Game === 'undefined' || !window.Game.prototype) {
        console.error('❌ Game class not found!');
        return;
    }
    
    // COMPLETELY REPLACE createCardElement
    window.Game.prototype.createCardElement = function(card, isPlayerCard, onField) {
        onField = onField || false;
        
        const cardEl = document.createElement('div');
        let classes = 'card ' + card.type + ' ' + card.rarity + ' ' + (card.color || 'colorless');
        if (card.fullArt) classes += ' full-art';
        if (card.splashFriendly) classes += ' splash-friendly';
        cardEl.className = classes;
        cardEl.setAttribute('data-color', card.color || 'colorless');
        cardEl.setAttribute('data-rarity', card.rarity);
        
        if (onField) {
            cardEl.style.position = 'relative';
            cardEl.style.zIndex = '10';
            cardEl.style.pointerEvents = 'auto';
        }
        
        // Abbreviate ability text
        let displayText = this.abbreviateAbility ? this.abbreviateAbility(card.ability || '', card.type) : (card.ability || '');
        
        // Add splash indicator
        if (card.splashFriendly && displayText) {
            if (card.type === 'spell' && displayText.length < 15) {
                displayText = displayText + ' [Splash]';
            } else if (card.type === 'creature' && displayText !== 'See Text') {
                displayText = displayText + ' [S]';
            }
        }
        
        const hasLongText = card.type === 'creature' && ((card.ability && card.ability.length > 10) || (card.name && card.name.length > 12));
        const nameLen = card.name.length;
        const nameSize = nameLen <= 12 ? 'short' : nameLen <= 15 ? 'medium' : nameLen <= 18 ? 'long' : 'very-long';
        
        // BUILD HTML - KEY FIX HERE
        let html = '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
        
        // ✅ CRITICAL FIX: Use calculateActualCost for hand cards
        let displayCost = card.cost;
        if (!onField && isPlayerCard && this.calculateActualCost) {
            displayCost = this.calculateActualCost(card, 'player');
            if (displayCost !== card.cost) {
                console.log(`[FORCEFUL COST FIX] ${card.name}: ${card.cost} → ${displayCost}`);
            }
        }
        
        html += '<div class="card-cost">' + displayCost + '</div>';
        html += '<div class="card-name" data-name-length="' + nameSize + '">' + card.name + '</div>';
        html += '<div class="card-image">' + card.emoji + '</div>';
        
        if (card.type === 'creature') {
            html += '<div class="card-description">' + displayText + '</div>';
            html += '<div class="card-stats">';
            html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
            html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
            html += '</div>';
        } else {
            html += '<div class="card-description spell-desc">' + displayText + '</div>';
        }
        
        cardEl.innerHTML = html;
        
        // Handle click for hand cards
        if (!onField) {
            cardEl.onclick = function() {
                if (this.game && this.game.playCard) {
                    this.game.playCard(card, isPlayerCard ? 'player' : 'ai');
                } else if (window.game && window.game.playCard) {
                    window.game.playCard(card, isPlayerCard ? 'player' : 'ai');
                }
            }.bind(this);
        }
        
        // Handle click for field creatures (combat)
        if (onField && this.playerField && this.playerField.includes(card)) {
            cardEl.onclick = function() {
                if (window.game && window.game.selectAttacker) {
                    window.game.selectAttacker(card);
                }
            };
        }
        
        return cardEl;
    };
    
    console.log('✅ FORCEFUL Cost Display Fix applied successfully!');
    console.log('   💥 Completely replaced createCardElement function');
    console.log('   💰 Hand cards WILL show reduced costs');
    console.log('   🌈 The Nexus cost reduction WILL display');
    
}, 100); // Tiny delay to ensure everything else loaded first
