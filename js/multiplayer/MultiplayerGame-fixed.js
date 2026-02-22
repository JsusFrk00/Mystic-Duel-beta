// Fixed MultiplayerGame.js that uses real cards from cards.js
// This replaces the existing MultiplayerGame.js file

import { ALL_CARDS } from '../../src/js/data/cards.js';
import { Card } from '../../src/js/game/Card.js';

// Import Game class to extend from it
class MultiplayerGame extends Game {
    constructor(isHost = false) {
        // Get a proper deck using the actual cards
        const playerDeck = createProperDeckFromCards();
        
        // Call parent constructor with the deck
        super(playerDeck);
        
        this.isHost = isHost;
        this.playerIndex = isHost ? 0 : 1;
        this.turnPlayer = 0;
        this.gameEnded = false;
        this.networkManager = null;
        this.lastProcessedState = null;
        
        // Mark as multiplayer so Game.js doesn't duplicate card draws
        this.isMultiplayer = true;
        
        // Clear the hands that parent constructor might have created
        this.playerHand = [];
        this.opponentHand = [];
        
        // Draw exactly 5 cards ONCE
        this.drawInitialHand();
    }
    
    drawInitialHand() {
        console.log('Drawing EXACTLY 5 initial cards for multiplayer...');
        
        // Clear hands to ensure we start fresh
        this.playerHand = [];
        this.opponentHand = [];
        
        // Draw exactly 5 cards for player
        for (let i = 0; i < 5; i++) {
            if (this.playerDeck.length > 0) {
                const card = this.playerDeck.shift();
                this.playerHand.push(card);
            }
        }
        
        // Opponent hand will be synced from server
        // Just create placeholders for now
        for (let i = 0; i < 5; i++) {
            this.opponentHand.push({ name: 'Unknown', cost: 0, emoji: '❓' });
        }
        
        console.log('Initial hand drawn:', this.playerHand.length, 'cards');
        console.log('Cards in hand:', this.playerHand.map(c => c.name).join(', '));
        
        this.updateDisplay();
    }
    
    setNetworkManager(networkManager) {
        this.networkManager = networkManager;
        
        // Set up callbacks
        networkManager.onGameUpdate = (state) => this.handleGameStateUpdate(state);
        
        // Send our deck to server - send the full 30 cards with abilities
        const fullDeck = [...this.playerDeck, ...this.playerHand];
        console.log('📤 Sending full deck to server:', fullDeck.length, 'cards');
        console.log('First card:', fullDeck[0]);
        
        networkManager.sendGameAction({
            type: 'initDeck',
            deck: fullDeck.map(card => ({
                name: card.name,
                cost: card.cost,
                type: card.type,
                attack: card.attack,
                health: card.health,
                ability: card.ability || card.abilities?.[0] || '', // Handle both formats
                emoji: card.emoji,
                rarity: card.rarity
            }))
        });
    }
    
    handleGameStateUpdate(state) {
        console.log('📥 Received game state update');
        
        // Update turn indicator
        this.turnPlayer = state.currentPlayer;
        
        // Process state based on player index
        if (this.playerIndex === 0) {
            this.processPlayerState(state.player1, true);
            this.processPlayerState(state.player2, false);
        } else {
            this.processPlayerState(state.player2, true);
            this.processPlayerState(state.player1, false);
        }
        
        this.updateDisplay();
    }
    
    processPlayerState(playerState, isUs) {
        if (!playerState) return;
        
        if (isUs) {
            // Update our state
            this.playerMana = playerState.mana || 0;
            this.playerMaxMana = playerState.maxMana || 1;
            this.playerHealth = playerState.health || 30;
            
            // Only sync hand if server sends a different count (avoid duplicating)
            if (playerState.hand && playerState.hand.length !== this.playerHand.length) {
                console.log('Syncing hand from server:', playerState.hand.length, 'cards');
                this.playerHand = playerState.hand.map(card => this.createCardObject(card));
            }
            
            // Update field
            if (playerState.field) {
                this.playerField = playerState.field.map(card => this.createCardObject(card));
            }
        } else {
            // Update opponent state
            this.opponentMana = playerState.mana || 0;
            this.opponentMaxMana = playerState.maxMana || 1;
            this.opponentHealth = playerState.health || 30;
            
            // Update opponent hand count
            if (playerState.hand) {
                this.opponentHand = Array(playerState.hand.length).fill({ 
                    name: 'Unknown', 
                    cost: 0, 
                    emoji: '❓' 
                });
            }
            
            // Update opponent field
            if (playerState.field) {
                this.opponentField = playerState.field.map(card => this.createCardObject(card));
            }
        }
    }
    
    createCardObject(cardData) {
        if (!cardData) return null;
        
        // Create a proper Card instance with all abilities preserved
        const card = new Card({
            name: cardData.name || 'Unknown',
            cost: cardData.cost || 0,
            type: cardData.type || 'creature',
            attack: cardData.attack,
            health: cardData.health,
            ability: cardData.ability || cardData.abilities?.[0] || '', // Handle both formats
            emoji: cardData.emoji || '🎴',
            rarity: cardData.rarity || 'common'
        });
        
        // Preserve any state flags
        if (cardData.tapped) card.tapped = cardData.tapped;
        if (cardData.hasAttacked) card.hasAttacked = cardData.hasAttacked;
        if (cardData.canAttack) card.canAttack = cardData.canAttack;
        
        return card;
    }
}

// Helper function to create a proper deck from the actual cards
function createProperDeckFromCards() {
    const deck = [];
    const cardsToUse = ALL_CARDS.filter(card => card.cost <= 8); // Use reasonable cost cards
    
    // Build a balanced 30-card deck
    const manaCurve = {
        1: 6,  // 6 one-cost cards
        2: 6,  // 6 two-cost cards
        3: 6,  // 6 three-cost cards
        4: 5,  // 5 four-cost cards
        5: 4,  // 4 five-cost cards
        6: 2,  // 2 six-cost cards
        7: 1   // 1 seven+ cost card
    };
    
    for (const [cost, count] of Object.entries(manaCurve)) {
        const costNum = parseInt(cost);
        const cardsAtCost = cardsToUse.filter(c => {
            if (costNum < 7) return c.cost === costNum;
            return c.cost >= costNum;
        });
        
        for (let i = 0; i < count && deck.length < 30; i++) {
            if (cardsAtCost.length > 0) {
                const randomCard = cardsAtCost[Math.floor(Math.random() * cardsAtCost.length)];
                const card = new Card(randomCard);
                deck.push(card);
            }
        }
    }
    
    // Fill any remaining slots
    while (deck.length < 30) {
        const randomCard = cardsToUse[Math.floor(Math.random() * cardsToUse.length)];
        const card = new Card(randomCard);
        deck.push(card);
    }
    
    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    console.log('Created deck with', deck.length, 'cards');
    console.log('First card:', deck[0].name, '-', deck[0].ability || 'No ability');
    
    return deck;
}

// Make it globally available
window.MultiplayerGame = MultiplayerGame;
