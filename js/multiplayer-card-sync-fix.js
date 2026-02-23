// MULTIPLAYER CARD SYNCHRONIZATION FIX
// This ensures cards are properly displayed when received from the server

console.log('🔄 MULTIPLAYER CARD SYNC FIX LOADING...');

(function() {
    'use strict';
    
    // Fix 1: Ensure Card class is available globally
    function ensureCardClass() {
        if (!window.Card && window.ALL_CARDS) {
            console.log('⚠️ Card class missing, creating emergency wrapper...');
            
            window.Card = class Card {
                constructor(template) {
                    // Copy all properties
                    Object.assign(this, template);
                    
                    // Ensure ability is set
                    if (!this.ability && this.ability !== '') {
                        const cardData = window.ALL_CARDS.find(c => c.name === this.name);
                        if (cardData && cardData.ability) {
                            this.ability = cardData.ability;
                        } else {
                            this.ability = '';
                        }
                    }
                    
                    // Set required properties
                    this.maxHealth = this.health;
                    this.tapped = false;
                    this.id = this.id || Math.random().toString(36).substr(2, 9);
                    this.frozen = false;
                    this.hasAttackedThisTurn = false;
                    
                    console.log(`[CARD CREATED] ${this.name} with ability: "${this.ability}"`);
                }
                
                canAttack() {
                    return !this.tapped && !this.frozen && !this.hasAttackedThisTurn;
                }
                
                takeDamage(amount) {
                    this.health -= amount;
                    return amount;
                }
                
                markAttacked() {
                    this.tapped = true;
                    this.hasAttackedThisTurn = true;
                }
                
                resetForTurn() {
                    if (!this.frozen) {
                        this.tapped = false;
                    }
                    this.hasAttackedThisTurn = false;
                }
                
                getDisplayCost(spellsCount = 0) {
                    return this.cost;
                }
            };
            
            console.log('✅ Emergency Card class created');
        }
    }
    
    // Fix 2: Patch MultiplayerGame syncGameState to ensure cards are created
    function patchMultiplayerGameSync() {
        if (!window.MultiplayerGame) {
            console.error('❌ MultiplayerGame not found');
            return;
        }
        
        const originalSync = window.MultiplayerGame.prototype.syncGameState;
        
        window.MultiplayerGame.prototype.syncGameState = function(state) {
            console.log('🔄 [SYNC FIX] Syncing game state with card fix...');
            
            // Ensure Card class exists
            ensureCardClass();
            
            // Call original sync
            if (originalSync) {
                originalSync.call(this, state);
            }
            
            // Double-check and fix card creation
            if (state && state.players) {
                const myState = state.players[this.playerIndex];
                const oppState = state.players[1 - this.playerIndex];
                
                // Fix player hand
                if (Array.isArray(myState.hand) && myState.hand.length > 0) {
                    console.log(`📋 [SYNC FIX] Processing ${myState.hand.length} cards in hand`);
                    
                    this.playerHand = myState.hand.map(cardData => {
                        // Ensure it's a Card instance
                        if (!(cardData instanceof window.Card)) {
                            const card = new window.Card({
                                name: cardData.name || 'Unknown',
                                cost: cardData.cost || 0,
                                type: cardData.type || 'creature',
                                attack: cardData.attack || 0,
                                health: cardData.health || 1,
                                ability: cardData.ability || '',
                                emoji: cardData.emoji || '❓',
                                rarity: cardData.rarity || 'common'
                            });
                            console.log(`✅ Created card: ${card.name}`);
                            return card;
                        }
                        return cardData;
                    });
                    
                    console.log(`📋 [SYNC FIX] Player hand now has ${this.playerHand.length} cards`);
                    
                    // Log first card for debugging
                    if (this.playerHand.length > 0) {
                        const firstCard = this.playerHand[0];
                        console.log(`  First card: ${firstCard.name}, ability: "${firstCard.ability}"`);
                    }
                }
                
                // Fix fields
                if (Array.isArray(myState.field)) {
                    this.playerField = myState.field.map(cardData => {
                        if (!(cardData instanceof window.Card)) {
                            return new window.Card(cardData);
                        }
                        return cardData;
                    });
                }
                
                if (Array.isArray(oppState.field)) {
                    this.aiField = oppState.field.map(cardData => {
                        if (!(cardData instanceof window.Card)) {
                            return new window.Card(cardData);
                        }
                        return cardData;
                    });
                }
                
                // Force display update
                console.log('🎨 [SYNC FIX] Forcing display update...');
                this.updateDisplay();
                
                // Extra force update after a delay
                setTimeout(() => {
                    if (this.playerHand && this.playerHand.length > 0) {
                        console.log('🎨 [SYNC FIX] Delayed display update...');
                        this.updateDisplay();
                    }
                }, 100);
            }
        };
        
        console.log('✅ MultiplayerGame.syncGameState patched');
    }
    
    // Fix 3: Ensure updateDisplay properly renders cards
    function patchUpdateDisplay() {
        if (!window.Game) {
            console.error('❌ Game class not found');
            return;
        }
        
        const originalRenderHand = window.Game.prototype.renderHand;
        
        window.Game.prototype.renderHand = function() {
            const handEl = document.getElementById('playerHand');
            if (!handEl) {
                console.error('❌ playerHand element not found');
                return;
            }
            
            console.log(`🎨 [RENDER] Rendering ${this.playerHand?.length || 0} cards in hand`);
            
            handEl.innerHTML = '';
            
            if (this.playerHand && this.playerHand.length > 0) {
                this.playerHand.forEach((card, index) => {
                    console.log(`  Rendering card ${index + 1}: ${card.name}`);
                    const cardEl = this.createCardElement(card, true);
                    
                    // Ensure card is playable if we have mana
                    const actualCost = card.getDisplayCost ? card.getDisplayCost(this.playerSpellsCount) : card.cost;
                    if (actualCost <= this.playerMana && this.currentTurn === 'player') {
                        cardEl.classList.add('playable');
                    }
                    
                    handEl.appendChild(cardEl);
                });
            } else {
                console.log('  No cards to render');
                // Show placeholder message
                const placeholder = document.createElement('div');
                placeholder.style.color = 'rgba(255,255,255,0.3)';
                placeholder.textContent = 'No cards in hand';
                handEl.appendChild(placeholder);
            }
            
            // Also call original if it exists
            if (originalRenderHand) {
                // Don't call original since we've already rendered
                // originalRenderHand.call(this);
            }
        };
        
        console.log('✅ Game.renderHand patched');
    }
    
    // Fix 4: Monitor for game state updates
    function setupGameStateMonitor() {
        // ONLY monitor if in actual multiplayer game
        // Skip for single-player to avoid interfering with spell execution
        console.log('✅ Game state monitor disabled for single-player compatibility');
        return;
        
        /* DISABLED - was interfering with single-player spell execution
        // Check for game state updates periodically
        let lastHandSize = 0;
        
        setInterval(() => {
            if (window.game && window.game.playerHand) {
                const currentHandSize = window.game.playerHand.length;
                if (currentHandSize !== lastHandSize) {
                    console.log(`👁️ [MONITOR] Hand size changed: ${lastHandSize} -> ${currentHandSize}`);
                    lastHandSize = currentHandSize;
                    
                    // Force update display
                    if (window.game.updateDisplay) {
                        window.game.updateDisplay();
                    }
                }
            }
        }, 1000);
        
        console.log('✅ Game state monitor active');
        */
    }
    
    // Fix 5: Intercept WebSocket messages to ensure proper handling
    function patchWebSocket() {
        // Hook into socket.io if it exists
        if (window.io) {
            const originalIo = window.io;
            window.io = function(...args) {
                const socket = originalIo.apply(this, args);
                
                // Intercept gameStateUpdate events
                const originalOn = socket.on;
                socket.on = function(event, handler) {
                    if (event === 'gameStateUpdate') {
                        const wrappedHandler = function(data) {
                            console.log('🔌 [SOCKET] gameStateUpdate received');
                            
                            // Call original handler
                            handler.call(this, data);
                            
                            // Force update after a delay
                            setTimeout(() => {
                                if (window.game && window.game.updateDisplay) {
                                    console.log('🔌 [SOCKET] Forcing display update after gameStateUpdate');
                                    window.game.updateDisplay();
                                }
                            }, 100);
                        };
                        return originalOn.call(this, event, wrappedHandler);
                    }
                    return originalOn.call(this, event, handler);
                };
                
                return socket;
            };
            
            console.log('✅ WebSocket patched');
        }
    }
    
    // Main initialization
    function initializeCardSyncFix() {
        console.log('🚀 Initializing Multiplayer Card Sync Fix...');
        
        // Apply all patches
        ensureCardClass();
        patchMultiplayerGameSync();
        patchUpdateDisplay();
        setupGameStateMonitor();
        patchWebSocket();
        
        // Force immediate check if game is active
        if (window.game && window.game.playerHand) {
            console.log('🎮 Active game detected, forcing immediate update');
            if (window.game.updateDisplay) {
                window.game.updateDisplay();
            }
        }
        
        console.log('✅ MULTIPLAYER CARD SYNC FIX COMPLETE');
    }
    
    // Wait for dependencies then initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeCardSyncFix, 500);
        });
    } else {
        setTimeout(initializeCardSyncFix, 500);
    }
    
    // Also make fix available globally for manual execution
    window.fixMultiplayerCards = function() {
        console.log('🔧 Manual card fix triggered');
        initializeCardSyncFix();
        
        // Extra force update
        if (window.game) {
            if (window.game.syncGameState && window.game.networkManager) {
                console.log('🔧 Requesting state sync from server');
                window.game.networkManager.sendGameAction({ type: 'syncState' });
            }
            
            if (window.game.updateDisplay) {
                window.game.updateDisplay();
            }
        }
    };
    
    console.log('📝 Use fixMultiplayerCards() to manually trigger fix');
})();

console.log('🔄 Multiplayer Card Sync Fix loaded');
