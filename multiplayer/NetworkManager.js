// NetworkManager - Fixed version with immediate window exposure
(function() {
    // NetworkManager class for handling multiplayer connections
    class NetworkManager {
        constructor() {
            this.socket = null;
            this.isConnected = false;
            this.playerId = null;
            this.roomId = null;
            this.isHost = false;
            
            // Event callbacks
            this.onConnectionChange = null;
            this.onMatchFound = null;
            this.onGameUpdate = null;
            this.onError = null;
            
            console.log('📡 NetworkManager instance created');
        }

        connect(serverUrl = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080') {
            return new Promise((resolve, reject) => {
                console.log('🔌 Connecting to server:', serverUrl);
                
                // Load Socket.io if needed
                if (typeof io === 'undefined') {
                    this.loadSocketIO().then(() => {
                        this.initializeSocket(serverUrl, resolve, reject);
                    }).catch(reject);
                } else {
                    this.initializeSocket(serverUrl, resolve, reject);
                }
            });
        }

        loadSocketIO() {
            return new Promise((resolve, reject) => {
                if (typeof io !== 'undefined') {
                    resolve();
                    return;
                }

                console.log('📡 Loading Socket.io client...');
                
                // Try multiple sources
                const sources = [
                    '/socket.io/socket.io.js',
                    'https://cdn.socket.io/4.7.2/socket.io.min.js',
                    'https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.min.js'
                ];
                
                let sourceIndex = 0;
                const tryNextSource = () => {
                    if (sourceIndex >= sources.length) {
                        reject(new Error('Failed to load Socket.io from any source'));
                        return;
                    }
                    
                    const script = document.createElement('script');
                    script.src = sources[sourceIndex];
                    script.onload = () => {
                        console.log('✅ Socket.io loaded from:', sources[sourceIndex]);
                        resolve();
                    };
                    script.onerror = () => {
                        console.warn('⚠️ Failed to load from:', sources[sourceIndex]);
                        sourceIndex++;
                        tryNextSource();
                    };
                    document.head.appendChild(script);
                };
                
                tryNextSource();
            });
        }

        initializeSocket(serverUrl, resolve, reject) {
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            
            // Make socket globally accessible
            window.socket = this.socket;

            this.socket.on('connect', () => {
                console.log('✅ Connected to server!');
                this.isConnected = true;
                if (this.onConnectionChange) {
                    this.onConnectionChange(true);
                }
            });

            this.socket.on('connected', (data) => {
                this.playerId = data.playerId;
                console.log('🎮 Player ID:', this.playerId);
                resolve(this.playerId);
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from server');
                this.isConnected = false;
                this.roomId = null;
                if (this.onConnectionChange) {
                    this.onConnectionChange(false);
                }
            });

            this.socket.on('matchFound', (data) => {
                console.log('🎯 Match found!', data);
                this.roomId = data.roomId;
                this.isHost = data.playerIndex === 0;
                
                if (this.onMatchFound) {
                    this.onMatchFound({
                        status: 'found',
                        roomId: data.roomId,
                        playerIndex: data.playerIndex,
                        isHost: this.isHost
                    });
                }
                
                // REMOVE OR COMMENT OUT the auto-send deck logic:
                // setTimeout(() => {
                //     this.sendDeckInitialization();
                // }, 500);
            });

            this.socket.on('gameStateUpdate', (data) => {
                console.log('🔄 Game state update received');
                if (this.onGameUpdate) {
                    this.onGameUpdate(data);
                }
            });

            this.socket.on('roomCreated', (data) => {
                console.log('🏠 Room created:', data.roomId);
                this.roomId = data.roomId;
                this.isHost = true;
                
                if (this.onMatchFound) {
                    this.onMatchFound({
                        status: 'roomCreated',
                        roomId: data.roomId,
                        message: data.message
                    });
                }
            });

            this.socket.on('roomJoined', (data) => {
                console.log('🚪 Joined room:', data.roomId);
                this.roomId = data.roomId;
                
                if (this.onMatchFound) {
                    this.onMatchFound({
                        status: 'roomJoined',
                        roomId: data.roomId
                    });
                }
            });

            this.socket.on('opponentDisconnected', () => {
                console.log('👤 Opponent disconnected');
                if (this.onError) {
                    this.onError('Opponent disconnected');
                }
            });

            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                if (this.onError) {
                    this.onError(error);
                }
            });

            // Connection timeout
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timeout - is the server running?'));
                }
            }, 5000);
        }

        findMatch() {
            if (!this.isConnected) {
                throw new Error('Not connected to server');
            }
            console.log('🔍 Looking for match...');
            this.socket.emit('findMatch');
        }

        createPrivateRoom() {
            if (!this.isConnected) {
                throw new Error('Not connected to server');
            }
            console.log('🏠 Creating private room...');
            this.socket.emit('createRoom');
        }

        joinPrivateRoom(roomId) {
            if (!this.isConnected) {
                throw new Error('Not connected to server');
            }
            console.log('🚪 Joining room:', roomId);
            this.socket.emit('joinRoom', { roomId });
        }

        sendGameAction(action) {
            if (!this.isConnected) {
                console.error('❌ Cannot send action - not connected');
                return;
            }
            
            // Store room ID in action if we have one
            if (this.roomId) {
                action.roomId = this.roomId;
            }
            
            console.log('📤 Sending action:', action.type);
            if (action.type === 'initDeck') {
                console.log('   Deck size:', action.deck?.length || 0);
            }
            
            this.socket.emit('gameAction', {
                roomId: this.roomId,
                action: action
            });
        }

        sendDeckInitialization() {
            console.log('📚 Sending deck initialization...');
            
            // Get deck from various sources
            let deck = null;
            
            // Try multiple sources
            if (window.gameManager?.playerDeck) {
                deck = window.gameManager.playerDeck;
                console.log('   Using deck from gameManager');
            } else if (window.game?.playerDeck) {
                deck = window.game.playerDeck;
                console.log('   Using deck from game');
            } else if (window.deckbuilder && typeof window.deckbuilder.getDeck === 'function') {
                try {
                    deck = window.deckbuilder.getDeck();
                    console.log('   Using deck from deckbuilder');
                } catch (e) {
                    console.warn('   deckbuilder.getDeck failed:', e);
                }
            }
            
            // Create default deck if needed
            if (!deck || deck.length === 0) {
                deck = [];
                for (let i = 0; i < 30; i++) {
                    deck.push({
                        name: 'Card ' + i,
                        cost: (i % 5) + 1,
                        type: i % 2 ? 'creature' : 'spell',
                        attack: (i % 4) + 1,
                        health: (i % 4) + 2,
                        emoji: '🎴',
                        rarity: 'common'
                    });
                }
                console.log('   Created default deck');
            }
            
            this.sendGameAction({
                type: 'initDeck',
                deck: deck
            });
        }

        disconnect() {
            if (this.socket) {
                console.log('🔌 Disconnecting...');
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
    }

    // CRITICAL: Immediately expose NetworkManager to window
    window.NetworkManager = NetworkManager;
    
    // Also expose to global if it exists
    if (typeof global !== 'undefined') {
        global.NetworkManager = NetworkManager;
    }
    
    // Export if in module environment
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { NetworkManager };
    }
    
    console.log('✅ NetworkManager registered globally');
    console.log('   Available:', typeof window.NetworkManager !== 'undefined');
    
})();