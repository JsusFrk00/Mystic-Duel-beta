// Fixed NetworkManager with proper game initialization
console.log('🔧 Loading fallback NetworkManager...');

class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.currentRoom = null;
        this.isHost = false;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onMatchFound = null;
        this.onGameUpdate = null;
        this.onError = null;
    }

    connect(serverUrl = 'http://localhost:8080') {
        return new Promise((resolve, reject) => {
            this.loadSocketIO().then(() => {
                this.initializeSocket(serverUrl, resolve, reject);
            }).catch(reject);
        });
    }

    loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (typeof io !== 'undefined') {
                resolve();
                return;
            }

            console.log('📡 Loading Socket.io client library...');
            const script = document.createElement('script');
            script.src = '/socket.io/socket.io.js';
            script.onload = () => {
                console.log('✅ Socket.io client loaded from server');
                resolve();
            };
            script.onerror = () => {
                console.log('⚠️ Trying CDN fallback for Socket.io...');
                const cdnScript = document.createElement('script');
                cdnScript.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
                cdnScript.onload = () => {
                    console.log('✅ Socket.io client loaded from CDN');
                    resolve();
                };
                cdnScript.onerror = () => {
                    reject(new Error('Failed to load Socket.io client library'));
                };
                document.head.appendChild(cdnScript);
            };
            document.head.appendChild(script);
        });
    }

    initializeSocket(serverUrl, resolve, reject) {
        console.log('🔌 Connecting to ' + serverUrl + '...');
        this.socket = io(serverUrl);

        this.socket.on('connect', () => {
            console.log('🌐 Connected to multiplayer server!');
            this.isConnected = true;
            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
        });

        this.socket.on('connected', (data) => {
            this.playerId = data.playerId;
            console.log('🆔 Player ID assigned: ' + this.playerId);
            resolve(this.playerId);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from multiplayer server');
            this.isConnected = false;
            this.currentRoom = null;
            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        this.socket.on('error', (error) => {
            console.error('❌ Network error:', error);
            if (this.onError) {
                this.onError(error);
            }
            reject(error);
        });

        this.socket.on('actionError', (error) => {
            console.error('🚫 Action error:', error);
            if (this.onError) {
                this.onError('Action failed: ' + error);
            }
        });

        this.socket.on('matchmaking', (message) => {
            console.log('🔍 Matchmaking: ' + message);
            if (this.onMatchFound) {
                this.onMatchFound({ status: 'searching', message });
            }
        });

        this.socket.on('gameStart', (data) => {
            console.log('🎮 Game starting!', data);
            this.currentRoom = data.roomId;
            this.isHost = data.playerIndex === 0;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'found', 
                    roomId: data.roomId,
                    playerIndex: data.playerIndex,
                    isHost: this.isHost
                });
            }
        });

        this.socket.on('roomCreated', (data) => {
            console.log('🏠 Room created: ' + data.roomId);
            this.currentRoom = data.roomId;
            this.isHost = data.isHost;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'roomCreated', 
                    roomId: data.roomId,
                    message: data.message,
                    isHost: data.isHost
                });
            }
        });

        this.socket.on('roomJoined', (data) => {
            console.log('🚪 Joined room: ' + data.roomId);
            this.currentRoom = data.roomId;
            this.isHost = data.isHost || false;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'roomJoined', 
                    roomId: data.roomId,
                    message: data.message || 'Joined room successfully!',
                    isHost: this.isHost
                });
            }
        });

        this.socket.on('gameUpdate', (data) => {
            console.log('🔄 Game update received:', data);
            if (this.onGameUpdate) {
                this.onGameUpdate(data);
            }
        });

        this.socket.on('playerDisconnected', (data) => {
            console.log('👋 Player disconnected: ' + data.playerId);
            if (this.onError) {
                this.onError('Your opponent disconnected from the game');
            }
        });

        // Connection timeout
        setTimeout(() => {
            if (!this.isConnected) {
                reject(new Error('Connection timeout'));
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

    createPrivateRoom(roomId = null) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        console.log('🏠 Creating private room...');
        this.socket.emit('createRoom', { roomId });
    }

    joinPrivateRoom(roomId) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        console.log('🚪 Joining room: ' + roomId);
        this.socket.emit('joinRoom', { roomId });
    }

    sendGameAction(action) {
        if (!this.isConnected || !this.currentRoom) {
            throw new Error('Not in a game room');
        }

        console.log('📤 Sending game action: ' + action.type);
        this.socket.emit('gameAction', {
            roomId: this.currentRoom,
            action: action
        });
    }

    endTurn() {
        this.sendGameAction({
            type: 'endTurn',
            timestamp: Date.now()
        });
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting from server...');
            this.socket.disconnect();
        }
        this.isConnected = false;
        this.playerId = null;
        this.currentRoom = null;
        this.isHost = false;
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            playerId: this.playerId,
            roomId: this.currentRoom,
            isHost: this.isHost
        };
    }
}

