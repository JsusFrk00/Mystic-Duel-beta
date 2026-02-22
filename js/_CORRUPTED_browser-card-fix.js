// Browser Card Initialization Fix
// This ensures cards load properly in the web version
(function() {
    'use strict';
    console.log('🌐 Browser card fix initializing...');
ECHO is off.
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
ECHO is off.
            connect(url = 'http://localhost:8080') {
                return new Promise((resolve, reject) => {
                    console.log('🔌 Connecting to server...');
ECHO is off.
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
ECHO is off.
            initSocket(url, resolve, reject) {
                this.socket = io(url);
                window.socket = this.socket;
ECHO is off.
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    console.log('✅ Connected to server');
                    if (this.onConnectionChange) this.onConnectionChange(true);
                });
ECHO is off.
                this.socket.on('connected', (data) => {
                    this.playerId = data.playerId;
                    console.log('🆔 Player ID:', this.playerId);
                    resolve(this.playerId);
                });
ECHO is off.
                this.socket.on('matchFound', (data) => {
                    this.roomId = data.roomId;
                    console.log('🎮 Match found! Room:', data.roomId);
ECHO is off.
                    // Critical: Send deck immediately for browser
                    setTimeout(() => {
                        this.sendDeckInitialization();
                    }, 100);
ECHO is off.
                    if (this.onMatchFound) {
                        this.onMatchFound({
                            status: 'found',
                            roomId: data.roomId,
                            playerIndex: data.playerIndex
                        });
                    }
                });
ECHO is off.
                this.socket.on('gameStateUpdate', (data) => {
                    console.log('📊 Game state update received');
ECHO is off.
                    // Force card creation if missing
                    if (window.game 
                        if (data.gameState.player1 
                            const playerData = this.playerId === data.gameState.player1.id ? 
                                              data.gameState.player1 : data.gameState.player2;
ECHO is off.
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
ECHO is off.
                    if (this.onGameUpdate) this.onGameUpdate(data);
                });
ECHO is off.
                setTimeout(() => {
                    if (!this.isConnected) reject('Connection timeout');
                }, 5000);
            }
ECHO is off.
            findMatch() {
                if (this.socket) {
                    this.socket.emit('findMatch');
                    console.log('🔍 Finding match...');
                }
            }
ECHO is off.
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
ECHO is off.
            sendDeckInitialization() {
                console.log('📦 Sending deck initialization...');
ECHO is off.
                // Try to get deck from various sources
                let deck = null;
ECHO is off.
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
ECHO is off.
                // Store deck for later
                if (window.game) {
                    window.game.playerDeck = deck;
                }
ECHO is off.
                // Send deck to server
                this.sendGameAction({
                    type: 'initDeck',
                    deck: deck
                });
ECHO is off.
                // Send twice to ensure delivery
                setTimeout(() => {
                    this.sendGameAction({
                        type: 'initDeck',
                        deck: deck
                    });
                    console.log('📦 Deck re-sent to ensure delivery');
                }, 500);
            }
ECHO is off.
            createDefaultDeck() {
                const deck = [];
                const creatures = [
                    {name: 'Fire Dragon', cost: 5, attack: 5, health: 4, emoji: '🐉'},
                    {name: 'Lightning Bolt', cost: 2, type: 'spell', emoji: '⚡'},
                    {name: 'Forest Wolf', cost: 3, attack: 3, health: 2, emoji: '🐺'},
                    {name: 'Shield Bearer', cost: 2, attack: 1, health: 3, emoji: '🛡️'},
                    {name: 'Mystic Owl', cost: 4, attack: 3, health: 3, emoji: '🦉'}
                ];
ECHO is off.
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
ECHO is off.
    // Fix deckbuilder for browser
    if (!window.deckbuilder) {
        window.deckbuilder = {};
    }
ECHO is off.
    if (!window.deckbuilder.getDeck) {
        window.deckbuilder.getDeck = function() {
            const nm = new NetworkManager();
            return nm.createDefaultDeck();
        };
    }
ECHO is off.
    // Browser-specific initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeBrowserFixes();
        });
    } else {
        initializeBrowserFixes();
    }
ECHO is off.
    function initializeBrowserFixes() {
        console.log('🌐 Applying browser-specific fixes...');
ECHO is off.
        // Hook into multiplayer manager if it exists
        if (window.multiplayerManager 
            window.multiplayerManager.networkManager = new NetworkManager();
            console.log('✅ NetworkManager attached to multiplayerManager');
        }
ECHO is off.
        // Hook into game if it exists
        if (window.game 
            window.game.networkManager = new NetworkManager();
            console.log('✅ NetworkManager attached to game');
        }
ECHO is off.
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
ECHO is off.
    console.log('✅ Browser card fix loaded!');
})();
