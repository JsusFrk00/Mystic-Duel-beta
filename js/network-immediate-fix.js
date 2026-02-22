// Immediate NetworkManager availability fix
// This ensures NetworkManager is available as soon as the page loads

(function() {
    'use strict';
    
    console.log('Applying NetworkManager immediate availability patch...');
    
    // If NetworkManager doesn't exist, create it immediately
    if (typeof NetworkManager === 'undefined' || !window.NetworkManager) {
        window.NetworkManager = class {
            constructor() {
                this.socket = null;
                this.isConnected = false;
                this.playerId = null;
                this.roomId = null;
                this.isHost = false;
                this.onConnectionChange = null;
                this.onMatchFound = null;
                this.onGameUpdate = null;
                this.onError = null;
                console.log('NetworkManager created (immediate patch)');
            }

            connect(serverUrl = 'http://localhost:8080') {
                return new Promise((resolve, reject) => {
                    console.log('Connecting to:', serverUrl);
                    
                    // Load Socket.io
                    if (typeof io === 'undefined') {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
                        script.onload = () => {
                            console.log('Socket.io loaded');
                            this.initSocket(serverUrl, resolve, reject);
                        };
                        script.onerror = () => reject('Failed to load Socket.io');
                        document.head.appendChild(script);
                    } else {
                        this.initSocket(serverUrl, resolve, reject);
                    }
                });
            }

            initSocket(serverUrl, resolve, reject) {
                this.socket = io(serverUrl, {
                    transports: ['websocket', 'polling']
                });
                
                window.socket = this.socket;
                
                this.socket.on('connect', () => {
                    this.isConnected = true;
                    console.log('Connected!');
                    if (this.onConnectionChange) this.onConnectionChange(true);
                });
                
                this.socket.on('connected', (data) => {
                    this.playerId = data.playerId;
                    resolve(this.playerId);
                });
                
                this.socket.on('matchFound', (data) => {
                    console.log('Match found!', data);
                    this.roomId = data.roomId;
                    
                    // Auto-send deck
                    setTimeout(() => {
                        const deck = this.getDefaultDeck();
                        this.sendGameAction({
                            type: 'initDeck',
                            deck: deck
                        });
                    }, 500);
                    
                    if (this.onMatchFound) {
                        this.onMatchFound({
                            status: 'found',
                            roomId: data.roomId,
                            playerIndex: data.playerIndex
                        });
                    }
                });
                
                this.socket.on('gameStateUpdate', (data) => {
                    if (this.onGameUpdate) this.onGameUpdate(data);
                });
                
                this.socket.on('roomCreated', (data) => {
                    this.roomId = data.roomId;
                    this.isHost = true;
                    if (this.onMatchFound) {
                        this.onMatchFound({
                            status: 'roomCreated',
                            roomId: data.roomId
                        });
                    }
                });
                
                setTimeout(() => {
                    if (!this.isConnected) reject('Connection timeout');
                }, 5000);
            }

            findMatch() {
                if (this.socket) this.socket.emit('findMatch');
            }

            createPrivateRoom() {
                if (this.socket) this.socket.emit('createRoom');
            }

            joinPrivateRoom(roomId) {
                if (this.socket) this.socket.emit('joinRoom', { roomId });
            }

            sendGameAction(action) {
                if (this.socket) {
                    this.socket.emit('gameAction', {
                        roomId: this.roomId,
                        action: action
                    });
                }
            }

            getDefaultDeck() {
                const deck = [];
                for (let i = 0; i < 30; i++) {
                    deck.push({
                        name: `Card ${i}`,
                        cost: (i % 5) + 1,
                        type: i % 2 ? 'creature' : 'spell',
                        attack: (i % 4) + 1,
                        health: (i % 4) + 2,
                        emoji: '🎴',
                        rarity: 'common'
                    });
                }
                return deck;
            }

            disconnect() {
                if (this.socket) {
                    this.socket.disconnect();
                }
                this.isConnected = false;
                this.playerId = null;
                this.roomId = null;
            }

            getConnectionStatus() {
                return {
                    connected: this.isConnected,
                    playerId: this.playerId,
                    roomId: this.roomId,
                    isHost: this.isHost
                };
            }
        };
    }
    
    // Also ensure deckbuilder.getDeck exists
    if (!window.deckbuilder) {
        window.deckbuilder = {};
    }
    
    if (!window.deckbuilder.getDeck) {
        window.deckbuilder.getDeck = function() {
            console.log('Using fallback deck from patch');
            const deck = [];
            for (let i = 0; i < 30; i++) {
                deck.push({
                    name: `Card ${i}`,
                    cost: (i % 5) + 1,
                    type: i % 2 ? 'creature' : 'spell',
                    attack: (i % 4) + 1,
                    health: (i % 4) + 2,
                    emoji: '🎴',
                    rarity: 'common'
                });
            }
            return deck;
        };
    }
    
    console.log('✅ NetworkManager immediate availability patch applied');
    console.log('NetworkManager available:', typeof NetworkManager !== 'undefined');
    console.log('deckbuilder.getDeck available:', typeof window.deckbuilder?.getDeck === 'function');
    
})();