// NetworkManager Patch for Enhanced Server Compatibility
// Add this to fix matchmaking with enhanced-multiplayer-server.js

(function() {
    // Wait for NetworkManager to be defined
    const patchNetworkManager = () => {
        if (typeof NetworkManager === 'undefined') {
            setTimeout(patchNetworkManager, 100);
            return;
        }

        // Store original initializeSocket
        const originalInitSocket = NetworkManager.prototype.initializeSocket;
        
        // Override with patched version
        NetworkManager.prototype.initializeSocket = function(serverUrl, resolve, reject) {
            // Call original
            originalInitSocket.call(this, serverUrl, resolve, reject);
            
            // Add handler for matchFound event from enhanced server
            this.socket.on('matchFound', (data) => {
                console.log('🎯 Match found!', data);
                this.currentRoom = data.roomId;
                this.isHost = data.playerIndex === 0;
                
                // Store initial state if provided
                if (data.initialState) {
                    window.lastGameState = data.initialState;
                }
                
                if (this.onMatchFound) {
                    this.onMatchFound({ 
                        status: 'found', 
                        roomId: data.roomId,
                        playerIndex: data.playerIndex,
                        isHost: this.isHost,
                        opponentId: data.opponentId
                    });
                }
            });

            // gameStateUpdate is now handled in the main NetworkManager.js
            // No need to duplicate it here

            // Add handler for gameOver event
            this.socket.on('gameOver', (data) => {
                console.log('🏁 Game over:', data);
                if (this.onGameUpdate) {
                    this.onGameUpdate({
                        gameOver: true,
                        winner: data.winner,
                        finalState: data.finalState
                    });
                }
            });

            // Handle opponentJoined for private rooms
            this.socket.on('opponentJoined', (data) => {
                console.log('👥 Opponent joined:', data);
                if (this.onMatchFound) {
                    this.onMatchFound({ 
                        status: 'opponentJoined', 
                        opponentId: data.opponentId
                    });
                }
            });

            // Handle opponentDisconnected
            this.socket.on('opponentDisconnected', (data) => {
                console.log('👋 Opponent disconnected:', data);
                if (this.onError) {
                    this.onError('Your opponent disconnected from the game');
                }
                
                // Return to matchmaking or menu
                if (this.onMatchFound) {
                    this.onMatchFound({ 
                        status: 'disconnected'
                    });
                }
            });
        };

        console.log('✅ NetworkManager patched for enhanced server compatibility');
    };

    // Start patching process
    patchNetworkManager();
})();