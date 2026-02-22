// MultiplayerManager - Fixed version with NetworkManager fallback
class MultiplayerManager {
    constructor() {
        this.serverUrl = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080';
        this.networkManager = null;
        this.currentGame = null;
        this.isConnected = false;
    }

    // Initialize multiplayer functionality
    async init() {
        console.log('🎮 Initializing Multiplayer Manager...');
        
        // Ensure NetworkManager is available
        const ready = await this.ensureNetworkManager();
        if (!ready) {
            console.error('❌ Failed to initialize NetworkManager');
            throw new Error('NetworkManager not available');
        }
        
        // Set up UI callbacks
        this.setupUICallbacks();
        
        // Auto-connect if server is available
        await this.checkServerAndConnect();
        
        return this;
    }
    
    // Ensure NetworkManager is available
    async ensureNetworkManager() {
        // Check if NetworkManager class exists
        if (typeof window.NetworkManager !== 'undefined') {
            console.log('✅ NetworkManager class found');
            this.networkManager = new window.NetworkManager();
            return true;
        }
        
        // Create fallback NetworkManager
        console.warn('⚠️ NetworkManager not found, creating fallback...');
        this.createFallbackNetworkManager();
        
        return this.networkManager !== null;
    }
    
    createFallbackNetworkManager() {
        // Define NetworkManager inline as complete fallback
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
                console.log('📡 [Fallback] NetworkManager created');
            }
            
