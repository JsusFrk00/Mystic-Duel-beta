// MultiplayerGame class - Extends base Game for multiplayer functionality
class MultiplayerGame extends Game {
    constructor(playerDeck, networkManager, playerIndex) {
        super(playerDeck);
        
        // Clear hands immediately after super() to prevent base Game from drawing 10 cards total
        this.playerHand = [];
        this.aiHand = [];
        
        // Make this game instance globally accessible for UI buttons
        window.game = this;
        
        this.networkManager = networkManager;
        this.playerIndex = playerIndex; // 0 or 1
        this.isMyTurn = (playerIndex === 0); // Player 0 starts
        this.opponentReady = false;
        this.currentTurn = (playerIndex === 0) ? 'player' : 'ai'; // Set initial turn
        
        // Set correct health for both players
        this.playerHealth = 30;
        this.playerMaxHealth = 30;
        this.aiHealth = 30; // This is actually the opponent  
        this.aiMaxHealth = 30;
        
        // In multiplayer, the server handles all initial card drawing
        // Wait for server to send initial game state with drawn hands
        console.log(`🎮 MultiplayerGame initialized as Player ${playerIndex + 1} - awaiting server state`);
        
        // Override AI name to show it's another player
        this.updateOpponentLabel();
        
        // Set up network event handlers
        this.setupNetworkHandlers();
        
        // Update turn indicator
        this.updateTurnIndicator();
        
        // Disable AI logic
        this.isMultiplayer = true;
        
        // Make sure game log is visible
        const gameLog = document.getElementById('gameLog');
        if (gameLog) {
            gameLog.style.display = 'block';
        }
        
        // Force update the display to show correct health
        // Need to wait for DOM to be ready
        setTimeout(() => {
            this.updateDisplay();
            // Also update the health bars directly to ensure they show 30/30
            const playerHealthBar = document.getElementById('playerHealthBar');
            const playerHealthText = document.getElementById('playerHealthText');
            const aiHealthBar = document.getElementById('aiHealthBar');
            const aiHealthText = document.getElementById('aiHealthText');
            
            if (playerHealthBar) playerHealthBar.style.width = '100%';
            if (playerHealthText) playerHealthText.textContent = '30/30';
            if (aiHealthBar) aiHealthBar.style.width = '100%';
            if (aiHealthText) aiHealthText.textContent = '30/30';
        }, 100);
        
        console.log(`🎮 MultiplayerGame initialized as Player ${playerIndex + 1}`);
        console.log(`  Player health: ${this.playerHealth}/${this.playerMaxHealth}`);
        console.log(`  Opponent health: ${this.aiHealth}/${this.aiMaxHealth}`);
        console.log(`  Initial turn: ${this.isMyTurn ? 'Your turn' : 'Opponent\'s turn'}`);
        console.log(`  currentTurn: ${this.currentTurn}`);
        console.log(`  Initial hand size: ${this.playerHand.length} cards (should be 5 after initial draw)`);
    }
    
    // Override drawCard to track initial draw properly
    drawCard(player) {
        // Just call parent drawCard
        super.drawCard(player);
    }
    
    updateOpponentLabel() {
        // Change the label from "AI Opponent" to show it's another player
        const opponentLabel = document.querySelector('.player-area h3');
        if (opponentLabel && opponentLabel.textContent === 'AI Opponent') {
            const opponentNum = this.playerIndex === 0 ? 2 : 1;
            opponentLabel.textContent = `Opponent (Player ${opponentNum})`;
        }
    }
    
    reapplyAbilityEffects() {
        console.log('🎯 Re-applying ability effects to synced state...');
        
        // Re-apply field creature abilities
        this.playerField.forEach(card => {
            this.applyPassiveAbility(card);
        });
        
        this.aiField.forEach(card => {
            this.applyPassiveAbility(card);
        });
        
        console.log('✅ Ability effects re-applied');
    }
    
    applyPassiveAbility(card) {
        // Apply passive ability flags that server doesn't track
        if (card.ability === 'Taunt') {
            card.taunt = true;
        } else if (card.ability === 'Divine Shield' && card.divineShield === undefined) {
            card.divineShield = true;
        } else if (card.ability === 'Stealth' && card.stealth === undefined) {
            card.stealth = true;
        } else if (card.ability === 'Vigilance') {
            card.vigilance = true;
        } else if (card.ability === 'Spell Shield') {
            card.spellShield = true;
        }
        
        // Trust server state for tapped/combat state - server handles Quick/Rush/Charge correctly
    }
    