// Fixed MultiplayerGame class with proper card initialization
class MultiplayerGame {
    constructor(playerDeckCards, networkManager, playerIndex = 0) {
        this.networkManager = networkManager;
        this.playerIndex = playerIndex;
        this.isMultiplayer = true;
        this.opponentIndex = 1 - playerIndex;
        this.waitingForOpponent = false;
        
        console.log('🎮 MultiplayerGame constructor called with:');
        console.log('  playerDeckCards:', playerDeckCards ? playerDeckCards.length : 'undefined', 'cards');
        console.log('  playerIndex:', playerIndex);
        
        if (!playerDeckCards || playerDeckCards.length === 0) {
            console.error('❌ No deck provided to MultiplayerGame!');
            this.addLog('❌ No cards available for multiplayer game');
            return;
        }
        
        // Verify the deck contains proper card objects
        console.log('Sample deck cards:', playerDeckCards.slice(0, 3).map(c => c.name + ' (' + c.cost + ')'));
        
        // Start the actual game immediately with the provided deck
        this.startRealGame(playerDeckCards);
        
        // Set up network callbacks
        this.setupMultiplayerCallbacks();
        
        console.log('🎮 Multiplayer game initialized - Player ' + (playerIndex + 1));
    }
    
    startRealGame(playerDeckCards) {
        console.log('🎯 Initializing real game with ' + playerDeckCards.length + ' cards');
        
        // Make sure we can access the Game class
        let GameClass = null;
        if (window.Game) {
            GameClass = window.Game;
            console.log('✅ Found window.Game');
        } else {
            console.error('❌ Cannot find Game class!');
            console.log('Available on window:', Object.keys(window).filter(k => k.toLowerCase().includes('game')));
            this.addLog('❌ Failed to load Game class - please restart');
            return;
        }
        
        // Verify required dependencies are available
        if (!window.Card) {
            console.error('❌ Card class not available');
            this.addLog('❌ Card class missing - please restart');
            return;
        }
        
        if (!window.ALL_CARDS) {
            console.error('❌ ALL_CARDS not available');
            this.addLog('❌ Card data missing - please restart');
            return;
        }
        
        if (!window.storage) {
            console.error('❌ Storage not available');
            this.addLog('❌ Storage system missing - please restart');
            return;
        }
        
        try {
            // Create a real Game instance with the player's deck
            console.log('🎮 Creating Game instance...');
            this.game = new GameClass(playerDeckCards);
            
            // Verify the game was created properly
            if (!this.game.playerHand || !this.game.playerDeck) {
                console.error('❌ Game instance missing required properties');
                this.addLog('❌ Game failed to initialize properly');
                return;
            }
            
            console.log('✅ Game created with:');
            console.log('  Player hand: ' + (this.game.playerHand ? this.game.playerHand.length : 'undefined') + ' cards');
            console.log('  Player deck: ' + (this.game.playerDeck ? this.game.playerDeck.length : 'undefined') + ' cards');
            console.log('  AI hand: ' + (this.game.aiHand ? this.game.aiHand.length : 'undefined') + ' cards');
            
            this.game.isMultiplayer = true;
            this.game.playerIndex = this.playerIndex;
            
            // Make sure the game instance is globally accessible
            window.game = this.game;
            
            // Override the AI opponent behavior for multiplayer
            this.setupMultiplayerBehavior();
            
            // Update the display to show it's multiplayer
            this.addLog('🌐 Multiplayer game started!');
            this.addLog('🎮 You are Player ' + (this.playerIndex + 1));
            this.addLog(this.playerIndex === 0 ? '▶️ You go first!' : '⏳ Opponent goes first');
            
            // Update opponent name in UI
            const opponentHeader = document.querySelector('#gameContainer .player-area:first-child h3');
            if (opponentHeader) {
                opponentHeader.textContent = 'Player ' + (this.opponentIndex + 1);
                opponentHeader.style.color = '#ff5722';
            }
            
            // Update player header 
            const playerHeader = document.querySelector('#gameContainer .player-area:last-child h3');
            if (playerHeader) {
                playerHeader.textContent = 'You (Player ' + (this.playerIndex + 1) + ')';
                playerHeader.style.color = '#4caf50';
            }
            
            // Show multiplayer indicator
            this.showMultiplayerIndicator();
            
            // Force an initial display update
            if (this.game.updateDisplay) {
                this.game.updateDisplay();
            }
            
            console.log('✅ Multiplayer game fully initialized');
            
        } catch (error) {
            console.error('❌ Error creating Game instance:', error);
            this.addLog('❌ Failed to create game: ' + error.message);
        }
    }
    
