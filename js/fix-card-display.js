// Fix for card display and randomization issues
console.log('[FIX] Loading card display fixes...');

// Store original startGame function
const originalStartGame = window.gameManager ? window.gameManager.startGame : null;

// Override the startGame function to ensure proper Card instances
if (window.gameManager) {
    window.gameManager.startGame = function(playerDeckCards) {
        console.log('[FIX] Starting game with proper Card instances...');
        
        // Ensure all cards in the deck are proper Card instances
        const fixedDeck = playerDeckCards.map(card => {
            if (card instanceof window.Card) {
                return card;
            } else {
                // Create a new Card instance, ensuring ability is preserved
                const newCard = new window.Card({
                    name: card.name,
                    cost: card.cost,
                    type: card.type,
                    attack: card.attack,
                    health: card.health,
                    ability: card.ability || "",  // Ensure ability is never undefined
                    emoji: card.emoji,
                    rarity: card.rarity
                });
                
                // Debug log for ability tracking
                if (card.ability) {
                    console.log(`[FIX] Card ${card.name} has ability: "${card.ability}"`);
                }
                
                return newCard;
            }
        });
        
        // Hide menus and show game
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('deckbuilder').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'flex';
        document.getElementById('gameLog').style.display = 'block';
        document.getElementById('gameLog').innerHTML = '';
        
        // Create game with fixed deck
        window.game = new window.Game(fixedDeck);
    };
}

// Fix for the createDynamicAIDeck function to ensure better randomization
if (window.Game) {
    const originalCreateDynamicAIDeck = window.Game.prototype.createDynamicAIDeck;
    
    window.Game.prototype.createDynamicAIDeck = function(targetPower) {
        console.log('[FIX] Creating AI deck with improved randomization...');
        
        // Add extra randomization by using timestamp
        const seed = Date.now();
        const randomOffset = (seed % 100) / 100;
        
        // Call original function
        const aiDeck = originalCreateDynamicAIDeck.call(this, targetPower);
        
        // Extra shuffle with better randomization
        for (let i = aiDeck.length - 1; i > 0; i--) {
            const j = Math.floor((Math.random() + randomOffset) * (i + 1)) % (i + 1);
            [aiDeck[i], aiDeck[j]] = [aiDeck[j], aiDeck[i]];
        }
        
        return aiDeck;
    };
}

// Fix for shuffleDeck to ensure better randomization
if (window.Game) {
    const originalShuffleDeck = window.Game.prototype.shuffleDeck;
    
    window.Game.prototype.shuffleDeck = function(deck) {
        console.log('[FIX] Shuffling deck with improved randomization...');
        
        // Use Fisher-Yates with timestamp seed for better randomization
        const seed = Date.now();
        const randomOffset = (seed % 1000) / 1000;
        
        for (let i = deck.length - 1; i > 0; i--) {
            // Use both Math.random and seed offset for better randomization
            const randomValue = (Math.random() + randomOffset) % 1;
            const j = Math.floor(randomValue * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        // Extra shuffle pass for good measure
        for (let i = 0; i < deck.length / 2; i++) {
            const idx1 = Math.floor(Math.random() * deck.length);
            const idx2 = Math.floor(Math.random() * deck.length);
            [deck[idx1], deck[idx2]] = [deck[idx2], deck[idx1]];
        }
    };
}

// Fix createCardElement to properly display abilities
if (window.Game) {
    window.Game.prototype.createCardElement = function(card, isPlayerCard, onField = false) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.type} ${card.rarity}`;
        
        // Ensure cards have proper styling and z-index when on field
        if (onField) {
            cardEl.style.position = 'relative';
            cardEl.style.zIndex = '10';
            cardEl.style.pointerEvents = 'auto';
        }
        
        // Get ability text - ensure it's never null/undefined
        let abilityText = '';
        if (card.ability && card.ability.length > 0) {
            abilityText = card.ability;
        } else if (card.type === 'creature') {
            abilityText = 'No ability';
        }
        
        // Check if creature has long ability (same logic as deckbuilder)
        const hasLongAbility = card.type === 'creature' && card.ability && card.ability.length > 10;
        
        // Debug log
        if (card.name === "Fire Drake" || card.name === "Lightning Bolt") {
            console.log(`[FIX] Rendering ${card.name}: ability = "${card.ability}", displayed = "${abilityText}"`);
        }
        
        cardEl.innerHTML = `
            <div class="card-info-btn" onclick="showCardInfo(event, ${JSON.stringify(card).replace(/"/g, '&quot;')})">i</div>
            <div class="card-cost">${card.cost}</div>
            <div class="card-name">${card.name}</div>
            <div class="card-image">${card.emoji}</div>
            ${card.type === 'creature' ? `
                <div class="card-description">${abilityText}</div>
                <div class="card-stats">
                    <span class="attack-stat">${hasLongAbility ? '' : '⚔️ '}${card.attack}</span>
                    <span class="health-stat">${hasLongAbility ? '' : '❤️ '}${card.health || card.currentHealth || 0}</span>
                </div>
            ` : `<div class="card-description">${abilityText}</div>`}
        `;
        
        cardEl.onclick = (e) => {
            e.stopPropagation();
            if (!e.target.classList.contains('card-info-btn')) {
                this.handleCardClick(card, isPlayerCard);
            }
        };
        
        return cardEl;
    };
}

console.log('[FIX] Card display fixes loaded successfully!');

// Wait a bit then check if abilities are loading correctly
setTimeout(() => {
    console.log('[FIX] Checking ability data...');
    console.log('ALL_CARDS loaded:', window.ALL_CARDS ? window.ALL_CARDS.length : 0);
    console.log('ABILITY_DESCRIPTIONS loaded:', window.ABILITY_DESCRIPTIONS ? Object.keys(window.ABILITY_DESCRIPTIONS).length : 0);
    
    // Sample check
    if (window.ALL_CARDS && window.ALL_CARDS.length > 0) {
        const sampleCards = window.ALL_CARDS.slice(0, 5);
        sampleCards.forEach(card => {
            console.log(`[FIX] ${card.name}: ability = "${card.ability}"`);
        });
    }
}, 1000);