            connect(url = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080') {
                return new Promise((resolve, reject) => {
                    console.log('🔌 [Fallback] Connecting to:', url);
                    
                    // Load Socket.io if needed
                    const loadSocketIO = (callback) => {
                        if (typeof io !== 'undefined') {
                            callback();
                            return;
                        }
                        
                        const sources = [
                            'https://cdn.socket.io/4.7.2/socket.io.min.js',
                            '/socket.io/socket.io.js'
                        ];
                        
                        let sourceIndex = 0;
                        const tryNextSource = () => {
                            if (sourceIndex >= sources.length) {
                                reject('Failed to load Socket.io');
                                return;
                            }
                            
                            const script = document.createElement('script');
                            script.src = sources[sourceIndex];
                            script.onload = () => {
                                console.log('✅ Socket.io loaded');
                                callback();
                            };
                            script.onerror = () => {
                                sourceIndex++;
                                tryNextSource();
                            };
                            document.head.appendChild(script);
                        };
                        
                        tryNextSource();
                    };
                    
                    loadSocketIO(() => {
                        this.socket = io(url, {
                            transports: ['websocket', 'polling']
                        });
                        
                        window.socket = this.socket;
                        
                        this.socket.on('connect', () => {
                            this.isConnected = true;
                            console.log('✅ Connected!');
                            if (this.onConnectionChange) this.onConnectionChange(true);
                        });
                        
                        this.socket.on('connected', (data) => {
                            this.playerId = data.playerId;
                            resolve(this.playerId);
                        });
                        
                        this.socket.on('matchFound', (data) => {
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
                        });
                        
                        this.socket.on('gameStateUpdate', (data) => {
                            if (this.onGameUpdate) this.onGameUpdate(data);
                        });
                        
                        this.socket.on('disconnect', () => {
                            this.isConnected = false;
                            this.roomId = null;
                            if (this.onConnectionChange) this.onConnectionChange(false);
                        });
                        
                        setTimeout(() => {
                            if (!this.isConnected) reject('Connection timeout');
                        }, 5000);
                    });
                });
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
                    if (this.roomId) action.roomId = this.roomId;
                    this.socket.emit('gameAction', { roomId: this.roomId, action });
                }
            }
            
            disconnect() {
                if (this.socket) {
                    this.socket.disconnect();
                    this.isConnected = false;
                    this.playerId = null;
                    this.roomId = null;
                }
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
        
        // Create the fallback instance
        this.networkManager = new window.NetworkManager();
        console.log('✅ Fallback NetworkManager ready');
    }
    
    // Check if server is running and connect
    async checkServerAndConnect() {
        try {
            // Try to fetch from the server
            const response = await fetch(this.serverUrl, { 
                method: 'HEAD',
                mode: 'no-cors'
            }).catch(() => null);
            
            console.log('🔍 Server appears to be running, attempting connection...');
            await this.connect();
        } catch (error) {
            console.log('⚠️ Server not detected. Start the server from Multiplayer menu');
            this.updateConnectionStatus(false, 'Server not running');
        }
    }

    // Connect to the multiplayer server
    async connect() {
        if (this.isConnected) {
            console.log('Already connected');
            return;
        }

        // Ensure NetworkManager exists
        if (!this.networkManager) {
            const ready = await this.ensureNetworkManager();
            if (!ready) {
                throw new Error('NetworkManager not available. Please refresh the page.');
            }
        }

        try {
            console.log(`🔌 Connecting to ${this.serverUrl}...`);
            
            // Connect using NetworkManager
            const playerId = await this.networkManager.connect(this.serverUrl);
            
            this.isConnected = true;
            this.updateConnectionStatus(true, 'Connected');
            
            // Set up network event handlers
            this.setupNetworkHandlers();
            
            console.log(`✅ Connected with player ID: ${playerId}`);
            
            // Enable multiplayer buttons
            this.enableMultiplayerButtons();
            
            return playerId;
        } catch (error) {
            console.error('❌ Connection failed:', error);
            this.updateConnectionStatus(false, error.message || 'Connection failed');
            
            // Show helpful error message
            if (error.message && error.message.includes('timeout')) {
                this.showHTMLError('Could Not Connect to Server', 'Please make sure the server is running:\n\nClick Multiplayer menu → Start Server\nor run: node backend\\secure-server.js');
            }
            
            throw error;
        }
    }
    
    showHTMLError(title, message) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10001;';
        
        modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%; color: #333; text-align: center;">' +
            '<div style="font-size: 60px; margin-bottom: 20px;">❌</div>' +
            '<h2 style="color: #f44336; margin-bottom: 20px;">' + title + '</h2>' +
            '<p style="margin-bottom: 15px; line-height: 1.6; white-space: pre-line;">' + message + '</p>' +
            '<button id="multiplayerErrorBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        document.getElementById('multiplayerErrorBtn').onclick = () => {
            modal.remove();
        };
    }

    // Set up network event handlers
    setupNetworkHandlers() {
        if (!this.networkManager) return;

        this.networkManager.onConnectionChange = (connected) => {
            this.isConnected = connected;
            this.updateConnectionStatus(connected, connected ? 'Connected' : 'Disconnected');
            
            if (!connected) {
                this.disableMultiplayerButtons();
            }
        };

        this.networkManager.onMatchFound = (data) => {
            console.log('🎯 Match event:', data);
            
            switch(data.status) {
                case 'searching':
                    this.showMatchmaking('Searching for opponent...', data.message);
                    break;
                case 'found':
                    this.hideMatchmaking();
                    // Show deck selection instead of immediately starting
                    this.showDeckSelection(data);
                    break;
                case 'roomCreated':
                    this.showRoomInfo(data.roomId, data.message);
                    break;
                case 'roomJoined':
                    this.hideMatchmaking();
                    this.showRoomInfo(data.roomId, 'Joined room successfully');
                    break;
            }
        };

        this.networkManager.onError = (error) => {
            console.error('⚠️ Network error:', error);
            this.showError(error);
        };
    }

    // Start a multiplayer game
    startMultiplayerGame(matchData) {
        console.log('🎮 Starting multiplayer game:', matchData);
        
        // Hide menu
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('multiplayerSection').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('gameLog').style.display = 'block';
        
        // Get the player's deck
        const currentDeck = this.getDeck();
        
        // Create multiplayer game instance
        if (typeof MultiplayerGame !== 'undefined') {
            this.currentGame = new MultiplayerGame(
                currentDeck,
                this.networkManager,
                matchData.playerIndex
            );
        } else {
            console.error('MultiplayerGame class not found');
            alert('Game initialization error. Please refresh the page.');
            return;
        }
        
        // Store globally for debugging
        window.game = this.currentGame;
        
        // Initialize game display
        this.currentGame.updateDisplay();
        
        console.log('✅ Multiplayer game initialized');
    }

    // Get deck from various sources
    getDeck() {
        // Try multiple sources
        if (window.gameManager?.currentDeck?.length > 0) {
            console.log('📚 Using deck from gameManager');
            return window.gameManager.currentDeck;
        }
        
        if (window.deckbuilder && typeof window.deckbuilder.getDeck === 'function') {
            try {
                const deck = window.deckbuilder.getDeck();
                if (deck && deck.length > 0) {
                    console.log('📚 Using deck from deckbuilder');
                    return deck;
                }
            } catch (e) {
                console.warn('deckbuilder.getDeck failed:', e);
            }
        }
        
        // Create default deck from owned cards
        console.log('📚 Creating deck from owned cards');
        const defaultDeck = [];
        
        if (window.storage && window.storage.playerData && window.storage.playerData.ownedCards) {
            const ownedCardsList = [];
            for (const [cardName, count] of Object.entries(window.storage.playerData.ownedCards)) {
                const cardTemplate = window.ALL_CARDS.find(c => c.name === cardName);
                if (cardTemplate) {
                    for (let i = 0; i < count; i++) {
                        ownedCardsList.push(cardTemplate);
                    }
                }
            }
            
            // Create a 30-card deck from owned cards
            const shuffled = [...ownedCardsList].sort(() => Math.random() - 0.5);
            for (const card of shuffled) {
                if (defaultDeck.length >= 30) break;
                const copiesInDeck = defaultDeck.filter(c => c.name === card.name).length;
                const maxCopies = card.rarity === 'legendary' ? 1 : 2;
                if (copiesInDeck < maxCopies) {
                    if (typeof Card !== 'undefined') {
                        defaultDeck.push(new Card(card));
                    } else {
                        defaultDeck.push(card);
                    }
                }
            }
        }
        
        // Only fall back to generic cards if we couldn't create from owned cards
        if (defaultDeck.length < 30) {
            console.log('📚 Falling back to generic cards');
            const cardTypes = ['creature', 'spell'];
            const cardNames = ['Fire Drake', 'Lightning Bolt', 'Heal', 'Shield', 'Goblin', 'Knight'];
            const emojis = ['🔥', '⚡', '💚', '🛡️', '👺', '⚔️'];
            
            for (let i = 0; i < 30; i++) {
                const cardData = {
                    name: cardNames[i % cardNames.length] + ' ' + Math.floor(i / cardNames.length),
                    cost: (i % 5) + 1,
                    type: cardTypes[i % 2],
                    attack: (i % 4) + 1,
                    health: (i % 4) + 2,
                    emoji: emojis[i % emojis.length],
                    rarity: i < 20 ? 'common' : 'rare',
                    ability: null
                };
                
                if (typeof Card !== 'undefined') {
                    defaultDeck.push(new Card(cardData));
                } else {
                    defaultDeck.push(cardData);
                }
            }
        }
        
        return defaultDeck;
    }

    // UI Update Methods
    updateConnectionStatus(connected, text) {
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + (connected ? 'connected' : 'disconnected');
            statusIndicator.textContent = connected ? '🟢' : '🔴';
        }
        
        if (statusText) {
            statusText.textContent = text || (connected ? 'Connected' : 'Disconnected');
        }
    }

    enableMultiplayerButtons() {
        const findMatchBtn = document.getElementById('findMatchBtn');
        const createRoomBtn = document.getElementById('createRoomBtn');
        const connectBtn = document.getElementById('connectBtn');
        
        if (findMatchBtn) findMatchBtn.disabled = false;
        if (createRoomBtn) createRoomBtn.disabled = false;
        if (connectBtn) {
            connectBtn.textContent = 'Connected ✓';
            connectBtn.disabled = true;
        }
    }

    disableMultiplayerButtons() {
        const findMatchBtn = document.getElementById('findMatchBtn');
        const createRoomBtn = document.getElementById('createRoomBtn');
        const connectBtn = document.getElementById('connectBtn');
        
        if (findMatchBtn) findMatchBtn.disabled = true;
        if (createRoomBtn) createRoomBtn.disabled = true;
        if (connectBtn) {
            connectBtn.textContent = 'Connect to Server';
            connectBtn.disabled = false;
        }
    }

    showMatchmaking(text, subtext) {
        const overlay = document.getElementById('matchmakingOverlay');
        const matchmakingText = document.getElementById('matchmakingText');
        const matchmakingSubtext = document.getElementById('matchmakingSubtext');
        
        if (overlay) overlay.style.display = 'flex';
        if (matchmakingText) matchmakingText.textContent = text;
        if (matchmakingSubtext) matchmakingSubtext.textContent = subtext || '';
    }

    hideMatchmaking() {
        const overlay = document.getElementById('matchmakingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showRoomInfo(roomId, message) {
        const roomInfo = document.getElementById('roomInfo');
        const roomInfoText = document.getElementById('roomInfoText');
        
        if (roomInfo) roomInfo.style.display = 'block';
        if (roomInfoText) {
            roomInfoText.innerHTML = `
                <strong>Room ID:</strong> ${roomId}<br>
                <strong>Status:</strong> ${message}<br>
                <small>Share this Room ID with a friend!</small>
            `;
        }
    }

    showError(error) {
        console.error('Error:', error);
        const errorMsg = typeof error === 'string' ? error : (error.message || 'Unknown error');
        
        // Show HTML modal for all errors (no more native alerts)
        if (errorMsg.includes('disconnect') || errorMsg.includes('timeout') || errorMsg.includes('connect')) {
            this.showHTMLError('Multiplayer Error', errorMsg);
        }
    }

    // Setup UI callbacks
    setupUICallbacks() {
        window.multiplayer = {
            connect: () => this.connect(),
            findMatch: () => this.findMatch(),
            createRoom: () => this.createRoom(),
            joinRoom: () => this.joinRoom(),
            showRoomDialog: () => this.showRoomDialog(),
            closeRoomDialog: () => this.closeRoomDialog(),
            leaveRoom: () => this.leaveRoom(),
            cancelMatchmaking: () => this.cancelMatchmaking(),
            selectRandomDeck: () => this.selectRandomDeck(),
            cancelDeckSelection: () => this.cancelDeckSelection()
        };
    }

    // Show deck selection UI
    showDeckSelection(matchData) {
        console.log('📚 Showing deck selection...');
        
        // Store match data
        this.currentMatchData = matchData;
        this.selectedDeck = null;
        this.deckSelectionTimer = 30;
        this.opponentReady = false;
        
        // Show deck selection modal
        const modal = document.getElementById('deckSelectionModal');
        modal.style.display = 'flex';
        
        // Reset status
        document.getElementById('yourDeckStatus').textContent = 'Selecting...';
        document.getElementById('yourDeckStatus').className = '';
        document.getElementById('opponentDeckStatus').textContent = 'Selecting...';
        document.getElementById('opponentDeckStatus').className = '';
        
        // Load saved decks
        const savedDecks = window.storage ? window.storage.loadDecks() : [];
        const deckGrid = document.getElementById('deckSelectionGrid');
        deckGrid.innerHTML = '';
        
        if (savedDecks && savedDecks.length > 0) {
            // Display saved decks
            savedDecks.forEach((deck, index) => {
                const deckOption = document.createElement('div');
                deckOption.className = 'deck-option';
                deckOption.innerHTML = `
                    <div class="deck-name">${deck.name || 'Deck ' + (index + 1)}</div>
                    <div class="deck-info">${deck.cards ? deck.cards.length : 30} cards</div>
                `;
                deckOption.onclick = () => this.selectDeck(deck, deckOption);
                deckGrid.appendChild(deckOption);
            });
        } else {
            // No saved decks message
            deckGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #bdc3c7;">
                    <p>No saved decks found.</p>
                    <p>Use the random deck option below!</p>
                </div>
            `;
        }
        
        // Start countdown timer
        this.startDeckSelectionTimer();
        
        // Listen for opponent's deck selection
        this.listenForOpponentDeckSelection();
    }
    
    // Select a deck
    selectDeck(deck, element) {
        console.log('🎴 Deck selected:', deck.name);
        
        // Remove previous selection
        document.querySelectorAll('.deck-option').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Mark as selected
        if (element) {
            element.classList.add('selected');
        }
        
        // Store selected deck
        this.selectedDeck = deck;
        
        // Update status
        document.getElementById('yourDeckStatus').textContent = '✓ Ready';
        document.getElementById('yourDeckStatus').className = 'ready';
        
        // Send deck selection to server
        this.sendDeckSelection(deck);
    }
    
    // Select random deck from owned cards
    selectRandomDeck() {
        console.log('🎲 Selecting random deck...');
        
        // Create deck using the existing getDeck method
        const randomDeckCards = this.getDeck();
        const randomDeck = { 
            name: 'Random Deck', 
            cards: randomDeckCards 
        };
        
        this.selectDeck(randomDeck, null);
    }
    
    // Cancel deck selection
    cancelDeckSelection() {
        console.log('❌ Deck selection cancelled');
        
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Hide modal
        document.getElementById('deckSelectionModal').style.display = 'none';
        
        // Disconnect from match
        if (this.networkManager) {
            this.networkManager.sendGameAction({
                type: 'cancelMatch'
            });
        }
        
        // Reset status
        this.selectedDeck = null;
        this.currentMatchData = null;
    }
    
    // Start countdown timer
    startDeckSelectionTimer() {
        // Clear any existing timer first
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const timerElement = document.getElementById('deckSelectionTimer');
        timerElement.textContent = this.deckSelectionTimer;
        
        this.timerInterval = setInterval(() => {
            this.deckSelectionTimer--;
            timerElement.textContent = this.deckSelectionTimer;
            
            // Change color as time runs out
            if (this.deckSelectionTimer <= 10) {
                timerElement.parentElement.style.background = 'rgba(255, 0, 0, 0.4)';
            }
            
            // Auto-select random deck when time runs out
            if (this.deckSelectionTimer <= 0) {
                clearInterval(this.timerInterval);
                if (!this.selectedDeck) {
                    console.log('⏰ Time up! Auto-selecting random deck...');
                    this.selectRandomDeck();
                }
            }
        }, 1000);
    }
    
    // Send deck selection to server
    sendDeckSelection(deck) {
        if (!this.networkManager || !deck) return;
        
        console.log('📤 Sending deck selection to server...');
        
        // Convert deck to simple format for transmission
        const deckData = deck.cards.map(card => ({
            name: card.name,
            cost: card.cost,
            type: card.type,
            attack: card.attack,
            health: card.health,
            ability: card.ability,
            emoji: card.emoji,
            rarity: card.rarity
        }));
        
        this.networkManager.sendGameAction({
            type: 'deckSelected',
            deck: deckData,
            deckName: deck.name
        });
        
        // Check if both players are ready
        this.checkBothPlayersReady();
    }
    
    // Listen for opponent's deck selection
    listenForOpponentDeckSelection() {
        if (!this.networkManager) return;
        
        // Store original handler
        const originalOnGameUpdate = this.networkManager.onGameUpdate;
        
        // Set up listener for opponent's deck selection
        this.networkManager.onGameUpdate = (data) => {
            console.log('🔍 Deck selection update:', data.type || 'stateUpdate');
            
            // Handle new embedded server events
            if (data.type === 'opponentDeckSelected') {
                console.log('👥 Opponent selected deck');
                document.getElementById('opponentDeckStatus').textContent = '✓ Ready';
                document.getElementById('opponentDeckStatus').className = 'ready';
                this.opponentReady = true;
                this.checkBothPlayersReady();
            } else if (data.type === 'gameStart' || data.gameStarted || (data.state && data.state.gameStarted)) {
                // Handle game start from either server type
                console.log('🎮 Server confirmed game start!');
                
                // Clear timer if it's still running
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                }
                
                // Hide deck selection modal
                document.getElementById('deckSelectionModal').style.display = 'none';
                
                // Restore original handler
                this.networkManager.onGameUpdate = originalOnGameUpdate;
                
                // Handle game start
                this.handleGameStart(data);
            } else if (originalOnGameUpdate) {
                // Pass through other updates (maintains web app compatibility)
                originalOnGameUpdate(data);
            }
        };
    }
    
    // Handle game start
    handleGameStart(data) {
        console.log('🎮 Game starting with selected decks!');
        
        // Hide deck selection modal
        document.getElementById('deckSelectionModal').style.display = 'none';
        
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Only start the game if we haven't already
        if (!this.currentGame) {
            // Use selected deck or fallback to default
            const deckToUse = this.selectedDeck || { 
                name: 'Auto-selected Deck', 
                cards: this.getDeck() 
            };
            
            // Start the game
            this.startMultiplayerGameWithDeck(this.currentMatchData, deckToUse);
        } else {
            console.log('✓ Game already started');
            // Update game state with server data
            if (data.state && this.currentGame) {
                this.currentGame.handleStateUpdate(data);
            }
        }
    }
    
    // Check if both players are ready
    checkBothPlayersReady() {
        if (this.selectedDeck && this.opponentReady) {
            console.log('✅ Both players ready! Waiting for server to start game...');
            
            // Update status text to show we're waiting
            const timerElement = document.getElementById('deckSelectionTimer');
            if (timerElement) {
                timerElement.textContent = 'Starting...';
            }
            
            // Don't start game locally - wait for server confirmation
            // The server will send 'gameStart' when both are ready
        }
    }
    
    // Start multiplayer game with selected deck
    startMultiplayerGameWithDeck(matchData, selectedDeck) {
        console.log('🎮 Starting multiplayer with selected deck:', selectedDeck.name);
        
        // Hide menu
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('multiplayerSection').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('gameLog').style.display = 'block';
        
        // Use the selected deck
        const currentDeck = selectedDeck.cards;
        
        // Create multiplayer game instance
        if (typeof MultiplayerGame !== 'undefined') {
            this.currentGame = new MultiplayerGame(
                currentDeck,
                this.networkManager,
                matchData.playerIndex
            );
        } else {
            console.error('MultiplayerGame class not found');
            alert('Game initialization error. Please refresh the page.');
            return;
        }
        
        // Store globally for debugging
        window.game = this.currentGame;
        
        // CRITICAL FIX: Don't send initDeck here - we already sent deckSelected!
        // The server already initialized the deck when we sent deckSelected
        // Sending initDeck again would draw another 5 cards (total 10)
        console.log('✅ Deck already sent via deckSelected - skipping initDeck to prevent double draw');
        
        // Initialize game display
        this.currentGame.updateDisplay();
        
        console.log('✅ Multiplayer game initialized with selected deck');
    }

    // Multiplayer Actions
    async findMatch() {
        if (!this.isConnected) {
            try {
                await this.connect();
            } catch (error) {
                this.showError('Please connect to server first');
                return;
            }
        }
        
        console.log('🔍 Finding match...');
        this.networkManager.findMatch();
        this.showMatchmaking('Looking for opponent...', 'Please wait');
    }

    async createRoom() {
        if (!this.isConnected) {
            try {
                await this.connect();
            } catch (error) {
                this.showError('Please connect to server first');
                return;
            }
        }
        
        console.log('🏠 Creating private room...');
        this.networkManager.createPrivateRoom();
        this.closeRoomDialog();
    }

    async joinRoom() {
        if (!this.isConnected) {
            try {
                await this.connect();
            } catch (error) {
                this.showError('Please connect to server first');
                return;
            }
        }
        
        const roomIdInput = document.getElementById('roomIdInput');
        const roomId = roomIdInput ? roomIdInput.value.trim().toUpperCase() : '';
        
        if (!roomId) {
            this.showError('Please enter a room ID');
            return;
        }
        
        console.log(`🚪 Joining room: ${roomId}`);
        this.networkManager.joinPrivateRoom(roomId);
        this.closeRoomDialog();
        this.showMatchmaking('Joining room...', `Room ID: ${roomId}`);
    }

    showRoomDialog() {
        const modal = document.getElementById('roomModal');
        if (modal) modal.style.display = 'flex';
    }

    closeRoomDialog() {
        const modal = document.getElementById('roomModal');
        if (modal) modal.style.display = 'none';
        
        const roomIdInput = document.getElementById('roomIdInput');
        if (roomIdInput) roomIdInput.value = '';
    }

    leaveRoom() {
        if (this.networkManager) {
            this.networkManager.disconnect();
            this.isConnected = false;
            this.updateConnectionStatus(false, 'Disconnected');
            this.disableMultiplayerButtons();
        }
        
        const roomInfo = document.getElementById('roomInfo');
        if (roomInfo) roomInfo.style.display = 'none';
    }

    cancelMatchmaking() {
        this.hideMatchmaking();
        console.log('Matchmaking cancelled');
    }
}

// Fix for deckbuilder compatibility
if (!window.deckbuilder || typeof window.deckbuilder.getDeck !== 'function') {
    window.deckbuilder = window.deckbuilder || {};
    window.deckbuilder.getDeck = function() {
        return null; // MultiplayerManager will handle creating default deck
    };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Initializing Multiplayer...');
        
        window.multiplayerManager = new MultiplayerManager();
        
        try {
            await window.multiplayerManager.init();
            console.log('✅ Multiplayer ready!');
        } catch (error) {
            console.error('❌ Failed to initialize multiplayer:', error);
        }
    });
} else {
    // DOM already loaded
    console.log('🚀 Initializing Multiplayer (immediate)...');
    
    window.multiplayerManager = new MultiplayerManager();
    
    window.multiplayerManager.init().then(() => {
        console.log('✅ Multiplayer ready!');
    }).catch(error => {
        console.error('❌ Failed to initialize multiplayer:', error);
    });
}

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerManager;
} else {
    window.MultiplayerManager = MultiplayerManager;
}