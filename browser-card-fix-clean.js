// Browser Card Initialization Fix - CLEAN VERSION
// This ensures cards load properly in the web version
(function() {
    'use strict';
    console.log('🌐 Browser card fix initializing...');
    
    // Ensure NetworkManager exists
    if (typeof NetworkManager === 'undefined') {
        window.NetworkManager = class {
            constructor() {
                this.socket = null;
                this.isConnected = false;
                this.playerId = null;
                this.roomId = null;
                this.onConnectionChange = null;
                this.onMatchFound = null;
                this.onGameUpdate = null;
            }
            
            connect(url = 'http://localhost:8080') {
                return new Promise((resolve, reject) => {
                    console.log('🔌 Connecting to server...');
                    
                    if (typeof io === 'undefined') {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
                        script.onload = () => {
                            this.initSocket(url, resolve, reject);
                        };
                        script.onerror = () => reject('Failed to load Socket.io');
                        document.head.appendChild(script);
                    } else {
                        this.initSocket(url, resolve, reject);
                    }
                });
            }
            
            initSocket(url, resolve, reject) {
                this.socket = io(url);
                window.socket = this.socket;
                
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    console.log('✅ Connected to server');
                    if (this.onConnectionChange) this.onConnectionChange(true);
                });
                
                this.socket.on('connected', (data) => {
                    this.playerId = data.playerId;
                    console.log('🆔 Player ID:', this.playerId);
                    resolve(this.playerId);
                });
                
                this.socket.on('matchFound', (data) => {
                    this.roomId = data.roomId;
                    console.log('🎮 Match found! Room:', data.roomId);
                    
                    // Critical: Send deck immediately for browser
                    setTimeout(() => {
                        this.sendDeckInitialization();
                    }, 100);
                    
                    if (this.onMatchFound) {
                        this.onMatchFound({
                            status: 'found',
                            roomId: data.roomId,
                            playerIndex: data.playerIndex
                        });
                    }
                });
                
                this.socket.on('gameStateUpdate', (data) => {
                    console.log('📊 Game state update received');
                    
                    // Force card creation if missing
                    if (window.game && data.gameState) {
                        if (data.gameState.player1 && data.gameState.player2) {
                            const playerData = this.playerId === data.gameState.player1.id ? 
                                              data.gameState.player1 : data.gameState.player2;
                            
                            if (playerData?.hand) {
                                window.game.playerHand = playerData.hand.map(card => {
                                    if (typeof Card !== 'undefined') {
                                        return new Card(card);
                                    }
                                    return card;
                                });
                                console.log('✅ Created', window.game.playerHand.length, 'cards in hand');
                                if (window.game.updateDisplay) {
                                    window.game.updateDisplay();
                                }
                            }
                        }
                    }
                    
                    if (this.onGameUpdate) this.onGameUpdate(data);
                });
                
                setTimeout(() => {
                    if (!this.isConnected) reject('Connection timeout');
                }, 5000);
            }
            
            findMatch() {
                if (this.socket) {
                    this.socket.emit('findMatch');
                    console.log('🔍 Finding match...');
                }
            }
            
            sendGameAction(action) {
                if (this.socket) {
                    const payload = {
                        roomId: this.roomId,
                        action: action
                    };
                    this.socket.emit('gameAction', payload);
                    console.log('📤 Sent action:', action.type);
                }
            }
            
            sendDeckInitialization() {
                console.log('📦 Sending deck initialization...');
                
                // Try to get deck from various sources
                let deck = null;
                
                // Try 1: gameManager
                if (window.gameManager?.playerDeck) {
                    deck = window.gameManager.playerDeck;
                    console.log('📚 Using deck from gameManager');
                }
                // Try 2: game
                else if (window.game?.playerDeck) {
                    deck = window.game.playerDeck;
                    console.log('📚 Using deck from game');
                }
                // Try 3: deckbuilder
                else if (window.deckbuilder?.getDeck) {
                    deck = window.deckbuilder.getDeck();
                    console.log('📚 Using deck from deckbuilder');
                }
                // Try 4: Create default
                else {
                    deck = this.createDefaultDeck();
                    console.log('📚 Created default deck');
                }
                
                // Store deck for later
                if (window.game) {
                    window.game.playerDeck = deck;
                }
                
                // Send deck to server
                this.sendGameAction({
                    type: 'initDeck',
                    deck: deck
                });
                
                // Send twice to ensure delivery
                setTimeout(() => {
                    this.sendGameAction({
                        type: 'initDeck',
                        deck: deck
                    });
                    console.log('📦 Deck re-sent to ensure delivery');
                }, 500);
            }
            
            createDefaultDeck() {
                const deck = [];
                const creatures = [
                    {name: 'Fire Dragon', cost: 5, attack: 5, health: 4, emoji: '🐉'},
                    {name: 'Lightning Bolt', cost: 2, type: 'spell', emoji: '⚡'},
                    {name: 'Forest Wolf', cost: 3, attack: 3, health: 2, emoji: '🐺'},
                    {name: 'Shield Bearer', cost: 2, attack: 1, health: 3, emoji: '🛡️'},
                    {name: 'Mystic Owl', cost: 4, attack: 3, health: 3, emoji: '🦉'}
                ];
                
                // Create 30 card deck
                for (let i = 0; i < 30; i++) {
                    const template = creatures[i % creatures.length];
                    deck.push({
                        ...template,
                        type: template.type || 'creature',
                        rarity: 'common',
                        id: `card_${i}`
                    });
                }
                return deck;
            }
        };
    }
    
    // Fix deckbuilder for browser
    if (!window.deckbuilder) {
        window.deckbuilder = {};
    }
    
    if (!window.deckbuilder.getDeck) {
        window.deckbuilder.getDeck = function() {
            const nm = new NetworkManager();
            return nm.createDefaultDeck();
        };
    }
    
    // Browser-specific initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeBrowserFixes();
        });
    } else {
        initializeBrowserFixes();
    }
    
    function initializeBrowserFixes() {
        console.log('🌐 Applying browser-specific fixes...');
        
        // Hook into multiplayer manager if it exists
        if (window.multiplayerManager && !window.multiplayerManager.networkManager) {
            window.multiplayerManager.networkManager = new NetworkManager();
            console.log('✅ NetworkManager attached to multiplayerManager');
        }
        
        // Hook into game if it exists
        if (window.game && !window.game.networkManager) {
            window.game.networkManager = new NetworkManager();
            console.log('✅ NetworkManager attached to game');
        }
        
        // Override connect button handler to ensure deck sends
        const originalConnect = window.connectToServer;
        if (originalConnect) {
            window.connectToServer = function() {
                const result = originalConnect.apply(this, arguments);
                // Ensure deck is ready
                setTimeout(() => {
                    if (window.game?.networkManager?.roomId) {
                        window.game.networkManager.sendDeckInitialization();
                    }
                }, 1000);
                return result;
            };
        }
    }
    
    console.log('✅ Browser card fix loaded!');
})();
