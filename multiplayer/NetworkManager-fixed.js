@echo off
cls
echo ================================================================
echo   MULTIPLAYER FIX - CARDS NOT LOADING
echo ================================================================
echo.
echo This will fix the issue where cards don't appear in multiplayer.
echo.
pause

echo.
echo [STEP 1] Backing up current files...
if not exist "backup" mkdir backup
copy /Y "electron-main.js" "backup\electron-main-before-fix.js" >nul 2>&1
copy /Y "js\multiplayer\NetworkManager.js" "backup\NetworkManager-before-fix.js" >nul 2>&1
echo ✓ Backup created

echo.
echo [STEP 2] Creating fixed NetworkManager...
<function_calls>
<invoke name="Filesystem:write_file">
<parameter name="content">// Fixed NetworkManager that properly sends deck initialization

class NetworkManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.currentRoom = null;
        this.roomId = null;
        this.isHost = false;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onMatchFound = null;
        this.onGameUpdate = null;
        this.onError = null;
    }

    connect(serverUrl = 'http://localhost:8080') {
        return new Promise((resolve, reject) => {
            try {
                // Load Socket.io client library
                if (typeof io === 'undefined') {
                    this.loadSocketIO().then(() => {
                        this.initializeSocket(serverUrl, resolve, reject);
                    }).catch(reject);
                } else {
                    this.initializeSocket(serverUrl, resolve, reject);
                }
            } catch (error) {
                reject(error);
            }
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
                // Fallback to CDN
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
        console.log(`🔌 Connecting to ${serverUrl}...`);
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling']
        });
        
        // Make socket globally accessible for debugging
        window.socket = this.socket;

        this.socket.on('connect', () => {
            console.log('🌐 Connected to multiplayer server!');
            this.isConnected = true;
            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
        });

        this.socket.on('connected', (data) => {
            this.playerId = data.playerId;
            console.log(`🆔 Player ID assigned: ${this.playerId}`);
            resolve(this.playerId);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from multiplayer server');
            this.isConnected = false;
            this.currentRoom = null;
            this.roomId = null;
            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        this.socket.on('error', (error) => {
            console.error('❌ Network error:', error);
            if (this.onError) {
                this.onError(error);
            }
        });

        this.socket.on('matchmaking', (data) => {
            console.log('🔍 Matchmaking:', data);
            if (this.onMatchFound) {
                this.onMatchFound({ status: 'searching', message: data.status });
            }
        });

        this.socket.on('matchFound', (data) => {
            console.log('🎯 Match found!', data);
            this.currentRoom = data.roomId;
            this.roomId = data.roomId;
            this.isHost = data.playerIndex === 0;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'found', 
                    roomId: data.roomId,
                    playerIndex: data.playerIndex,
                    isHost: this.isHost,
                    opponentId: data.opponentId,
                    initialState: data.initialState,
                    yourTurn: data.yourTurn
                });
            }
        });

        this.socket.on('gameStart', (data) => {
            console.log('🎮 Game starting!', data);
            this.currentRoom = data.roomId;
            this.roomId = data.roomId;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'gameStart', 
                    roomId: data.roomId,
                    state: data.state
                });
            }
        });

        this.socket.on('roomCreated', (data) => {
            console.log('🏠 Room created:', data.roomId);
            this.currentRoom = data.roomId;
            this.roomId = data.roomId;
            this.isHost = true;
            
            if (this.onMatchFound) {
                this.onMatchFound({ 
                    status: 'roomCreated', 
                    roomId: data.roomId,
                    message: data.message,
                    isHost: true,
                    initialState: data.initialState
                });
            }
        });

        this.socket.on('roomJoined', (data) => {
            console.log('🚪 Joined room:', data.roomId);
            this.currentRoom = data.roomId;
            this.roomId = data.roomId;
            this.isHost = false;
            
            if (this.onMatchFound) {
                this.onMatchFound({
                    status: 'roomJoined',
                    roomId: data.roomId,
                    playerIndex: data.playerIndex,
                    initialState: data.initialState
                });
            }
        });

        this.socket.on('opponentJoined', (data) => {
            console.log('👥 Opponent joined!', data);
            if (this.onMatchFound) {
                this.onMatchFound({
                    status: 'opponentJoined',
                    opponentId: data.opponentId
                });
            }
        });

        // CRITICAL: Handle gameStateUpdate which contains card data
        this.socket.on('gameStateUpdate', (data) => {
            console.log('🔄 Game state update received:', data);
            console.log('  State exists:', !!data.state);
            console.log('  Last action:', data.lastAction?.type);
            console.log('  Your turn:', data.yourTurn);
            console.log('  Full sync:', data.fullSync);
            
            if (data.state && data.state.players) {
                const myIndex = window.game?.playerIndex ?? 0;
                const myState = data.state.players[myIndex];
                if (myState) {
                    console.log(`  My state (Player ${myIndex + 1}):`);
                    console.log(`    Hand: ${myState.hand?.length || 0} cards`);
                    console.log(`    Deck: ${myState.deck?.length || 0} cards`);
                    console.log(`    Field: ${myState.field?.length || 0} creatures`);
                    console.log(`    Health: ${myState.health}`);
                    console.log(`    Mana: ${myState.mana}/${myState.maxMana}`);
                }
            }
            
            if (this.onGameUpdate) {
                this.onGameUpdate(data);
            }
        });

        this.socket.on('opponentDisconnected', () => {
            console.log('👋 Opponent disconnected');
            if (this.onError) {
                this.onError('Your opponent disconnected from the game');
            }
        });

        // Connection timeout
        setTimeout(() => {
            if (!this.isConnected) {
                reject(new Error('Connection timeout - could not reach server'));
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

        console.log(`🚪 Joining room: ${roomId}`);
        this.socket.emit('joinRoom', { roomId });
    }

    sendGameAction(action) {
        if (!this.isConnected) {
            console.error('❌ Cannot send action - not connected');
            throw new Error('Not connected to server');
        }

        console.log('📤 Sending game action:', action.type);
        
        // Special handling for initDeck
        if (action.type === 'initDeck') {
            console.log('📦 Sending deck initialization');
            console.log('  Deck size:', action.deck?.length || 0);
            console.log('  Room ID:', this.roomId || 'not set');
            
            // Send directly to socket
            this.socket.emit('gameAction', {
                roomId: this.roomId || this.currentRoom,
                action: action
            });
            
            // Also log the first few cards for debugging
            if (action.deck && action.deck.length > 0) {
                console.log('  Sample cards:', action.deck.slice(0, 3).map(c => c.name).join(', '));
            }
        } else {
            // For other actions, require room ID
            if (!this.roomId && !this.currentRoom) {
                console.error('❌ Cannot send action - not in a game room');
                throw new Error('Not in a game room');
            }
            
            this.socket.emit('gameAction', {
                roomId: this.roomId || this.currentRoom,
                action: action
            });
        }
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting from server...');
            this.socket.disconnect();
        }
        this.isConnected = false;
        this.playerId = null;
        this.currentRoom = null;
        this.roomId = null;
        this.isHost = false;
    }

    // Getters
    getPlayerId() {
        return this.playerId;
    }

    getCurrentRoom() {
        return this.currentRoom;
    }

    isInGame() {
        return this.isConnected && (this.currentRoom !== null || this.roomId !== null);
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            playerId: this.playerId,
            roomId: this.roomId || this.currentRoom,
            isHost: this.isHost
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NetworkManager };
} else {
    window.NetworkManager = NetworkManager;
}