    setupMultiplayerBehavior() {
        if (!this.game) return;
        
        // Override AI turn to wait for opponent
        this.game.originalAITurn = this.game.aiTurn;
        this.game.aiTurn = () => {
            this.addLog('⏳ Waiting for opponent\'s move...');
            this.waitingForOpponent = true;
            
            // Disable end turn button while waiting
            const endTurnBtn = document.getElementById('endTurnBtn');
            if (endTurnBtn) {
                endTurnBtn.disabled = true;
                endTurnBtn.textContent = 'Waiting for Opponent';
            }
            
            // Update turn indicator
            document.getElementById('turnIndicator').textContent = 'Opponent\'s Turn (Multiplayer)';
        };
        
        // Override endTurn to send to server
        this.game.originalEndTurn = this.game.endTurn;
        this.game.endTurn = () => {
            if (this.game.currentTurn === 'player') {
                try {
                    this.networkManager.endTurn();
                    this.addLog('📤 Sent turn to opponent...');
                    
                    // Switch to "AI" turn (which is actually opponent's turn)
                    this.game.currentTurn = 'ai';
                    this.game.aiTurn();
                } catch (error) {
                    console.error('Failed to end turn:', error);
                    this.addLog('❌ Failed to send turn: ' + error.message);
                }
            }
        };
        
        // Ensure the game starts properly if we're player 1
        if (this.playerIndex === 0) {
            // Player 1 goes first
            this.game.currentTurn = 'player';
            document.getElementById('turnIndicator').textContent = 'Your Turn (Multiplayer)';
            const endTurnBtn = document.getElementById('endTurnBtn');
            if (endTurnBtn) {
                endTurnBtn.disabled = false;
                endTurnBtn.textContent = 'End Turn';
            }
        } else {
            // Player 2 waits for player 1
            this.game.currentTurn = 'ai';
            this.game.aiTurn();
        }
    }
    