    processEnterPlayAbility(card) {
        console.log(`🎯 Processing enter-play ability: ${card.ability} for ${card.name}`);
        
        // Use the parent Game.js method directly - it has all the logic we need
        this.handleEnterPlayAbilities(card, 'player', this.playerField);
    }
    
    processSpellAbility(card) {
        console.log(`🎯 Processing spell ability: ${card.ability} for ${card.name}`);
        
        // Use the parent Game.js method directly - it has all the logic we need
        this.handleSpell(card, 'player');
    }
    
    processCombatAbilities(attacker, target) {
        console.log(`🎯 Processing combat abilities: ${attacker.name} attacks ${target === 'ai' ? 'opponent' : target.name}`);
        
        // Use the parent Game.js combat system directly
        if (target === 'ai') {
            // Direct attack to opponent - use parent logic
            this.dealDamage('ai', attacker.attack);
            
            // Handle lifesteal using parent logic
            if (attacker.ability?.includes('Lifesteal') || attacker.ability?.includes('Lifelink')) {
                this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + attacker.attack);
                this.addLog(`Lifesteal heals for ${attacker.attack}!`);
            }
        } else if (target && this.aiField.includes(target)) {
            // Use parent Game.js creature combat system
            this.creatureCombat(attacker, target);
        }
    }
    
    processTargetedSpell(spellCard, target, isPlayerCard) {
        console.log(`🎯 Processing targeted spell: ${spellCard.ability} targeting ${target === 'ai' ? 'opponent' : target.name}`);
        
        // Use the parent Game.js spell system directly
        if (target === 'ai') {
            this.handleSpell(spellCard, 'player', 'ai');
        } else {
            this.handleSpell(spellCard, 'player', target);
        }
    }
    
    setupNetworkHandlers() {
        // Listen for game updates from the server
        this.networkManager.onGameUpdate = (data) => {
            console.log('📨 Received game update:', data);
            console.log('  Action type:', data.lastAction?.type);
            console.log('  From player:', data.fromPlayer);
            console.log('  Your turn:', data.yourTurn);
            console.log('  Full sync:', data.fullSync);
            
            // Update game state based on server data
            if (data.state) {
                console.log('🔄 Syncing game state:');
                console.log('  My index:', this.playerIndex);
                if (data.state.players && data.state.players[this.playerIndex]) {
                    const myState = data.state.players[this.playerIndex];
                    console.log('  My hand from server:', myState.hand?.length || 0, 'cards');
                    if (Array.isArray(myState.hand) && myState.hand.length > 0) {
                        console.log('  First card:', myState.hand[0]?.name);
                    }
                }
                this.syncGameState(data.state);
            }
            
            // Update turn status
            if (data.yourTurn !== undefined) {
                this.isMyTurn = data.yourTurn;
                this.updateTurnIndicator();
                
                if (data.yourTurn) {
                    this.addLog('🎮 Your turn!');
                } else {
                    this.addLog('⏳ Opponent\'s turn...');
                }
            }
            
            // Handle game over
            if (data.gameOver) {
                console.log('🎮 Game over signal from server!');
                console.log('  Winner index:', data.winner);
                console.log('  My player index:', this.playerIndex);
                console.log('  Did I win?', data.winner === this.playerIndex);
                
                // Don't set gameOver here - let handleGameOver/endGame handle it properly
                // this.gameOver = true;  // REMOVED - was preventing endGame from showing winner screen
                
                // Call handleGameOver with whether THIS player won
                this.handleGameOver(data.winner === this.playerIndex);
            }
        };
    }
    
        syncGameState(state) {
        // Sync health
        if (state.players) {
            const myState = state.players[this.playerIndex];
            const oppState = state.players[1 - this.playerIndex];
            
            this.playerHealth = myState.health;
            this.aiHealth = oppState.health; // Other player
            
            // Check for game over immediately after health sync
            if ((this.playerHealth <= 0 || this.aiHealth <= 0) && !this.gameOver) {
                console.log(`🎮 Game Over detected! Player health: ${this.playerHealth}, Opponent health: ${this.aiHealth}`);
                this.checkGameState();
            }
            
            // Sync mana
            this.playerMana = myState.mana;
            this.playerMaxMana = myState.maxMana;
            this.aiMana = oppState.mana;
            this.aiMaxMana = oppState.maxMana;
            
            // Sync hand if it's an array (not just a length object)
            if (Array.isArray(myState.hand)) {
                this.playerHand = myState.hand.map(cardData => {
                    // Create Card instances from the data, preserving abilities
                    if (window.Card) {
                        const card = new window.Card({
                            name: cardData.name,
                            cost: cardData.cost,
                            type: cardData.type,
                            attack: cardData.attack,
                            health: cardData.health,
                            ability: cardData.ability || "", // Ensure ability is never null/undefined
                            emoji: cardData.emoji,
                            rarity: cardData.rarity
                        });
                        return card;
                    }
                    return cardData;
                });
                console.log(`📋 Synced hand with ${this.playerHand.length} cards`);
                if (this.playerHand.length > 0) {
                    console.log(`  First card: ${this.playerHand[0].name}, ability: "${this.playerHand[0].ability}"`);
                }
            }
            
            // Update opponent hand count
            if (oppState.hand && typeof oppState.hand.length === 'number') {
                // Create placeholder cards for opponent hand display
                this.aiHand = new Array(oppState.hand.length).fill(null);
            }
            
            // Sync field creatures
            if (Array.isArray(myState.field)) {
                this.playerField = myState.field.map(cardData => {
                    if (window.Card) {
                        const card = new window.Card({
                            name: cardData.name,
                            cost: cardData.cost,
                            type: cardData.type,
                            attack: cardData.attack,
                            health: cardData.health,
                            ability: cardData.ability || "", // Ensure ability is never null
                            emoji: cardData.emoji,
                            rarity: cardData.rarity
                        });
                        // Restore ALL combat state properties
                        if (cardData.tapped !== undefined) card.tapped = cardData.tapped;
                        if (cardData.hasAttackedThisTurn !== undefined) card.hasAttackedThisTurn = cardData.hasAttackedThisTurn;
                        if (cardData.justPlayed !== undefined) card.justPlayed = cardData.justPlayed;
                        if (cardData.frozen !== undefined) card.frozen = cardData.frozen;
                        return card;
                    }
                    return cardData;
                });
                console.log(`🃏 My field: ${this.playerField.length} creatures`);
            }
            
            if (Array.isArray(oppState.field)) {
                this.aiField = oppState.field.map(cardData => {
                    if (window.Card) {
                        const card = new window.Card({
                            name: cardData.name,
                            cost: cardData.cost,
                            type: cardData.type,
                            attack: cardData.attack,
                            health: cardData.health,
                            ability: cardData.ability || "", // Ensure ability is never null
                            emoji: cardData.emoji,
                            rarity: cardData.rarity
                        });
                        // Restore ALL combat state properties
                        if (cardData.tapped !== undefined) card.tapped = cardData.tapped;
                        if (cardData.hasAttackedThisTurn !== undefined) card.hasAttackedThisTurn = cardData.hasAttackedThisTurn;
                        if (cardData.justPlayed !== undefined) card.justPlayed = cardData.justPlayed;
                        if (cardData.frozen !== undefined) card.frozen = cardData.frozen;
                        return card;
                    }
                    return cardData;
                });
                console.log(`🃏 Opponent field: ${this.aiField.length} creatures`);
            }
        }
        
        // Update turn number
        if (state.turnNumber !== undefined) {
            this.turn = state.turnNumber;
            this.turnNumber = state.turnNumber;
        }
        
        // Update current turn
        if (state.currentTurn !== undefined) {
            this.currentTurn = (state.currentTurn === this.playerIndex) ? 'player' : 'ai';
            this.isMyTurn = (state.currentTurn === this.playerIndex);
        }
        
        // Re-apply ability effects FIRST
        this.reapplyAbilityEffects();
        
        // Update UI AFTER abilities are applied
        this.updateDisplay();
        
        // Check for game over after any state sync (unless already over)
        if (!this.gameOver) {
            this.checkGameState();
        }
    }
    
    updateTurnIndicator() {
        const turnIndicator = document.getElementById('turnIndicator');
        const endTurnBtn = document.getElementById('endTurnBtn');
        
        if (this.isMyTurn) {
            turnIndicator.textContent = 'Your Turn';
            turnIndicator.style.backgroundColor = '#4CAF50';
            endTurnBtn.disabled = false;
        } else {
            turnIndicator.textContent = "Opponent's Turn";
            turnIndicator.style.backgroundColor = '#ff6b6b';
            endTurnBtn.disabled = true;
        }
    }
    
    // Override endTurn to send to server
    endTurn() {
        // Check for game over before allowing turn end
        this.checkGameState();
        if (this.gameOver) {
            console.log('Cannot end turn - game is over');
            return;
        }
        
        if (!this.isMyTurn) {
            console.log('❌ Not your turn!');
            return;
        }
        
        console.log('📤 Sending end turn to server');
        
        // Send end turn action to server
        try {
            this.networkManager.sendGameAction({
                type: 'endTurn',
                timestamp: Date.now()
            });
            
            // Immediately update UI to show it's not our turn (optimistic)
            this.isMyTurn = false;
            this.updateTurnIndicator();
            
            this.addLog('Turn ended, waiting for opponent...');
        } catch (error) {
            console.error('Failed to send end turn:', error);
            this.addLog('Failed to end turn!');
            // Revert optimistic update
            this.isMyTurn = true;
            this.updateTurnIndicator();
        }
    }
    
    // Override playCard to send to server
    playCard(card, player) {
        // Check for game over
        if (this.gameOver) {
            console.log('Cannot play card - game is over');
            return false;
        }
        
        // Only handle player actions, not AI
        if (player !== 'player') {
            return false;
        }
        
        if (!this.isMyTurn) {
            this.addLog("It's not your turn!");
            return false;
        }
        
        // Check if we have enough mana
        let actualCost = card.cost;
        if (card.ability === 'Costs less per spell') {
            actualCost = Math.max(0, card.cost - this.playerSpellsCount);
        }
        
        if (actualCost > this.playerMana) {
            this.addLog('Not enough mana!');
            return false;
        }
        
        // Check if field is full for creatures
        if (card.type === 'creature' && this.playerField.length >= 7) {
            this.addLog('Field is full!');
            return false;
        }
        
        // Check for targeting spells
        if (card.type === 'spell' && player === 'player') {
            // Handle targeting spells
            if (card.ability && card.ability.includes('Deal')) {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy';
                this.addLog(`Select a target for ${card.name}`);
                this.updateDisplay();
                return false; // Don't play the card yet
            }
            // Handle other targeted spells
            else if (card.ability === 'Steal creature') {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy creature';
                this.addLog(`Select an enemy creature to steal`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Silence') {
                this.pendingSpell = card;
                this.pendingTargetType = 'any creature';
                this.addLog(`Select a creature to silence`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Give +2/+2' || card.ability === 'Give +3/+3') {
                this.pendingSpell = card;
                this.pendingTargetType = 'friendly creature';
                this.addLog(`Select a friendly creature to buff`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Freeze') {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy creature';
                this.addLog(`Select an enemy creature to freeze`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Return to hand') {
                this.pendingSpell = card;
                this.pendingTargetType = 'any creature';
                this.addLog(`Select a creature to return to hand`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Transform') {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy creature';
                this.addLog(`Select an enemy creature to transform`);
                this.updateDisplay();
                return false;
            }
            else if (card.ability === 'Copy creature') {
                this.pendingSpell = card;
                this.pendingTargetType = 'any creature';
                this.addLog(`Select a creature to copy`);
                this.updateDisplay();
                return false;
            }
        }
        
        // Find card index in hand
        const handIndex = this.playerHand.indexOf(card);
        if (handIndex === -1) {
            console.error('Card not found in hand!');
            return false;
        }
        
                // Send play card action to server with complete card data
        this.networkManager.sendGameAction({
            type: 'playCard',
            card: {
                name: card.name,
                cost: card.cost,
                type: card.type,
                attack: card.attack,
                health: card.health,
                ability: card.ability || "", // Ensure ability is never null/undefined  
                emoji: card.emoji,
                rarity: card.rarity,
                justPlayed: card.ability === 'Rush' ? true : undefined
            },
            handIndex: handIndex,
            cardCost: actualCost
        });
        
        // Optimistic update - remove from hand
        this.playerHand.splice(handIndex, 1);
        this.playerMana -= actualCost;
        
        // Add to field if creature (optimistic)
        if (card.type === 'creature') {
            card.tapped = true;
            // Mark Rush creatures as just played
            if (card.ability === 'Rush') {
                card.justPlayed = true;
                card.tapped = false; // Rush can attack immediately
            }
            this.playerField.push(card);
            
            // NEW: Process enter-play abilities locally for immediate feedback
            this.processEnterPlayAbility(card);
            
            this.addLog(`You played ${card.name}`);
        } else {
            // NEW: Process spell abilities for non-targeted spells
            if (!this.pendingSpell) {
                this.processSpellAbility(card);
            }
            this.addLog(`You cast ${card.name}`);
        }
        
        // Update display
        this.updateDisplay();
        
        return true;
    }
    
    // Override attack to send to server
    attack(attacker, target) {
        console.log('Attack method called');
        console.log('Attacker:', attacker?.name, 'tapped:', attacker?.tapped, 'hasAttackedThisTurn:', attacker?.hasAttackedThisTurn);
        
        // Check for game over
        if (this.gameOver) {
            console.log('Cannot attack - game is over');
            return;
        }
        
        if (!this.isMyTurn) {
            this.addLog("It's not your turn!");
            return;
        }
        
        // Find the attacker index
        const attackerIndex = this.playerField.indexOf(attacker);
        if (attackerIndex === -1) {
            console.error('Attacker not found in field!');
            return;
        }
        
        // Check if attacker can attack
        if (attacker.tapped || attacker.hasAttackedThisTurn) {
            this.addLog(`${attacker.name} has already attacked this turn!`);
            return;
        }
        
        // Check if frozen
        if (attacker.frozen) {
            this.addLog(`${attacker.name} is frozen and cannot attack!`);
            return;
        }
        
        // Check if target is a valid creature to attack
        if (target !== 'ai' && target !== 'player') {
            // It's a creature - check if it can be attacked
            // Creatures can only be attacked if they are tapped OR have Taunt
            if (!target.tapped && !target.taunt && target.ability !== 'Taunt') {
                this.addLog(`Cannot attack ${target.name} - defending creatures must be tapped or have Taunt!`);
                return;
            }
        }
        
        // Check for taunt creatures that must be attacked
        const taunts = this.aiField.filter(c => c.ability === 'Taunt' || c.taunt);
        
        // Determine target type and ID
        let targetType = 'player';
        let targetIndex = -1;  // Default to -1 for player
        
        if (target !== 'ai' && target !== 'player') {
            // It's a creature
            targetType = 'creature';
            targetIndex = this.aiField.indexOf(target);
            
            if (targetIndex === -1) {
                console.error('Target creature not found!');
                return;
            }
            
            // If there are taunts, we can only attack them
            if (taunts.length > 0 && !taunts.includes(target)) {
                this.addLog('Must attack Taunt creatures first!');
                return;
            }
        } else {
            // Attacking player - check for taunts first
            if (taunts.length > 0) {
                this.addLog('Must attack Taunt creatures first!');
                return;
            }
            
            // Check if creature with Rush was just played (can only attack creatures)
            if (attacker.justPlayed && attacker.ability === 'Rush') {
                this.addLog(`${attacker.name} has Rush and can only attack creatures on the turn it's played!`);
                return;
            }
        }
        
        // Send attack action to server with correct target index
        const attackData = {
            type: 'attack',
            attackerIndex: attackerIndex,
            targetType: targetType,
            targetIndex: targetIndex,  // Will be -1 for player, actual index for creatures
            attackerId: attacker.name,
            targetId: target === 'ai' ? 'opponent' : (targetIndex !== -1 ? target.name : null)
        };
        
        console.log('Sending attack to server:', attackData);
        this.networkManager.sendGameAction(attackData);
        
        // Mark attacker as having attacked (optimistic)
        attacker.tapped = true;
        attacker.hasAttackedThisTurn = true;
        
        // NEW: Process combat abilities locally for immediate feedback
        this.processCombatAbilities(attacker, target);
        
        this.addLog(`${attacker.name} attacks ${target === 'ai' ? 'opponent' : target.name}!`);
        
        // Update display
        this.updateDisplay();
        
        // Server will handle the actual combat and send back updates
    }
    
    // Override drawCard for multiplayer - allow local draws for abilities but prevent server conflicts
    drawCard(player) {
        if (player === 'player') {
            // Allow local card drawing for abilities, but from playerDeck
            if (this.playerDeck.length > 0 && this.playerHand.length < 10) {
                const card = this.playerDeck.pop();
                this.playerHand.push(card);
                this.addLog(`Drew ${card.name}`);
                console.log('Local ability draw:', card.name);
            }
        } else {
            // Don't allow drawing for AI in multiplayer - server handles that
            console.log('AI draw card blocked in multiplayer');
        }
    }
    
    // Disable AI turn
    aiTurn() {
        // Do nothing - this is a multiplayer game
        return;
    }
    
    // Override to prevent AI logic from base Game class
    startAITurn() {
        // Do nothing - opponent is another player
        return;
    }
    
    // Override endGame to handle multiplayer game ending
    endGame(winner) {
        if (this.gameOver) {
            console.log('Game already ended, ignoring duplicate endGame call');
            return;
        }
        
        this.gameOver = true;
        console.log(`🏆 GAME OVER! Winner: ${winner}`);
        
        // Determine if we won or lost
        const playerWon = (winner === 'player');
        const message = playerWon ? '🏆 You Win!' : '💀 You Lose!';
        
        // Display game over message
        this.addLog(`================`);
        this.addLog(message);
        this.addLog(`================`);
        
        // Use the UI module to show winner screen like the base Game class does
        const goldReward = 0; // No rewards in multiplayer
        const gemReward = 0;
        
        // Always try to show winner screen directly for multiplayer
        // The UI module might not handle multiplayer games properly
        console.log('Showing multiplayer winner screen directly');
        
        // Debug: Check what elements exist
        console.log('Game container exists?', !!document.getElementById('gameContainer'));
        console.log('Winner screen exists?', !!document.getElementById('winnerScreen'));
        console.log('Document body children:', document.body.children.length);
        
        const winnerScreen = document.getElementById('winnerScreen');
        if (winnerScreen) {
            console.log('Found winner screen element, showing it...');
            console.log('Current display style:', winnerScreen.style.display);
            winnerScreen.style.display = 'flex';
            console.log('New display style:', winnerScreen.style.display);
            // Ensure it's on top of everything
            winnerScreen.style.zIndex = '9999';
            
            const winnerText = document.getElementById('winnerText');
            const winnerMessage = document.getElementById('winnerMessage');
            if (winnerText) {
                winnerText.textContent = playerWon ? 'Victory!' : 'Defeat!';
                console.log('Set winner text to:', winnerText.textContent);
            }
            if (winnerMessage) {
                winnerMessage.textContent = playerWon ? 
                    'Congratulations! You defeated your opponent!' : 
                    'Your opponent has claimed victory. Try again!';
            }
            
            // Hide rewards in multiplayer (no rewards given)
            const rewardDisplay = document.getElementById('rewardDisplay');
            if (rewardDisplay) {
                rewardDisplay.style.display = 'none';
            }
        } else {
            console.error('Winner screen element not found!');
            console.log('Available elements:', document.getElementById('gameContainer') ? 'gameContainer found' : 'gameContainer missing');
        }
        
        // Disable all interactions
        const endTurnBtn = document.getElementById('endTurnBtn');
        if (endTurnBtn) endTurnBtn.disabled = true;
        
        // Clear any selected cards or pending spells
        this.selectedCard = null;
        this.pendingSpell = null;
        this.pendingTargetType = null;
        
        // Update display one last time
        this.updateDisplay();
        
        // Notify server if it hasn't already told us about game over
        if (this.networkManager && !this.gameOverNotified) {
            this.gameOverNotified = true;
            console.log('Notifying server of game over');
            this.networkManager.sendGameAction({
                type: 'gameOver',
                winner: winner === 'player' ? this.playerIndex : (1 - this.playerIndex)
            });
        }
    }
    
    // Override handleGameOver for multiplayer
    handleGameOver(playerWon) {
        console.log(`🏆 handleGameOver called, playerWon: ${playerWon}`);
        console.log('Stack trace:', new Error().stack);
        // Don't set gameOver here - let endGame handle it
        // this.gameOver = true;  // REMOVED - this was preventing endGame from running
        this.gameOverNotified = true; // Server already knows
        
        // Store the network manager for Play Again reconnection
        window.lastMultiplayerNetworkManager = this.networkManager;
        
        this.endGame(playerWon ? 'player' : 'ai');
    }
    
    // Override checkGameState to prevent AI turn triggering
    checkGameState() {
        // Only check for game over, don't trigger AI turns
        if (this.gameOver) {
            console.log('Game already over, skipping check');
            return;
        }
        
        console.log(`[CHECK GAME STATE] Player health: ${this.playerHealth}, Opponent health: ${this.aiHealth}`);
        
        if (this.playerHealth <= 0) {
            console.log(`🎮 Player defeated! Health: ${this.playerHealth}`);
            console.log('Calling endGame("ai") because player health is', this.playerHealth);
            // Don't set gameOver here - let endGame handle it
            this.endGame('ai');
        } else if (this.aiHealth <= 0) {
            console.log(`🎮 Opponent defeated! Health: ${this.aiHealth}`);
            console.log('Calling endGame("player") because opponent health is', this.aiHealth);
            // Don't set gameOver here - let endGame handle it
            this.endGame('player');
        } else {
            console.log('No game over detected - both players still have health');
        }
        // Don't call super which might trigger AI turn
    }
    
    // Override startNewTurn to prevent AI turn logic
    startNewTurn(player) {
        // In multiplayer, turn management is handled by the server
        // Don't call super which would trigger AI turn
        console.log(`Turn management handled by server for ${player}`);
    }
    
    // Override handleSpellTargeting for multiplayer
    handleSpellTargeting(card, isPlayerCard) {
        let validTarget = false;
        
        if (this.pendingTargetType === 'enemy' && !isPlayerCard) {
            // Targeting enemy creature or player
            validTarget = true;
        } else if (this.pendingTargetType === 'enemy creature' && !isPlayerCard) {
            // Check if card exists in aiField
            const index = this.aiField.indexOf(card);
            validTarget = index !== -1;
        } else if (this.pendingTargetType === 'any creature') {
            // Check if card exists in either field
            const playerIndex = this.playerField.indexOf(card);
            const aiIndex = this.aiField.indexOf(card);
            validTarget = (playerIndex !== -1) || (aiIndex !== -1);
        } else if (this.pendingTargetType === 'friendly creature' && isPlayerCard) {
            // Check if card exists in playerField
            const index = this.playerField.indexOf(card);
            validTarget = index !== -1;
        }
        
        if (validTarget) {
            const spellCard = this.pendingSpell;
            this.pendingSpell = null;
            this.pendingTargetType = null;
            
            const index = this.playerHand.indexOf(spellCard);
            if (index > -1) {
                // Calculate actual spell cost
                let actualCost = spellCard.cost;
                if (spellCard.ability === 'Costs less per spell') {
                    actualCost = Math.max(0, spellCard.cost - this.playerSpellsCount);
                }
                
                // Play the spell with target
                this.playerHand.splice(index, 1);
                this.playerMana -= actualCost;
                this.playerSpellsCount++;
                
                // CRITICAL FIX: Find target index BEFORE processing spell locally!
                // (Local processing will kill/remove the creature from field)
                let targetIndex = null;
                if (card) {
                    if (!isPlayerCard) {
                        // Enemy creature - find by unique ID (best) or by name as fallback
                        console.log(`[SPELL DEBUG] Looking for enemy creature:`, card.name, 'id:', card.id);
                        console.log(`[SPELL DEBUG] Enemy field has ${this.aiField.length} creatures:`);
                        this.aiField.forEach((c, i) => {
                            console.log(`  [${i}] ${c.name}, id: ${c.id}, health: ${c.health}`);
                        });
                        
                        if (card.id) {
                            targetIndex = this.aiField.findIndex(c => c.id === card.id);
                            console.log(`[SPELL DEBUG] ID match result: ${targetIndex}`);
                        } else {
                            // Fallback: match by name
                            targetIndex = this.aiField.findIndex(c => c.name === card.name);
                            console.log(`[SPELL DEBUG] Name match result: ${targetIndex}`);
                        }
                        console.log(`[SPELL TARGET] Found enemy creature '${card.name}' at index ${targetIndex}`);
                    } else if (isPlayerCard) {
                        // Friendly creature - find by unique ID (best) or by name as fallback
                        let friendlyIndex = -1;
                        if (card.id) {
                            friendlyIndex = this.playerField.findIndex(c => c.id === card.id);
                        } else {
                            // Fallback: match by name
                            friendlyIndex = this.playerField.findIndex(c => c.name === card.name);
                        }
                        if (friendlyIndex !== -1) {
                            targetIndex = 100 + friendlyIndex; // Send as 100 + index for server to distinguish
                        }
                        console.log(`[SPELL TARGET] Found friendly creature '${card.name}' at index ${friendlyIndex}`);
                    }
                }
                
                // NOW process spell locally AFTER we found the target index
                this.processTargetedSpell(spellCard, card, isPlayerCard);
                
                this.networkManager.sendGameAction({
                    type: 'playCard',
                    card: {
                        name: spellCard.name,
                        cost: spellCard.cost,
                        type: spellCard.type,
                        ability: spellCard.ability,
                        emoji: spellCard.emoji,
                        rarity: spellCard.rarity
                    },
                    handIndex: index,
                    cardCost: actualCost,
                    target: targetIndex // Send target index for targeted spells
                });
                
                this.addLog(`You cast ${spellCard.name}!`);
                this.updateDisplay();
            }
        } else {
            // Invalid target, cancel spell
            this.pendingSpell = null;
            this.pendingTargetType = null;
            this.updateDisplay();
            this.addLog('Invalid target');
        }
    }
    
    // Override handleFieldClick for attacking player directly
    handleFieldClick(target) {
        // Check for game over first
        if (this.gameOver) {
            console.log('Cannot handle field click - game is over');
            return;
        }
        
        if (this.currentTurn !== 'player' || !this.isMyTurn) return;
        
        if (this.pendingSpell && this.pendingTargetType === 'enemy') {
            // Handle spell targeting on player
            const spellCard = this.pendingSpell;
            this.pendingSpell = null;
            this.pendingTargetType = null;
            
            const index = this.playerHand.indexOf(spellCard);
            if (index > -1) {
                // Calculate actual cost
                let actualCost = spellCard.cost;
                if (spellCard.ability === 'Costs less per spell') {
                    actualCost = Math.max(0, spellCard.cost - this.playerSpellsCount);
                }
                
                // Send to server with 'opponent' as target for damage spells
                this.networkManager.sendGameAction({
                    type: 'playCard',
                    card: {
                        name: spellCard.name,
                        cost: spellCard.cost,
                        type: spellCard.type,
                        ability: spellCard.ability,
                        emoji: spellCard.emoji,
                        rarity: spellCard.rarity
                    },
                    handIndex: index,
                    cardCost: actualCost,
                    target: 'opponent' // Target the opponent directly
                });
                
                this.playerHand.splice(index, 1);
                this.playerMana -= actualCost;
                this.playerSpellsCount++;
                
                // NEW: Process spell targeting opponent
                this.processTargetedSpell(spellCard, 'ai', false);
                
                this.updateDisplay();
            }
        } else if (this.selectedCard && target === 'ai') {
            // Attack opponent directly
            this.attack(this.selectedCard, 'ai');
            this.selectedCard = null;
        }
    }
    
    // Override restart for multiplayer Play Again functionality
    restart() {
        console.log('🎮 Multiplayer Play Again clicked - auto-reconnecting and matchmaking...');
        
        // Hide the winner screen
        const winnerScreen = document.getElementById('winnerScreen');
        if (winnerScreen) {
            winnerScreen.style.display = 'none';
        }
        
        // Reset game state
        this.gameOver = false;
        this.selectedCard = null;
        this.pendingSpell = null;
        this.pendingTargetType = null;
        
        // Show matchmaking overlay immediately
        const matchmakingOverlay = document.getElementById('matchmakingOverlay');
        if (matchmakingOverlay) {
            matchmakingOverlay.style.display = 'flex';
            const matchmakingText = document.getElementById('matchmakingText');
            const matchmakingSubtext = document.getElementById('matchmakingSubtext');
            if (matchmakingText) {
                matchmakingText.textContent = 'Reconnecting to server...';
            }
            if (matchmakingSubtext) {
                matchmakingSubtext.textContent = 'Please wait while we reconnect';
            }
        }
        
        // Check if we have a stored network manager or can use the global multiplayer object
        const networkManager = window.lastMultiplayerNetworkManager || this.networkManager;
        
        // Function to start matchmaking
        const startMatchmaking = () => {
            console.log('✅ Connected! Starting matchmaking...');
            
            // Update matchmaking text
            const matchmakingText = document.getElementById('matchmakingText');
            const matchmakingSubtext = document.getElementById('matchmakingSubtext');
            if (matchmakingText) {
                matchmakingText.textContent = 'Looking for opponent...';
            }
            if (matchmakingSubtext) {
                matchmakingSubtext.textContent = 'Please wait while we find you a match';
            }
            
            // Start matchmaking
            if (window.multiplayer && window.multiplayer.findMatch) {
                window.multiplayer.findMatch();
            } else if (networkManager && networkManager.findMatch) {
                networkManager.findMatch();
            } else {
                console.error('❌ Unable to start matchmaking - no multiplayer object available');
                if (matchmakingOverlay) {
                    matchmakingOverlay.style.display = 'none';
                }
                alert('Unable to start matchmaking. Please return to the main menu.');
                window.ui.showMainMenu();
            }
        };
        
        // Try to reconnect and start matchmaking
        if (networkManager && networkManager.ws) {
            // Check if socket is still connected
            if (networkManager.ws.readyState === WebSocket.OPEN) {
                console.log('✅ Still connected to server');
                // Start matchmaking immediately
                setTimeout(startMatchmaking, 500);
            } else {
                console.log('❌ Connection lost, reconnecting...');
                
                // Need to reconnect
                if (window.multiplayer && window.multiplayer.connect) {
                    window.multiplayer.connect();
                    // Wait for connection then start matchmaking
                    setTimeout(startMatchmaking, 2000);
                } else if (networkManager.connect) {
                    networkManager.connect(() => {
                        startMatchmaking();
                    });
                } else {
                    console.error('❌ Unable to reconnect');
                    if (matchmakingOverlay) {
                        matchmakingOverlay.style.display = 'none';
                    }
                    alert('Unable to reconnect to server. Please return to the main menu.');
                    window.ui.showMainMenu();
                }
            }
        } else if (window.multiplayer && window.multiplayer.connect) {
            console.log('🔌 No previous connection, establishing new connection...');
            
            // No previous connection, establish a new one
            window.multiplayer.connect();
            // Wait for connection then start matchmaking
            setTimeout(startMatchmaking, 2000);
        } else {
            console.error('❌ No multiplayer system available');
            if (matchmakingOverlay) {
                matchmakingOverlay.style.display = 'none';
            }
            alert('Multiplayer system not available. Please return to the main menu.');
            window.ui.showMainMenu();
        }
    }
}

// Make it globally available
window.MultiplayerGame = MultiplayerGame;