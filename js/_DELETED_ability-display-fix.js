// Fix for abilities not displaying in game
// This script ensures abilities are properly shown on cards

(function() {
    console.log('🔧 Applying ability display fix...');
    
    // Wait for game to be ready
    const checkGameReady = setInterval(() => {
        if (window.Game && window.Card && window.ALL_CARDS) {
            clearInterval(checkGameReady);
            applyFix();
        }
    }, 100);
    
    function applyFix() {
        // Override the createCardElement method in Game.js to ensure abilities display
        const originalProto = window.Game.prototype;
        const originalCreateCard = originalProto.createCardElement;
        
        originalProto.createCardElement = function(card, isPlayerCard, onField = false) {
            // Ensure card has ability property
            if (!card.hasOwnProperty('ability')) {
                console.warn(`Card ${card.name} missing ability property!`);
                card.ability = '';
            }
            
            const cardEl = document.createElement('div');
            cardEl.className = `card ${card.type} ${card.rarity}`;
            
            if (onField) {
                cardEl.style.position = 'relative';
                cardEl.style.zIndex = '10';
                cardEl.style.pointerEvents = 'auto';
            }
            
            // CRITICAL FIX: Ensure ability is displayed
            let abilityText = card.ability || '';
            if (!abilityText && card.type === 'creature') {
                abilityText = 'No ability';
            }
            
            // Build card HTML with ability clearly shown
            cardEl.innerHTML = `
                <div class="card-info-btn" onclick="showCardInfo(event, ${JSON.stringify(card).replace(/"/g, '&quot;')})">i</div>
                <div class="card-cost">${card.cost}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-image">${card.emoji}</div>
                ${card.type === 'creature' ? `
                    <div class="card-description" style="color: #ffd700; font-weight: bold;">${abilityText}</div>
                    <div class="card-stats">
                        <span class="attack-stat">⚔️ ${card.attack}</span>
                        <span class="health-stat">❤️ ${card.health}</span>
                    </div>
                ` : `<div class="card-description" style="color: #ffd700; font-weight: bold;">${abilityText}</div>`}
            `;
            
            // Add click handler
            cardEl.onclick = (e) => {
                e.stopPropagation();
                if (!e.target.classList.contains('card-info-btn')) {
                    this.handleCardClick(card, isPlayerCard);
                }
            };
            
            return cardEl;
        }.bind(originalProto);
        
        console.log('✅ Ability display fix applied');
        
        // Test: Check if cards in ALL_CARDS have abilities
        let cardsWithAbilities = 0;
        let cardsWithoutAbilities = 0;
        
        window.ALL_CARDS.forEach(card => {
            if (card.ability && card.ability !== '') {
                cardsWithAbilities++;
            } else {
                cardsWithoutAbilities++;
            }
        });
        
        console.log(`📊 Card ability check:
        - Cards with abilities: ${cardsWithAbilities}
        - Cards without abilities: ${cardsWithoutAbilities}
        - Total cards: ${window.ALL_CARDS.length}`);
        
        // Sample some cards to verify abilities
        const testCards = ['Goblin Scout', 'Fire Sprite', 'Shield Bearer', 'Lightning Bolt', 'Phoenix'];
        testCards.forEach(cardName => {
            const card = window.ALL_CARDS.find(c => c.name === cardName);
            if (card) {
                console.log(`🃏 ${cardName}: ability = "${card.ability}"`);
            }
        });
    }
})();