    showMultiplayerIndicator() {
        // Add multiplayer indicator to the game
        const indicator = document.createElement('div');
        indicator.className = 'multiplayer-indicator';
        indicator.textContent = '🌐 Multiplayer - Room: ' + (this.networkManager.currentRoom || 'Unknown');
        indicator.style.cssText = `
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(100, 255, 218, 0.9);
            color: #000;
            padding: 5px 15px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            z-index: 60;
        `;
        
        // Remove any existing indicator
        const existingIndicator = document.querySelector('.multiplayer-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        document.getElementById('gameContainer').appendChild(indicator);
    }
    
    setupMultiplayerCallbacks() {
        this.networkManager.onGameUpdate = (data) => {
            this.handleGameUpdate(data);
        };
        
        this.networkManager.onError = (error) => {
            this.addLog('❌ Network: ' + error);
        };
    }
    
    handleGameUpdate(data) {
        const { action, fromPlayer } = data;
        
        // Don't process our own actions
        if (fromPlayer === this.playerIndex) {
            return;
        }
        
        console.log('📥 Opponent action: ' + action.type);
        
        switch (action.type) {
            case 'endTurn':
                this.handleOpponentEndTurn();
                break;
            default:
                this.addLog('🎮 Opponent: ' + action.type);
        }
        
        if (this.game && this.game.updateDisplay) {
            this.game.updateDisplay();
        }
    }
    
    handleOpponentEndTurn() {
        this.addLog('🔄 Opponent ended their turn');
        this.waitingForOpponent = false;
        
        if (this.game) {
            // Switch to our turn
            this.game.currentTurn = 'player';
            this.game.startNewTurn('player');
            
            // Enable controls
            const endTurnBtn = document.getElementById('endTurnBtn');
            if (endTurnBtn) {
                endTurnBtn.disabled = false;
                endTurnBtn.textContent = 'End Turn';
            }
            
            document.getElementById('turnIndicator').textContent = 'Your Turn (Multiplayer)';
            this.addLog('▶️ Your turn!');
        }
    }
    
    addLog(message) {
        if (this.game && this.game.addLog) {
            this.game.addLog(message);
        } else {
            const log = document.getElementById('gameLog');
            if (log) {
                const entry = document.createElement('div');
                entry.className = 'log-entry';
                entry.textContent = message;
                log.insertBefore(entry, log.firstChild);
                
                while (log.children.length > 10) {
                    log.removeChild(log.lastChild);
                }
            }
        }
    }
    
    restart() {
        this.addLog('🔄 Leaving multiplayer game...');
        
        if (this.networkManager) {
            this.networkManager.disconnect();
        }
        
        // Remove multiplayer indicator
        const indicator = document.querySelector('.multiplayer-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        // Show main menu
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('winnerScreen').style.display = 'none';
        
        // Restore main menu buttons
        const menuButtons = document.querySelector('.menu-buttons');
        const multiplayerSection = document.getElementById('multiplayerSection');
        if (menuButtons) menuButtons.style.display = 'flex';
        if (multiplayerSection) multiplayerSection.style.display = 'none';
    }
    
    // Expose game methods for compatibility
    endTurn() {
        if (this.game && this.game.endTurn) {
            this.game.endTurn();
        }
    }
    
    updateDisplay() {
        if (this.game && this.game.updateDisplay) {
            this.game.updateDisplay();
        }
    }
    
    // Expose other game methods that might be called
    handleCardClick(card, isPlayerCard) {
        if (this.game && this.game.handleCardClick) {
            return this.game.handleCardClick(card, isPlayerCard);
        }
    }
    
    handleFieldClick(target) {
        if (this.game && this.game.handleFieldClick) {
            return this.game.handleFieldClick(target);
        }
    }
}

// Make both classes available globally
window.NetworkManager = NetworkManager;
window.MultiplayerGame = MultiplayerGame;
console.log('✅ NetworkManager loaded successfully (fallback version)');
console.log('✅ MultiplayerGame loaded successfully (fallback version)');
