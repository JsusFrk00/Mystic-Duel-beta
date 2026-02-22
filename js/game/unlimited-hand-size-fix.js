// ========================================================================
// UNLIMITED HAND SIZE FIX
// ========================================================================
// Implements unlimited hand size for Azure Infinity and Dream Weaver
// Also adds Azure Infinity's "reduce cost on draw" effect
// Patches all hand size limit checks throughout the codebase
// MUST load AFTER Game.js and v3-abilities-complete.js

console.log('📚 Loading Unlimited Hand Size Fix...');

// ========================================================================
// HELPER: Get Max Hand Size
// ========================================================================
Game.prototype.getMaxHandSize = function(player) {
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // Check if player has a creature with unlimited hand size
    const hasUnlimited = field.some(c => 
        c.ability && (
            c.ability.includes('Your hand size is unlimited') ||
            c.ability.includes('Your maximum hand size is unlimited')
        )
    );
    
    if (hasUnlimited) {
        console.log(`[HAND SIZE] ${player} has unlimited hand size!`);
        return 999; // Effectively unlimited
    }
    
    return 10; // Normal limit
};

// ========================================================================
// HELPER: Update Hand UI Class (for large hands)
// ========================================================================
Game.prototype.updateHandUIClass = function() {
    const playerHandEl = document.getElementById('playerHand');
    if (playerHandEl) {
        // Add 'large-hand' class if hand has 12+ cards (triggers expanded view)
        if (this.playerHand.length >= 12) {
            playerHandEl.classList.add('large-hand');
        } else {
            playerHandEl.classList.remove('large-hand');
        }
    }
};

// ========================================================================
// FIX 1: Patch drawCard() to respect unlimited hand size
// ========================================================================
const _originalDrawCard = Game.prototype.drawCard;
Game.prototype.drawCard = function(player) {
    const deck = player === 'player' ? this.playerDeck : this.aiDeck;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const maxHandSize = this.getMaxHandSize(player);
    
    // Use dynamic max hand size instead of hardcoded 10
    if (deck.length > 0 && hand.length < maxHandSize) {
        const card = deck.pop();
        
        // Ensure proper Card instance
        if (!(card instanceof window.Card)) {
            console.warn('Card drawn is not a Card instance, creating new Card');
            const newCard = new window.Card(card);
            hand.push(newCard);
        } else {
            hand.push(card);
        }
        
        if (player === 'player') {
            this.addLog(`You drew ${card.name}`);
        }
        
        // Azure Infinity: "Whenever you draw a card, reduce a random card's cost by 1"
        const field = player === 'player' ? this.playerField : this.aiField;
        const hasAzureInfinity = field.some(c => 
            c.name === 'Azure Infinity' || 
            c.ability?.includes('Whenever you draw a card, reduce a random card')
        );
        
        if (hasAzureInfinity && hand.length > 1) {
            // Pick a random card that's not the one just drawn
            const eligibleCards = hand.filter(c => c !== card && c.cost > 0);
            if (eligibleCards.length > 0) {
                const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
                randomCard.cost = Math.max(0, randomCard.cost - 1);
                console.log(`[AZURE INFINITY] Reduced ${randomCard.name} cost by 1 (now ${randomCard.cost})`);
                if (player === 'player') {
                    this.addLog(`Azure Infinity: ${randomCard.name} costs 1 less!`);
                }
            }
        }
        
        // Update UI class for large hands
        if (player === 'player') {
            this.updateHandUIClass();
        }
    } else if (hand.length >= maxHandSize && deck.length > 0) {
        // Hand is full, card gets discarded
        const discarded = deck.pop();
        if (player === 'player') {
            this.addLog(`Hand is full! ${discarded.name} discarded.`);
        }
        console.log(`[HAND SIZE] ${player} hand full (${hand.length}/${maxHandSize}), discarded ${discarded.name}`);
    }
};

// ========================================================================
// FIX 2: Patch handleDeathrattle to respect hand size for "return to hand"
// ========================================================================
const _originalHandleDeathrattle = Game.prototype.handleDeathrattle;

Game.prototype.handleDeathrattle = function(card, player) {
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const maxHandSize = this.getMaxHandSize(player);
    
    // Temporarily override hand.push to check size
    const originalHandPush = hand.push;
    
    hand.push = function(...items) {
        // Check if adding would exceed max hand size
        if (this.length < maxHandSize) {
            const result = Array.prototype.push.call(this, ...items);
            // Update UI class after adding to hand
            if (player === 'player' && window.game) {
                window.game.updateHandUIClass();
            }
            return result;
        } else {
            console.log(`[HAND SIZE] ${player} hand full (${this.length}/${maxHandSize}), can't return ${items[0]?.name || 'card'} to hand`);
            return this.length; // Return current length, don't add
        }
    };
    
    // Call original deathrattle handler
    _originalHandleDeathrattle.call(this, card, player);
    
    // Restore original push
    hand.push = originalHandPush;
};

// ========================================================================
// FIX 3: Patch updateDisplay to maintain hand UI class
// ========================================================================
const _originalUpdateDisplay = Game.prototype.updateDisplay;
Game.prototype.updateDisplay = function() {
    // Call original
    _originalUpdateDisplay.call(this);
    
    // Update hand UI class
    this.updateHandUIClass();
};

console.log('✅ Unlimited Hand Size Fix complete!');
console.log('   📚 drawCard() patched to use dynamic hand size');
console.log('   🔄 Deathrattle "return to hand" respects hand size');
console.log('   💎 Azure Infinity cost reduction active');
console.log('   🎯 Hand size: 10 default, 999 with Azure Infinity/Dream Weaver');
console.log('   📜 Hand UI expands to 300px when 12+ cards present');
