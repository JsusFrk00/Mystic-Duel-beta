// Game Module - Core game logic (Part 1 of 2)
// Access global variables instead of imports

class Game {
    constructor(playerDeckCards) {
        console.log('[VERSION] Game.js loaded - Version with Dynamic Difficulty 2.0');
        
        // Get dynamic difficulty settings
        this.difficultySettings = window.storage.getDifficultySettings();
        console.log(`[DIFFICULTY] Playing on ${window.storage.playerData.gameStats.difficultyLevel} difficulty:`, this.difficultySettings);
        
        this.playerHealth = 30;
        this.playerMaxHealth = 30;
        this.aiHealth = Math.max(10, 30 + this.difficultySettings.healthBonus); // Minimum 10 health
        this.aiMaxHealth = Math.max(10, 30 + this.difficultySettings.healthBonus);
        this.playerMana = 1;
        this.playerMaxMana = 1;
        this.aiMana = 1 + (this.difficultySettings.startingManaBonus || 0);
        this.aiMaxMana = 1 + (this.difficultySettings.startingManaBonus || 0);
        this.playerHand = [];
        this.aiHand = [];
        this.playerField = [];
        this.aiField = [];
        this.playerDeck = [...playerDeckCards];
        
        // Store the original card templates (not Card instances) for restart functionality
        this.originalPlayerDeckTemplates = playerDeckCards.map(card => ({
            name: card.name,
            cost: card.cost,
            type: card.type,
            attack: card.attack,
            health: card.health,
            ability: card.ability,
            emoji: card.emoji,
            rarity: card.rarity
        }));
        
        // Track dead creatures for resurrection
        this.playerGraveyard = [];
        this.aiGraveyard = [];
        
        // Track spells cast for cost reduction
        this.playerSpellsCount = 0;
        this.aiSpellsCount = 0;
        
        // Track spell power
        this.playerSpellPower = 0;
        this.aiSpellPower = 0;
        
        // For rewind turn ability
        this.turnSnapshot = null;
        
        // Game statistics tracking
        this.gameStats = {
            startTime: Date.now(),
            playerDamageDealt: 0,
            playerDamageTaken: 0,
            playerCardsPlayed: 0,
            playerManaSpent: 0,
            playerCreaturesSummoned: 0,
            playerSpellsCast: 0,
            cardsUsedThisGame: new Set() // Track unique cards played
        };
        
        // Calculate player deck power and create balanced AI deck
        const playerPower = this.calculateDeckPower(playerDeckCards);
        this.aiDeck = this.createDynamicAIDeck(playerPower);
        
        this.currentTurn = 'player';
        this.turnNumber = 1;  // Tracks whose turn it is (player vs AI)
        this.totalTurns = 0;  // Tracks total turns taken (increments every turn)
        this.playerTurnCount = 0; // Tracks player turns only
        this.selectedCard = null;
        this.selectedTarget = null;
        this.pendingSpell = null; // For spell targeting
        this.pendingTargetType = null; // 'enemy', 'friendly', 'any', 'creature'
        this.gameOver = false;
        
        this.shuffleDeck(this.playerDeck);
        this.shuffleDeck(this.aiDeck);
        this.startGame();
    }
    
    // NEW: Aggressive card prioritization - focus on pressure and damage
    prioritizeCardsAggressive(playableCards) {
        return playableCards.sort((a, b) => {
            let scoreA = this.calculateAggressiveValue(a);
            let scoreB = this.calculateAggressiveValue(b);
            
            // Aggressive AI: Always prioritize damage and pressure
            if (a.type === 'creature' && a.ability === 'Quick' || a.ability === 'Charge') scoreA += 15;
            if (b.type === 'creature' && b.ability === 'Quick' || b.ability === 'Charge') scoreB += 15;
            
            // Prioritize direct damage spells highly
            if (a.type === 'spell' && a.ability.includes('Deal')) scoreA += 20;
            if (b.type === 'spell' && b.ability.includes('Deal')) scoreB += 20;
            
            // Prioritize low-cost aggressive creatures
            if (a.type === 'creature' && a.cost <= 3) scoreA += 10;
            if (b.type === 'creature' && b.cost <= 3) scoreB += 10;
            
            return scoreB - scoreA;
        });
    }
    
    // NEW: Calculate aggressive value (damage potential over defensive utility)
    calculateAggressiveValue(card) {
        let value = 0;
        
        if (card.type === 'creature') {
            value = card.attack * 2; // Attack valued more than health for aggression
            value += Math.max(0, card.health - 1); // Some health value, but less important
            
            // Aggressive ability bonuses
            if (card.ability === 'Quick' || card.ability === 'Charge') value += 8;
            if (card.ability && card.ability.includes('Flying')) value += 6; // Hard to block
            if (card.ability === 'Burn') value += 10; // Continuous damage
            if (card.ability && card.ability.includes('Lifesteal')) value += 5; // Sustain for aggression
            if (card.ability === 'Enrage') value += 4; // Gets stronger when damaged
            
            // Reduce value for defensive abilities (AI wants to be aggressive)
            if (card.ability === 'Taunt') value -= 2;
            
        } else if (card.type === 'spell') {
            // Damage spells valued highly for face damage
            if (card.ability.includes('Deal 8')) value = 20;
            else if (card.ability.includes('Deal 6')) value = 18;
            else if (card.ability.includes('Deal 5')) value = 16;
            else if (card.ability.includes('Deal 4')) value = 14;
            else if (card.ability.includes('Deal 3')) value = 12;
            else if (card.ability.includes('Deal 2')) value = 10;
            
            // Buff spells for aggressive pressure
            if (card.ability === 'All allies +2/+2') value = 15;
            if (card.ability === 'All allies +1/+1') value = 12;
            
            // Draw spells for more cards to pressure with
            if (card.ability.includes('Draw 3')) value = 10;
            if (card.ability.includes('Draw 2')) value = 8;
        }
        
        // Cost efficiency for aggressive tempo
        if (card.cost > 0) {
            value = value / Math.sqrt(card.cost); // Slight cost penalty, but not as harsh
        }
        
        return value;
    }
    
    // NEW: Aggressive attack strategy - prioritize face damage
    executeAggressiveAttacks() {
        const attackers = this.aiField.filter(c => c.canAttack ? c.canAttack() : (!c.tapped && !c.frozen));
        
        if (attackers.length === 0) return;
        
        // Check for taunt creatures that must be attacked
        const taunts = this.playerField.filter(c => c.ability === 'Taunt' || c.taunt);
        
        for (const attacker of attackers) {
            if (taunts.length > 0) {
                // Must attack taunt - choose the easiest one to kill
                const target = taunts.sort((a, b) => a.health - b.health)[0];
                this.attack(attacker, target);
            } else {
                // AGGRESSIVE: Prioritize face damage over creature trades
                this.makeAggressiveAttack(attacker);
            }
        }
    }
    
    // Dynamic attack decision making based on difficulty
    makeAggressiveAttack(attacker) {
        const settings = this.difficultySettings;
        const faceChance = settings.faceTargetChance;
        
        // Dynamic face targeting based on difficulty
        if (Math.random() < faceChance && !attacker.canOnlyAttackCreatures) {
            this.attack(attacker, 'player');
            return;
        }
        
        // Otherwise, only attack creatures if we can kill them easily
        const killableTargets = this.playerField.filter(c => {
            return !c.stealth && 
                   c.health <= attacker.attack && 
                   this.canAttackTarget(attacker, c);
        });
        
        if (killableTargets.length > 0) {
            // Kill the most dangerous creature we can
            const target = killableTargets.sort((a, b) => 
                (b.attack + (b.ability && b.ability.includes('Lifesteal') ? 5 : 0)) - 
                (a.attack + (a.ability && a.ability.includes('Lifesteal') ? 5 : 0))
            )[0];
            this.attack(attacker, target);
        } else if (!attacker.canOnlyAttackCreatures) {
            // No good creature trades, go face
            this.attack(attacker, 'player');
        }
        // If we can't attack face (due to Rush), just don't attack
    }

    calculateDeckPower(deck) {
        let totalPower = 0;
        deck.forEach(card => {
            totalPower += window.CARD_POWER[card.rarity];
        });
        return totalPower;
    }

    createDynamicAIDeck(targetPower) {
        const aiDeck = [];
        let currentPower = 0;
        const settings = this.difficultySettings;
        
        // IMPORTANT: Only use standard cards for AI (no Full Art)
        const standardCards = window.getStandardCards();
        
        // Build a proper mana curve first, then upgrade quality
        const manaCurve = {
            1: 4,  // 4 one-cost cards
            2: 6,  // 6 two-cost cards  
            3: 6,  // 6 three-cost cards
            4: 5,  // 5 four-cost cards
            5: 4,  // 4 five-cost cards
            6: 3,  // 3 six-cost cards
            7: 1,  // 1 seven-cost card
            8: 1   // 1 eight-cost+ card
        };
        
        // Fill each mana slot with cards based on difficulty
        for (const [manaCost, count] of Object.entries(manaCurve)) {
            const cost = parseInt(manaCost);
            let cardsAdded = 0;
            
            while (cardsAdded < count && aiDeck.length < 30) {
                // Get cards of this mana cost from standard pool only
                let possibleCards = standardCards.filter(c => {
                    if (cost <= 6) return c.cost === cost;
                    return c.cost >= cost; // For 7+ mana, include any high-cost cards
                });
                
                // Dynamic rarity bias based on difficulty
                const rarityBias = Math.random();
                if (rarityBias < settings.rarityBias) {
                    // Try to get better cards based on difficulty level
                    if (settings.rarityBias >= 0.7) {
                        // Hard/Expert: prefer epic/legendary
                        possibleCards = possibleCards.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
                    } else if (settings.rarityBias >= 0.4) {
                        // Normal+: prefer rare/epic  
                        possibleCards = possibleCards.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
                    } else {
                        // Easy: prefer rare cards
                        possibleCards = possibleCards.filter(c => c.rarity === 'rare' || c.rarity === 'common');
                    }
                }
                
                if (possibleCards.length === 0) {
                    // Fallback to any cards of this cost if filtering was too restrictive
                    possibleCards = standardCards.filter(c => {
                        if (cost <= 6) return c.cost === cost;
                        return c.cost >= cost;
                    });
                }
                
                if (possibleCards.length === 0) break;
                
                const card = possibleCards[Math.floor(Math.random() * possibleCards.length)];
                const copiesInDeck = aiDeck.filter(c => c.name === card.name).length;
                const maxCopies = card.rarity === 'legendary' ? 1 : 2;
                
                if (copiesInDeck < maxCopies) {
                    const newCard = new window.Card(card);
                    aiDeck.push(newCard);
                    currentPower += window.CARD_POWER[card.rarity];
                    cardsAdded++;
                }
            }
        }
        
        // Fill remaining slots with balanced cards if needed
        while (aiDeck.length < 30) {
            const remainingSlots = 30 - aiDeck.length;
            const lowCostCards = standardCards.filter(c => c.cost <= 4);
            const card = lowCostCards[Math.floor(Math.random() * lowCostCards.length)];
            
            const copiesInDeck = aiDeck.filter(c => c.name === card.name).length;
            const maxCopies = card.rarity === 'legendary' ? 1 : 2;
            
            if (copiesInDeck < maxCopies) {
                const newCard = new window.Card(card);
                aiDeck.push(newCard);
                currentPower += window.CARD_POWER[card.rarity];
            }
        }
        
        const difficulty = window.storage.playerData.gameStats.difficultyLevel;
        console.log(`[${difficulty.toUpperCase()}] AI Deck Power: ${currentPower}, Player Deck Power: ${targetPower}, Health Bonus: +${settings.healthBonus}`);
        console.log(`[${difficulty.toUpperCase()}] AI Settings - Mana/Turn: ${settings.aiManaPerTurn}, Face: ${(settings.faceTargetChance*100)}%, Cards/Turn: ${settings.cardPlayLimit}`);
        return aiDeck;
    }
    
    // NEW: Analyze mana curve for debugging
    analyzeManaCurve(deck) {
        const curve = {};
        deck.forEach(card => {
            const cost = Math.min(card.cost, 7); // Group 7+ together
            curve[cost] = (curve[cost] || 0) + 1;
        });
        return curve;
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    startGame() {
        // Initialize turn counters - game starts on turn 1
        this.totalTurns = 1;  // Game has started, this is turn 1
        this.playerTurnCount = 1; // Player's first turn
        
        // Draw initial hands
        for (let i = 0; i < 5; i++) {
            this.drawCard('player');
            this.drawCard('ai');
        }
        
        this.updateDisplay();
        this.addLog("Game started! Your turn begins.");
    }

    saveTurnSnapshot() {
        // Save the game state at the start of turn for Rewind
        this.turnSnapshot = {
            playerHealth: this.playerHealth,
            aiHealth: this.aiHealth,
            playerMana: this.playerMana,
            aiMana: this.aiMana,
            playerMaxMana: this.playerMaxMana,
            aiMaxMana: this.aiMaxMana,
            playerHand: this.playerHand.map(c => ({...c})),
            aiHand: this.aiHand.map(c => ({...c})),
            playerField: this.playerField.map(c => ({...c})),
            aiField: this.aiField.map(c => ({...c})),
            playerDeck: [...this.playerDeck],
            aiDeck: [...this.aiDeck],
            playerGraveyard: [...this.playerGraveyard],
            aiGraveyard: [...this.aiGraveyard],
            playerSpellsCount: this.playerSpellsCount,
            aiSpellsCount: this.aiSpellsCount
        };
    }

    rewindTurn() {
        if (this.turnSnapshot) {
            this.playerHealth = this.turnSnapshot.playerHealth;
            this.aiHealth = this.turnSnapshot.aiHealth;
            this.playerMana = this.turnSnapshot.playerMana;
            this.aiMana = this.turnSnapshot.aiMana;
            this.playerMaxMana = this.turnSnapshot.playerMaxMana;
            this.aiMaxMana = this.turnSnapshot.aiMaxMana;
            this.playerHand = this.turnSnapshot.playerHand.map(c => new Card(c));
            this.aiHand = this.turnSnapshot.aiHand.map(c => new Card(c));
            this.playerField = this.turnSnapshot.playerField.map(c => new Card(c));
            this.aiField = this.turnSnapshot.aiField.map(c => new Card(c));
            this.playerDeck = [...this.turnSnapshot.playerDeck];
            this.aiDeck = [...this.turnSnapshot.aiDeck];
            this.playerGraveyard = [...this.turnSnapshot.playerGraveyard];
            this.aiGraveyard = [...this.turnSnapshot.aiGraveyard];
            this.playerSpellsCount = this.turnSnapshot.playerSpellsCount;
            this.aiSpellsCount = this.turnSnapshot.aiSpellsCount;
            
            this.addLog("Time rewound to start of turn!");
            this.updateDisplay();
        }
    }

    drawCard(player) {
        const deck = player === 'player' ? this.playerDeck : this.aiDeck;
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        
        if (deck.length > 0 && hand.length < 10) {
            const card = deck.pop();
            // Ensure the card is a proper Card instance with ability preserved
            if (!(card instanceof window.Card)) {
                console.warn('Card drawn is not a Card instance, creating new Card');
                const newCard = new window.Card(card);
                hand.push(newCard);
            } else {
                hand.push(card);
            }
            
            if (player === 'player') {
                this.addLog(`You drew ${card.name}`);
            }
        }
        
        this.updateDisplay();
    }

    updateSpellPower() {
        // Calculate spell power from creatures on field
        this.playerSpellPower = this.playerField
            .filter(c => c.ability === 'Spell Power +1')
            .length;
        
        this.aiSpellPower = this.aiField
            .filter(c => c.ability === 'Spell Power +1')
            .length;
        
        // Check for double spell damage ability
        this.playerHasDoubleSpellDamage = this.playerField.some(c => c.ability === 'Double spell damage');
        this.aiHasDoubleSpellDamage = this.aiField.some(c => c.ability === 'Double spell damage');
    }

    playCard(card, player) {
        if (this.gameOver) return;
        
        const hand = player === 'player' ? this.playerHand : this.aiHand;
        const field = player === 'player' ? this.playerField : this.aiField;
        const mana = player === 'player' ? this.playerMana : this.aiMana;
        
        // Calculate actual cost for "Costs less per spell"
        let actualCost = card.cost;
        if (card.ability === 'Costs less per spell') {
            const spellsCount = player === 'player' ? this.playerSpellsCount : this.aiSpellsCount;
            actualCost = Math.max(0, card.cost - spellsCount);
        }
        
        if (actualCost > mana) {
            if (player === 'player') {
                this.addLog("Not enough mana!");
            }
            return false;
        }
        
        if (card.type === 'creature' && field.length >= 7) {
            if (player === 'player') {
                this.addLog("Field is full!");
            }
            return false;
        }
        
        // Handle targeting spells
        if (card.type === 'spell' && player === 'player') {
            if (card.ability.includes('Deal')) {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy';
                this.addLog("Select a target for " + card.name);
                this.updateDisplay();
                return false;
            } else if (card.ability === 'Steal creature') {
                this.pendingSpell = card;
                this.pendingTargetType = 'enemy creature';
                this.addLog("Select an enemy creature to steal");
                this.updateDisplay();
                return false;
            } else if (card.ability === 'Silence') {
                this.pendingSpell = card;
                this.pendingTargetType = 'any creature';
                this.addLog("Select a creature to silence");
                this.updateDisplay();
                return false;
            }
        }
        
        // Remove card from hand
        const index = hand.indexOf(card);
        hand.splice(index, 1);
        
        // Spend mana
        if (player === 'player') {
            this.playerMana -= actualCost;
            if (card.type === 'spell') this.playerSpellsCount++;
            
            // Track statistics
            this.gameStats.playerCardsPlayed++;
            this.gameStats.playerManaSpent += actualCost;
            this.gameStats.cardsUsedThisGame.add(card.name);
            
            if (card.type === 'spell') {
                this.gameStats.playerSpellsCast++;
            }
        } else {
            this.aiMana -= actualCost;
            if (card.type === 'spell') this.aiSpellsCount++;
        }
        
        // Handle card based on type
        if (card.type === 'creature') {
            this.playCreature(card, player, field);
        } else if (card.type === 'spell') {
            this.handleSpell(card, player);
        }
        
        this.updateDisplay();
        return true;
    }

    playCreature(card, player, field) {
        card.tapped = true;
        card.frozen = false;
        card.hasAttackedThisTurn = false;
        card.doubleStrikeUsed = false;
        field.push(card);
        this.addLog(`${player === 'player' ? 'You' : 'AI'} played ${card.name}`);
        
        // Track creature summoning for player
        if (player === 'player') {
            this.gameStats.playerCreaturesSummoned++;
        }
        
        // Handle abilities
        if (card.ability === 'Rush') {
            card.tapped = false;
            card.justPlayed = true; // Mark as just played for Rush restriction
            card.canOnlyAttackCreatures = true;
        } else if (card.ability === 'Quick' || card.ability === 'Charge' || card.ability === 'Haste') {
            card.tapped = false;
        }
        
        if (card.ability === 'Vigilance') {
            card.vigilance = true;
        }
        
        // Handle enter-play abilities
        this.handleEnterPlayAbilities(card, player, field);
        
        // Update spell power after playing creature
        this.updateSpellPower();
    }

    handleEnterPlayAbilities(card, player, field) {
        const ability = card.ability;
        
        if (ability === 'Draw a card' || ability === 'Draw 2 cards' || ability === 'Draw 3 cards') {
            const drawCount = parseInt(ability.match(/\d+/)?.[0] || 1);
            for (let i = 0; i < drawCount; i++) {
                this.drawCard(player);
            }
        } else if (ability === 'Battlecry: Damage') {
            if (player === 'ai') {
                this.dealDamage('player', 2);
            } else {
                // For player battlecry, we'd need targeting - for now just hit AI
                this.dealDamage('ai', 2);
                this.addLog("Battlecry deals 2 damage to opponent!");
            }
        } else if (ability === 'Burn') {
            // Burn creatures deal damage at end of turn, not when played
            this.addLog(`${card.name} has Burn (deals 1 damage each turn)!`);
        } else if (ability.includes('Splash')) {
            // Splash creatures deal damage at end of turn, same as Burn
            this.addLog(`${card.name} has Splash (deals 1 damage each turn)!`);
        } else if (ability === 'AOE damage') {
            const enemyField = player === 'player' ? this.aiField : this.playerField;
            let totalAOEDamage = 0;
            enemyField.forEach(c => {
                const actualDamage = c.takeDamage(2);
                if (actualDamage > 0) {
                    this.addLog(`${c.name} takes ${actualDamage} damage from AOE!`);
                    // Track AOE damage from creature abilities
                    if (player === 'player') {
                        totalAOEDamage += actualDamage;
                    }
                }
            });
            
            // Add total AOE damage to stats
            if (player === 'player' && totalAOEDamage > 0) {
                this.gameStats.playerDamageDealt += totalAOEDamage;
            }
            
            this.checkCreatureDeaths();
        } else if (ability === 'Summon skeletons') {
            for (let i = 0; i < 2 && field.length < 7; i++) {
                const skeleton = new Card({
                    name: "Skeleton",
                    cost: 0,
                    type: "creature",
                    attack: 1,
                    health: 1,
                    ability: "",
                    emoji: "💀",
                    rarity: "common"
                });
                skeleton.tapped = true;
                field.push(skeleton);
            }
            this.addLog("Summoned 2 Skeleton tokens!");
        } else if (ability === 'Summon nature') {
            const natureCreatures = [
                { name: "Wolf", attack: 2, health: 2, emoji: "🐺" },
                { name: "Bear", attack: 3, health: 3, emoji: "🐻" },
                { name: "Eagle", attack: 2, health: 1, emoji: "🦅" }
            ];
            for (let i = 0; i < 3 && field.length < 7; i++) {
                const template = natureCreatures[Math.floor(Math.random() * natureCreatures.length)];
                const creature = new Card({
                    name: template.name,
                    cost: 0,
                    type: "creature",
                    attack: template.attack,
                    health: template.health,
                    ability: "",
                    emoji: template.emoji,
                    rarity: "common"
                });
                creature.tapped = true;
                field.push(creature);
                this.addLog(`Summoned ${template.name}!`);
            }
        } else if (ability === 'Divine Shield') {
            card.divineShield = true;
            this.addLog(`${card.name} has Divine Shield!`);
        } else if (ability === 'Stealth') {
            card.stealth = true;
            this.addLog(`${card.name} is stealthed!`);
        } else if (ability === 'Spell Shield') {
            card.spellShield = true;
            this.addLog(`${card.name} has Spell Shield!`);
        } else if (ability === 'Taunt, Immune') {
            card.immune = true;
            card.taunt = true;
            this.addLog(`${card.name} is Immune and has Taunt!`);
        } else if (ability === 'Resurrect all') {
            const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
            graveyard.forEach(deadCard => {
                if (field.length < 7) {
                    const resurrected = new Card({
                        name: deadCard.name,
                        cost: deadCard.cost,
                        type: deadCard.type,
                        attack: deadCard.attack,
                        health: deadCard.maxHealth || deadCard.health,
                        ability: deadCard.ability,
                        emoji: deadCard.emoji,
                        rarity: deadCard.rarity
                    });
                    resurrected.tapped = true;
                    field.push(resurrected);
                    this.addLog(`${deadCard.name} returns from the grave!`);
                }
            });
            if (player === 'player') {
                this.playerGraveyard = [];
            } else {
                this.aiGraveyard = [];
            }
        } else if (ability === 'Destroy all') {
            [...this.playerField, ...this.aiField].forEach(c => {
                if (c !== card && !c.immune) {
                    c.health = 0;
                }
            });
            this.addLog("All other creatures destroyed!");
            this.checkCreatureDeaths();
        } else if (ability === 'Destroy hand') {
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            const discarded = enemyHand.length;
            enemyHand.length = 0;
            this.addLog(`Enemy discarded ${discarded} cards!`);
        } else if (ability === 'Heal all allies') {
            field.forEach(c => {
                c.health = c.maxHealth;
            });
            this.addLog("All allies healed to full!");
        } else if (ability === 'Rewind turn') {
            this.rewindTurn();
        } else if (ability === 'Double spell damage') {
            this.addLog(`${card.name} doubles spell damage!`);
        } else if (ability === 'Instant kill') {
            card.instantKill = true;
            this.addLog(`${card.name} destroys any creature it damages!`);
        } else if (ability === 'Taunt') {
            card.taunt = true;
        } else if (ability === 'Flying' || ability === 'Reach' || ability === 'Vigilance' || 
                   ability === 'Windfury' || ability === 'Double Strike' || ability === 'Trample' ||
                   ability === 'Lifesteal' || ability === 'Lifelink' || ability === 'Regenerate' ||
                   ability === 'Enrage' || ability === 'First Strike' || ability === 'Poison' ||
                   ability === 'Deathtouch' || ability === 'Freeze enemy') {
            // These are combat abilities handled elsewhere
        }
    }

    handleSpell(card, player, target = null) {
        const ability = card.ability;
        
        if (ability.includes('Deal')) {
            this.handleDamageSpell(card, player, target);
        } else if (ability.includes('Restore')) {
            this.handleHealSpell(card, player);
        } else if (ability === 'All allies +1/+1' || ability === 'All allies +2/+2') {
            this.handleBuffSpell(card, player);
        } else if (ability.includes('Draw')) {
            this.handleDrawSpell(card, player);
        } else if (ability === 'Steal creature' && target) {
            // Mind Control
            const enemyField = player === 'player' ? this.aiField : this.playerField;
            const myField = player === 'player' ? this.playerField : this.aiField;
            const index = enemyField.indexOf(target);
            if (index > -1 && myField.length < 7) {
                enemyField.splice(index, 1);
                myField.push(target);
                target.tapped = true;
                this.addLog(`${player === 'player' ? 'You' : 'AI'} stole ${target.name}!`);
            }
        } else if (ability === 'Silence' && target) {
            // Polymorph - remove all abilities
            target.ability = "";
            target.divineShield = false;
            target.stealth = false;
            target.spellShield = false;
            target.vigilance = false;
            target.frozen = false;
            target.immune = false;
            target.taunt = false;
            target.instantKill = false;
            this.addLog(`${target.name} was silenced!`);
        } else if (ability === 'All allies immune') {
            // Divine Shield spell
            const field = player === 'player' ? this.playerField : this.aiField;
            field.forEach(c => {
                c.tempImmune = true;
            });
            this.addLog("All allies are immune this turn!");
        } else if (ability === 'Destroy all') {
            // Doom, Brawl
            [...this.playerField, ...this.aiField].forEach(c => {
                if (!c.immune) {
                    c.health = 0;
                }
            });
            this.addLog("All creatures destroyed!");
            this.checkCreatureDeaths();
        } else if (ability === 'Destroy hand') {
            // Vanish
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            const discarded = enemyHand.length;
            enemyHand.length = 0;
            this.addLog(`Enemy discarded ${discarded} cards!`);
        } else if (ability === 'Heal all allies') {
            // Tree of Life
            const field = player === 'player' ? this.playerField : this.aiField;
            field.forEach(c => {
                c.health = c.maxHealth;
            });
            this.addLog("All allies healed to full!");
        } else if (ability === 'AOE damage') {
            // Blizzard, Flamestrike
            const enemyField = player === 'player' ? this.aiField : this.playerField;
            let totalAOEDamage = 0;
            enemyField.forEach(c => {
                const actualDamage = c.takeDamage(2);
                if (actualDamage > 0) {
                    this.addLog(`${c.name} takes ${actualDamage} damage from AOE!`);
                    // Track AOE damage dealt by player
                    if (player === 'player') {
                        totalAOEDamage += actualDamage;
                    }
                }
            });
            
            // Add total AOE damage to stats
            if (player === 'player' && totalAOEDamage > 0) {
                this.gameStats.playerDamageDealt += totalAOEDamage;
            }
            
            this.checkCreatureDeaths();
        } else if (ability === 'Extra turn') {
            // Time Warp
            this.handleExtraTurn(player);
        } else if (ability.includes('Random effect')) {
            // Chaos Orb - new ability text
            this.handleRandomChaos(player);
        } else if (ability === 'Random chaos') {
            // Chaos Orb - legacy ability text
            this.handleRandomChaos(player);
        } else if (ability === 'Summon nature') {
            // Call of the Wild
            const field = player === 'player' ? this.playerField : this.aiField;
            const natureCreatures = [
                { name: "Lion", attack: 3, health: 3, emoji: "🦁" },
                { name: "Tiger", attack: 4, health: 2, emoji: "🐅" },
                { name: "Elephant", attack: 2, health: 5, emoji: "🐘" }
            ];
            for (let i = 0; i < 3 && field.length < 7; i++) {
                const template = natureCreatures[i];
                const creature = new Card({
                    name: template.name,
                    cost: 0,
                    type: "creature",
                    attack: template.attack,
                    health: template.health,
                    ability: "",
                    emoji: template.emoji,
                    rarity: "common"
                });
                creature.tapped = true;
                field.push(creature);
                this.addLog(`Summoned ${template.name}!`);
            }
        }
    }

    handleDamageSpell(card, player, target) {
        const baseDamage = parseInt(card.ability.match(/\d+/)[0]);
        const spellPower = player === 'player' ? this.playerSpellPower : this.aiSpellPower;
        let damage = baseDamage + spellPower;
        
        if ((player === 'player' && this.playerHasDoubleSpellDamage) ||
            (player === 'ai' && this.aiHasDoubleSpellDamage)) {
            damage *= 2;
            this.addLog("Double spell damage activated!");
        }
        
        if (player === 'ai') {
            // Enhanced AI spell targeting - much smarter!
            let target = this.chooseSpellTarget(damage);
            
            if (target && target !== 'player') {
                if (!target.spellShield) {
                    console.log(`[SPELL DAMAGE] ${card.name} targeting ${target.name} for ${damage} damage`);
                    const actualDamage = target.takeDamage ? target.takeDamage(damage) : (target.health -= damage, damage);
                    this.addLog(`AI's ${card.name} deals ${actualDamage} damage to ${target.name}!`);
                    if (card.ability.includes('Freeze')) {
                        target.frozen = true;
                        this.addLog(`${target.name} is frozen!`);
                    }
                    this.checkCreatureDeaths();
                } else {
                    this.addLog(`${target.name}'s Spell Shield blocks the spell!`);
                }
            } else {
                // Target player directly
                this.dealDamage('player', damage);
                this.addLog(`AI's ${card.name} deals ${damage} damage to you!`);
            }
        } else if (target) {
            // Player targeting
            if (target === 'ai') {
                this.dealDamage('ai', damage);
                this.addLog(`${card.name} deals ${damage} damage to opponent!`);
            } else if (!target.spellShield) {
                console.log(`[SPELL DAMAGE] ${card.name} targeting ${target.name} for ${damage} damage`);
                const actualDamage = target.takeDamage ? target.takeDamage(damage) : (target.health -= damage, damage);
                
                // Track spell damage dealt by player to creatures
                this.gameStats.playerDamageDealt += actualDamage;
                
                this.addLog(`${card.name} deals ${actualDamage} damage to ${target.name}!`);
                if (card.ability.includes('Freeze')) {
                    target.frozen = true;
                    this.addLog(`${target.name} is frozen!`);
                }
                this.checkCreatureDeaths();
            }
        }
    }
    
    // NEW: Aggressive spell targeting - prioritize face damage
    chooseSpellTarget(damage) {
        // Aggressive AI: Default to targeting player unless there's a high-priority creature
        
        // Only target creatures if we can kill something really dangerous
        const highPriorityKillTargets = this.playerField.filter(c => 
            c.health <= damage && 
            !c.spellShield && 
            ((c.ability && (c.ability.includes('Lifesteal') || c.ability.includes('Taunt'))) || c.attack >= 6 || (c.ability && c.ability.includes('Draw')))
        );
        
        if (highPriorityKillTargets.length > 0) {
            return highPriorityKillTargets.sort((a, b) => (b.attack + b.health) - (a.attack + a.health))[0];
        }
        
        // Aggressive: Always target player unless forced to trade
        // Only consider creature targeting if:
        // 1. Player has very few creatures (1-2) that we need to clear
        // 2. We can kill multiple creatures with AOE
        if (this.playerField.length <= 2) {
            const killableCreatures = this.playerField.filter(c => c.health <= damage && !c.spellShield);
            if (killableCreatures.length > 0) {
                return killableCreatures[0];
            }
        }
        
        // Default aggressive choice: Always go for face damage
        return 'player';
    }

    handleHealSpell(card, player) {
        const heal = parseInt(card.ability.match(/\d+/)[0]);
        if (player === 'player') {
            this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + heal);
            this.addLog(`You restored ${heal} health!`);
        } else {
            this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + heal);
            this.addLog(`AI restored ${heal} health!`);
        }
    }

    handleBuffSpell(card, player) {
        const buff = card.ability.includes('+2/+2') ? 2 : 1;
        const field = player === 'player' ? this.playerField : this.aiField;
        field.forEach(c => {
            c.attack += buff;
            c.health += buff;
            c.maxHealth += buff;
            // CRITICAL: Update base stats so buff persists through aura recalculations
            c.baseAttack += buff;
            c.baseHealth += buff;
        });
        this.addLog(`${player === 'player' ? 'Your' : "AI's"} creatures get +${buff}/+${buff}!`);
    }

    handleDrawSpell(card, player) {
        const drawCount = parseInt(card.ability.match(/\d+/)?.[0] || 1);
        for (let i = 0; i < drawCount; i++) {
            this.drawCard(player);
        }
    }

    handleExtraTurn(player) {
        this.addLog(`${player === 'player' ? 'You' : 'AI'} will take an extra turn!`);
        if (player === 'player') {
            this.playerExtraTurn = true;
        } else {
            this.aiExtraTurn = true;
        }
    }

    handleRandomChaos(player) {
        const effects = [
            () => {
                this.addLog("Chaos: Everyone takes 3 damage!");
                this.dealDamage('player', 3);
                this.dealDamage('ai', 3);
            },
            () => {
                this.addLog("Chaos: Everyone heals 5!");
                this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
                this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
            },
            () => {
                this.addLog("Chaos: All creatures get +2/+2!");
                [...this.playerField, ...this.aiField].forEach(c => {
                    c.attack += 2;
                    c.health += 2;
                    c.maxHealth += 2;
                });
            }
        ];
        
        const effect = effects[Math.floor(Math.random() * effects.length)];
        effect();
        
        // Chaos Orb special win condition: If any player has exactly 3 health, they win
        if (this.playerHealth === 3) {
            this.addLog("🔮 CHAOS ORB MIRACLE! You have exactly 3 health - YOU WIN!");
            setTimeout(() => this.endGame('player'), 1000);
        } else if (this.aiHealth === 3) {
            this.addLog("🔮 CHAOS ORB MIRACLE! AI has exactly 3 health - AI WINS!");
            setTimeout(() => this.endGame('ai'), 1000);
        }
    }

    attack(attacker, target) {
        if (this.gameOver || !attacker.canAttack()) return;
        
        // Check if attack is valid
        const isTargetCreature = (target !== 'player' && target !== 'ai');
        
        // Check Rush restriction - can only attack creatures on the turn it's played
        if ((attacker.canOnlyAttackCreatures || (attacker.justPlayed && attacker.ability === 'Rush')) && !isTargetCreature) {
            this.addLog(`${attacker.name} with Rush can only attack creatures this turn!`);
            return;
        }
        
        // Check Taunt (unless attacker cannot be blocked)
        const enemyField = this.currentTurn === 'player' ? this.aiField : this.playerField;
        const taunts = enemyField.filter(c => c.ability === 'Taunt' || c.taunt);
        const cannotBeBlocked = attacker.ability && attacker.ability.includes('Cannot be blocked');
        
        console.log(`[TAUNT CHECK] ${attacker.name} attacking, Cannot be blocked: ${cannotBeBlocked}, Taunts on board: ${taunts.length}`);
        
        if (taunts.length > 0 && !cannotBeBlocked) {
            if (isTargetCreature && !target.taunt && !target.ability?.includes('Taunt')) {
                this.addLog("Must attack Taunt creatures first!");
                return;
            } else if (!isTargetCreature) {
                this.addLog("Must attack Taunt creatures first!");
                return;
            }
        }
        
        // Check if target creature is defending (untapped) - Taunt creatures are exceptions
        if (isTargetCreature && !target.tapped && !target.taunt && !target.ability?.includes('Taunt')) {
            // Check if there are any tapped creatures that could be attacked instead
            const tappedEnemies = enemyField.filter(c => c.tapped && !c.stealth);
            if (tappedEnemies.length > 0) {
                this.addLog("Can't attack defending creatures! Attack tapped creatures instead.");
                return;
            }
            // If all creatures are untapped (and no taunts), you can't attack any of them
            this.addLog("Can't attack defending creatures! They are ready to block.");
            return;
        }
        
        // Check Stealth
        if (isTargetCreature && target.stealth) {
            this.addLog("Can't attack stealthed creatures!");
            return;
        }
        
        // Check Flying
        if (isTargetCreature && target.ability && target.ability.includes('Flying')) {
            if (!(attacker.ability && (attacker.ability.includes('Flying') || attacker.ability.includes('Reach')))) {
                this.addLog("Can't reach flying creatures without Flying or Reach!");
                return;
            }
        }
        
        // Remove stealth when attacking
        if (attacker.stealth) {
            attacker.stealth = false;
            this.addLog(`${attacker.name} loses stealth!`);
        }
        
        if (!isTargetCreature) {
            // Direct attack to player
            this.dealDamage(target, attacker.attack);
            this.addLog(`${attacker.name} attacks directly for ${attacker.attack} damage!`);
            
            // Handle lifesteal
            if (attacker.ability?.includes('Lifesteal') || attacker.ability?.includes('Lifelink')) {
                if (this.currentTurn === 'player') {
                    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + attacker.attack);
                    this.addLog(`Lifesteal heals for ${attacker.attack}!`);
                } else {
                    this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + attacker.attack);
                }
            }
        } else {
            // Creature combat
            this.creatureCombat(attacker, target);
        }
        
        // Mark attacker as having attacked
        attacker.markAttacked();
        this.updateDisplay();
    }

    creatureCombat(attacker, target) {
        console.log(`[COMBAT] ${attacker.name} (${attacker.attack}/${attacker.health}) attacks ${target.name} (${target.attack}/${target.health})`);
        console.log(`[COMBAT] Attacker ability: ${attacker.ability}, Target ability: ${target.ability}`);
        
        // Track if this is player's creature attacking (for damage dealt stats)
        const isPlayerAttacker = this.playerField.includes(attacker);
        
        if (target.immune || target.tempImmune) {
            this.addLog(`${target.name} is Immune and cannot be damaged!`);
            return;
        }
        
        let attackerDamage = attacker.attack;
        let targetDamage = target.attack;
        
        // Handle Divine Shield
        if (target.divineShield) {
            target.divineShield = false;
            this.addLog(`${target.name}'s Divine Shield absorbs the damage!`);
            attackerDamage = 0;
        }
        
        if (attacker.divineShield && targetDamage > 0) {
            attacker.divineShield = false;
            this.addLog(`${attacker.name}'s Divine Shield absorbs the damage!`);
            targetDamage = 0;
        }
        
        // Handle First Strike
        if (attacker.ability === 'First Strike' && !target.ability?.includes('First Strike')) {
            const oldTargetAttack = target.attack;
            const damageDealt = target.takeDamage(attackerDamage);
            
            // Track damage dealt by player creatures
            if (isPlayerAttacker && damageDealt > 0) {
                this.gameStats.playerDamageDealt += damageDealt;
            }
            
            // Check if Enrage triggered by comparing attack values
            if (target.ability === 'Enrage' && target.attack > oldTargetAttack && target.health > 0) {
                this.addLog(`${target.name} enrages! +2 attack!`);
            }
            if (target.health > 0) {
                const oldAttackerAttack = attacker.attack;
                const damageTaken = attacker.takeDamage(targetDamage);
                
                // Track damage taken by player creatures
                if (isPlayerAttacker && damageTaken > 0) {
                    this.gameStats.playerDamageTaken += damageTaken;
                }
                
                if (attacker.ability === 'Enrage' && attacker.attack > oldAttackerAttack && attacker.health > 0) {
                    this.addLog(`${attacker.name} enrages! +2 attack!`);
                }
            }
        } else if (target.ability === 'First Strike' && !attacker.ability?.includes('First Strike')) {
            const oldAttackerAttack = attacker.attack;
            const damageTaken = attacker.takeDamage(targetDamage);
            
            // Track damage taken by player creatures
            if (isPlayerAttacker && damageTaken > 0) {
                this.gameStats.playerDamageTaken += damageTaken;
            }
            
            if (attacker.ability === 'Enrage' && attacker.attack > oldAttackerAttack && attacker.health > 0) {
                this.addLog(`${attacker.name} enrages! +2 attack!`);
            }
            if (attacker.health > 0) {
                const oldTargetAttack = target.attack;
                const damageDealt = target.takeDamage(attackerDamage);
                
                // Track damage dealt by player creatures
                if (isPlayerAttacker && damageDealt > 0) {
                    this.gameStats.playerDamageDealt += damageDealt;
                }
                
                if (target.ability === 'Enrage' && target.attack > oldTargetAttack && target.health > 0) {
                    this.addLog(`${target.name} enrages! +2 attack!`);
                }
            }
        } else {
            // Normal combat - both take damage simultaneously
            const oldTargetAttack = target.attack;
            const oldAttackerAttack = attacker.attack;
            const targetDamageDealt = target.takeDamage(attackerDamage);
            const attackerDamageTaken = attacker.takeDamage(targetDamage);
            
            // Track damage for player creatures
            if (isPlayerAttacker) {
                if (targetDamageDealt > 0) this.gameStats.playerDamageDealt += targetDamageDealt;
                if (attackerDamageTaken > 0) this.gameStats.playerDamageTaken += attackerDamageTaken;
            }
            
            // Check if Enrage triggered by comparing attack values
            if (target.ability === 'Enrage' && target.attack > oldTargetAttack && target.health > 0) {
                this.addLog(`${target.name} enrages! +2 attack!`);
            }
            if (attacker.ability === 'Enrage' && attacker.attack > oldAttackerAttack && attacker.health > 0) {
                this.addLog(`${attacker.name} enrages! +2 attack!`);
            }
        }
        
        // Handle Poison/Deathtouch/Instant kill
        if ((attacker.ability === 'Poison' || attacker.ability === 'Deathtouch' || 
             attacker.ability === 'Instant kill' || attacker.instantKill) && attackerDamage > 0) {
            target.health = 0;
            this.addLog(`${attacker.name}'s deadly ability destroys ${target.name}!`);
        }
        
        if ((target.ability === 'Poison' || target.ability === 'Deathtouch') && targetDamage > 0) {
            attacker.health = 0;
            this.addLog(`${target.name}'s deadly ability destroys ${attacker.name}!`);
        }
        
        // Handle Freeze enemy
        if (attacker.ability === 'Freeze enemy' && target.health > 0) {
            target.frozen = true;
            this.addLog(`${target.name} is frozen!`);
        }
        
        // Handle Trample
        if (attacker.ability === 'Trample' && target.health <= 0) {
            const excess = Math.abs(target.health);
            const enemyPlayer = this.currentTurn === 'player' ? 'ai' : 'player';
            if (excess > 0) {
                this.dealDamage(enemyPlayer, excess);
                this.addLog(`Trample deals ${excess} excess damage!`);
                
                // Note: dealDamage already tracks this damage, no need to double-count
            }
        }
        
        // Handle Lifesteal/Lifelink
        if ((attacker.ability?.includes('Lifesteal') || attacker.ability?.includes('Lifelink')) && attackerDamage > 0) {
            const healAmount = Math.min(attackerDamage, target.maxHealth || attackerDamage);
            if (this.currentTurn === 'player') {
                this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healAmount);
                this.addLog(`Lifesteal heals for ${healAmount}!`);
            } else {
                this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healAmount);
            }
        }
        
        this.addLog(`${attacker.name} battles ${target.name}!`);
        this.checkCreatureDeaths();
    }

    checkCreatureDeaths() {
        // Check player creatures
        this.playerField = this.playerField.filter(c => {
            if (c.health <= 0) {
                this.addLog(`${c.name} was destroyed!`);
                
                // Add to graveyard with all properties preserved
                this.playerGraveyard.push({
                    name: c.name,
                    cost: c.cost,
                    type: c.type,
                    attack: c.attack,
                    health: c.health,
                    maxHealth: c.maxHealth,
                    ability: c.ability,
                    emoji: c.emoji,
                    rarity: c.rarity
                });
                
                // Handle Deathrattle: Draw
                if (c.ability === 'Deathrattle: Draw') {
                    this.drawCard('player');
                    this.addLog("Deathrattle: Drew a card!");
                }
                
                // Handle Resurrect
                if (c.ability === 'Resurrect') {
                    const newCard = new Card({
                        name: c.name,
                        cost: c.cost,
                        type: c.type,
                        attack: c.attack,
                        health: c.maxHealth,
                        ability: c.ability,
                        emoji: c.emoji,
                        rarity: c.rarity
                    });
                    if (this.playerHand.length < 10) {
                        this.playerHand.push(newCard);
                        this.addLog(`${c.name} returns to hand!`);
                    }
                }
                
                return false;
            }
            return true;
        });
        
        // Check AI creatures
        this.aiField = this.aiField.filter(c => {
            if (c.health <= 0) {
                this.addLog(`${c.name} was destroyed!`);
                
                // Add to graveyard with all properties preserved
                this.aiGraveyard.push({
                    name: c.name,
                    cost: c.cost,
                    type: c.type,
                    attack: c.attack,
                    health: c.health,
                    maxHealth: c.maxHealth,
                    ability: c.ability,
                    emoji: c.emoji,
                    rarity: c.rarity
                });
                
                // Handle Deathrattle: Draw
                if (c.ability === 'Deathrattle: Draw') {
                    this.drawCard('ai');
                }
                
                // Handle Resurrect
                if (c.ability === 'Resurrect') {
                    const newCard = new Card({
                        name: c.name,
                        cost: c.cost,
                        type: c.type,
                        attack: c.attack,
                        health: c.maxHealth,
                        ability: c.ability,
                        emoji: c.emoji,
                        rarity: c.rarity
                    });
                    if (this.aiHand.length < 10) {
                        this.aiHand.push(newCard);
                    }
                }
                
                return false;
            }
            return true;
        });
        
        // Update spell power after deaths
        this.updateSpellPower();
    }

    dealDamage(target, amount) {
        const popup = document.createElement('div');
        popup.className = 'damage-popup';
        popup.textContent = `-${amount}`;
        
        if (target === 'player') {
            this.playerHealth = Math.max(0, this.playerHealth - amount);
            const playerInfos = document.querySelectorAll('.player-info');
            if (playerInfos[1]) playerInfos[1].appendChild(popup);
            
            // Track damage taken by player
            this.gameStats.playerDamageTaken += amount;
            
            if (this.playerHealth <= 0) {
                this.endGame('ai');
            }
        } else {
            this.aiHealth = Math.max(0, this.aiHealth - amount);
            const playerInfos = document.querySelectorAll('.player-info');
            if (playerInfos[0]) playerInfos[0].appendChild(popup);
            
            // Track damage dealt by player
            this.gameStats.playerDamageDealt += amount;
            
            if (this.aiHealth <= 0) {
                this.endGame('player');
            }
        }
        
        setTimeout(() => popup.remove(), 1000);
    }

    endTurn() {
        if (this.gameOver) return;
        
        // Remove temporary immunity
        [...this.playerField, ...this.aiField].forEach(c => {
            c.tempImmune = false;
        });
        
        if (this.currentTurn === 'player') {
            // Check for extra turn
            if (this.playerExtraTurn) {
                this.playerExtraTurn = false;
                this.startNewTurn('player');
                return;
            }
            
            // Switch to AI turn
            this.currentTurn = 'ai';
            this.startNewTurn('ai');
            setTimeout(() => this.aiTurn(), 1000);
        } else {
            // Check for AI extra turn
            if (this.aiExtraTurn) {
                this.aiExtraTurn = false;
                this.startNewTurn('ai');
                setTimeout(() => this.aiTurn(), 1000);
                return;
            }
            
            // Switch to player turn
            this.currentTurn = 'player';
            this.startNewTurn('player');
        }
    }

    startNewTurn(player) {
        // Increment total turns every time (both player and AI turns)
        this.totalTurns++;
        
        if (player === 'player') {
            this.playerTurnCount++; // Track player turns separately
            this.playerMaxMana = Math.min(10, this.playerMaxMana + 1);
            this.playerMana = this.playerMaxMana;
            this.playerField.forEach(c => {
                c.resetForTurn();
                // Clear justPlayed flag so Rush creatures can attack normally next turn
                if (c.justPlayed) c.justPlayed = false;
            });
            
            // Handle Burn/Splash damage from AI creatures at start of player's turn
            const enemyBurners = this.aiField.filter(c => c.ability === 'Burn' || c.ability?.includes('Splash'));
            if (enemyBurners.length > 0) {
                const burnDamage = enemyBurners.length; // 1 damage per Burn/Splash creature
                this.dealDamage('player', burnDamage);
                this.addLog(`Burn/Splash deals ${burnDamage} damage to you!`);
            }
            
            this.drawCard('player');
            this.addLog("Your turn begins!");
        } else {
            // AI mana growth with clear integer-based system
            const settings = this.difficultySettings;
            let aiManaGain = settings.aiManaPerTurn || 1;
            
            // Check for mana boost after certain turn
            if (settings.manaBoostTurn && this.playerTurnCount >= settings.manaBoostTurn) {
                aiManaGain += 1; // AI gets +1 extra mana per turn after boost turn
            }
            
            this.aiMaxMana = Math.min(settings.aiMaxMana, this.aiMaxMana + aiManaGain);
            this.aiMana = this.aiMaxMana;
            this.aiField.forEach(c => {
                c.resetForTurn();
                // Clear justPlayed flag so Rush creatures can attack normally next turn
                if (c.justPlayed) c.justPlayed = false;
            });
            
            // Handle Burn/Splash damage from player creatures
            const playerBurners = this.playerField.filter(c => c.ability === 'Burn' || c.ability?.includes('Splash'));
            if (playerBurners.length > 0) {
                const burnDamage = playerBurners.length;
                this.dealDamage('ai', burnDamage);
                this.addLog(`Burn/Splash deals ${burnDamage} damage to opponent!`);
            }
            
            this.drawCard('ai');
            this.addLog("AI's turn begins...");
        }
        
        this.saveTurnSnapshot();
        this.updateDisplay();
    }

    aiTurn() {
        if (this.gameOver) return;
        
        // Dynamic AI behavior based on difficulty
        const settings = this.difficultySettings;
        const playableCards = this.aiHand.filter(c => {
            let cost = c.getDisplayCost ? c.getDisplayCost(this.aiSpellsCount) : c.cost;
            if (c.ability === 'Costs less per spell') {
                cost = Math.max(0, c.cost - this.aiSpellsCount);
            }
            return cost <= this.aiMana;
        });
        
        // Choose AI strategy based on difficulty
        let prioritizedCards;
        if (settings.playStyle === 'aggressive') {
            prioritizedCards = this.prioritizeCardsAggressive(playableCards);
        } else if (settings.playStyle === 'defensive') {
            prioritizedCards = this.prioritizeCardsDefensive(playableCards);
        } else {
            prioritizedCards = this.prioritizeCards(playableCards); // balanced
        }
        
        // Play cards with limit based on difficulty
        let cardsPlayed = 0;
        for (const card of prioritizedCards) {
            if (this.playCard(card, 'ai')) {
                cardsPlayed++;
                // Limit cards played per turn based on difficulty
                if (cardsPlayed >= settings.cardPlayLimit || this.aiMana < 1) {
                    break;
                }
            }
        }
        
        // Attack phase - use appropriate strategy
        setTimeout(() => {
            if (settings.playStyle === 'aggressive') {
                this.executeAggressiveAttacks();
            } else {
                this.executeStrategicAttacks();
            }
            setTimeout(() => this.endTurn(), 1500);
        }, 1500);
    }
    
    // NEW: Strategic card prioritization
    prioritizeCards(playableCards) {
        return playableCards.sort((a, b) => {
            let scoreA = this.calculateCardValue(a);
            let scoreB = this.calculateCardValue(b);
            
            // Prioritize based on current board state
            if (this.playerHealth <= 10) {
                // Go for the kill - prioritize damage
                if (a.type === 'spell' && a.ability.includes('Deal')) scoreA += 20;
                if (b.type === 'spell' && b.ability.includes('Deal')) scoreB += 20;
            }
            
            if (this.aiHealth <= 15) {
                // Defensive - prioritize healing and taunt creatures
                if (a.ability === 'Taunt' || a.ability.includes('Restore')) scoreA += 15;
                if (b.ability === 'Taunt' || b.ability.includes('Restore')) scoreB += 15;
            }
            
            // Prioritize removal spells when player has strong creatures
            const strongPlayerCreatures = this.playerField.filter(c => c.attack >= 4 || (c.ability && c.ability.includes('Lifesteal')));
            if (strongPlayerCreatures.length > 0) {
                if (a.ability.includes('Deal') || a.ability === 'Destroy all') scoreA += 10;
                if (b.ability.includes('Deal') || b.ability === 'Destroy all') scoreB += 10;
            }
            
            return scoreB - scoreA; // Sort highest score first
        });
    }
    
    // NEW: Calculate strategic value of a card
    calculateCardValue(card) {
        let value = 0;
        
        if (card.type === 'creature') {
            value = card.attack + card.health; // Base stats
            
            // Ability bonuses
            if (card.ability && card.ability.includes('Flying')) value += 3;
            if (card.ability === 'Taunt') value += 4;
            if (card.ability && (card.ability.includes('Lifesteal') || card.ability.includes('Lifelink'))) value += 5;
            if (card.ability === 'Divine Shield') value += 3;
            if (card.ability === 'Quick' || card.ability === 'Charge') value += 2;
            if (card.ability === 'Draw a card') value += 3;
            if (card.ability === 'AOE damage') value += 6;
            if (card.ability === 'Enrage') value += 2;
            if (card.ability === 'First Strike') value += 2;
            if (card.ability === 'Poison' || card.ability === 'Deathtouch') value += 4;
        } else if (card.type === 'spell') {
            // Spell values based on effect
            if (card.ability.includes('Deal 8')) value = 16;
            else if (card.ability.includes('Deal 6')) value = 14;
            else if (card.ability.includes('Deal 5')) value = 12;
            else if (card.ability.includes('Deal 4')) value = 10;
            else if (card.ability.includes('Deal 3')) value = 8;
            else if (card.ability.includes('Deal 2')) value = 6;
            
            if (card.ability === 'Destroy all') value = 15;
            if (card.ability === 'Extra turn') value = 20;
            if (card.ability.includes('Draw 3')) value = 12;
            if (card.ability.includes('Draw 2')) value = 8;
            if (card.ability === 'All allies +2/+2') value = 12;
            if (card.ability === 'All allies +1/+1') value = 8;
            if (card.ability === 'Steal creature') value = 15;
        }
        
        // Adjust value based on cost efficiency
        if (card.cost > 0) {
            value = value / card.cost; // Value per mana point
        }
        
        return value;
    }
    
    // NEW: Strategic attack execution
    executeStrategicAttacks() {
        const attackers = this.aiField.filter(c => c.canAttack ? c.canAttack() : (!c.tapped && !c.frozen));
        
        if (attackers.length === 0) return;
        
        // Check for taunt creatures that must be attacked
        const taunts = this.playerField.filter(c => c.ability === 'Taunt' || c.taunt);
        
        for (const attacker of attackers) {
            if (taunts.length > 0) {
                // Must attack taunt - choose the weakest one
                const target = this.chooseOptimalTarget(attacker, taunts);
                this.attack(attacker, target);
            } else {
                // Strategic target selection
                this.makeStrategicAttack(attacker);
            }
        }
    }
    
    // NEW: Defensive card prioritization for beginner AI
    prioritizeCardsDefensive(playableCards) {
        return playableCards.sort((a, b) => {
            let scoreA = this.calculateDefensiveValue(a);
            let scoreB = this.calculateDefensiveValue(b);
            
            // Defensive AI: Prioritize survival and board control
            if (a.ability === 'Taunt' || a.ability.includes('Restore')) scoreA += 20;
            if (b.ability === 'Taunt' || b.ability.includes('Restore')) scoreB += 20;
            
            // Prioritize removal over face damage
            if (a.type === 'spell' && a.ability.includes('Deal') && this.playerField.length > 0) scoreA += 15;
            if (b.type === 'spell' && b.ability.includes('Deal') && this.playerField.length > 0) scoreB += 15;
            
            // Prefer high-health creatures for defense
            if (a.type === 'creature' && a.health >= 4) scoreA += 10;
            if (b.type === 'creature' && b.health >= 4) scoreB += 10;
            
            return scoreB - scoreA;
        });
    }
    
    // NEW: Calculate defensive value for beginner AI
    calculateDefensiveValue(card) {
        let value = 0;
        
        if (card.type === 'creature') {
            value = card.health * 1.5 + card.attack; // Health valued more for defense
            
            // Defensive ability bonuses
            if (card.ability === 'Taunt') value += 12;
            if (card.ability === 'Divine Shield') value += 8;
            if (card.ability && (card.ability.includes('Lifesteal') || card.ability.includes('Lifelink'))) value += 10; // Good for sustain
            if (card.ability.includes('Restore')) value += 15;
            if (card.ability && card.ability.includes('Flying')) value += 3; // Decent but not priority
            
            // Reduce value for aggressive abilities in defensive play
            if (card.ability === 'Quick' || card.ability === 'Charge') value -= 3;
            
        } else if (card.type === 'spell') {
            // Prioritize removal and healing spells
            if (card.ability.includes('Restore')) value = 20;
            if (card.ability === 'Destroy all') value = 18;
            if (card.ability.includes('Deal') && this.playerField.length > 0) value = 15;
            if (card.ability === 'All allies +1/+1') value = 12;
            if (card.ability.includes('Draw')) value = 10;
        }
        
        // Cost efficiency (defensive AI doesn't rush)
        if (card.cost > 0) {
            value = value / Math.sqrt(card.cost * 0.8); // Less harsh cost penalty
        }
        
        return value;
    }
    chooseOptimalTarget(attacker, possibleTargets) {
        if (possibleTargets.length === 0) return null;
        
        return possibleTargets.sort((a, b) => {
            let scoreA = this.calculateTargetPriority(attacker, a);
            let scoreB = this.calculateTargetPriority(attacker, b);
            return scoreB - scoreA; // Highest priority first
        })[0];
    }
    
    // NEW: Calculate target priority for strategic attacks
    calculateTargetPriority(attacker, target) {
        let priority = 0;
        
        // Prioritize targets we can kill
        if (target.health <= attacker.attack) {
            priority += 20;
        }
        
        // Prioritize dangerous abilities
        if (target.ability && (target.ability.includes('Lifesteal') || target.ability.includes('Lifelink'))) priority += 15;
        if (target.ability.includes('Draw')) priority += 10;
        if (target.ability === 'Spell Power +1') priority += 8;
        if (target.ability === 'AOE damage') priority += 12;
        if (target.ability === 'Burn') priority += 6;
        
        // Prioritize high attack creatures
        priority += target.attack * 2;
        
        // Deprioritize if we'll die attacking it (unless we kill it)
        if (target.attack >= attacker.health && target.health > attacker.attack) {
            priority -= 10;
        }
        
        return priority;
    }
    
    // NEW: Make strategic attack decisions
    makeStrategicAttack(attacker) {
        // First, see if we can kill something valuable
        const killableTargets = this.playerField.filter(c => {
            return !c.stealth && c.health <= attacker.attack && this.canAttackTarget(attacker, c);
        });
        
        if (killableTargets.length > 0) {
            const target = this.chooseOptimalTarget(attacker, killableTargets);
            this.attack(attacker, target);
            return;
        }
        
        // If we can't kill anything safely, consider all valid targets
        const validTargets = this.playerField.filter(c => this.canAttackTarget(attacker, c));
        
        if (validTargets.length > 0) {
            // Only attack creatures if it's strategically beneficial
            const target = this.chooseOptimalTarget(attacker, validTargets);
            
            // Attack creature if the trade is favorable or target is high priority
            const targetPriority = this.calculateTargetPriority(attacker, target);
            if (targetPriority >= 15 || target.health <= attacker.attack) {
                this.attack(attacker, target);
            } else if (Math.random() > 0.6) {
                // Sometimes make suboptimal creature attacks for unpredictability
                this.attack(attacker, target);
            } else {
                // Go face if creature attacks aren't beneficial
                this.attack(attacker, 'player');
            }
        } else if (!attacker.canOnlyAttackCreatures) {
            // No valid creature targets, attack player directly
            this.attack(attacker, 'player');
        }
    }
    
    // NEW: Check if attacker can attack target (considering abilities)
    canAttackTarget(attacker, target) {
        if (target.stealth) return false;
        if (!target.tapped && !target.taunt && !target.ability?.includes('Taunt')) return false;
        if (target.ability && target.ability.includes('Flying') && !(attacker.ability && (attacker.ability.includes('Flying') || attacker.ability.includes('Reach')))) return false;
        return true;
    }

    handleCardClick(card, isPlayerCard) {
        console.log(`[CARD CLICK] Card: ${card.name}, isPlayerCard: ${isPlayerCard}, currentTurn: ${this.currentTurn}`);
        
        if (this.gameOver || this.currentTurn !== 'player') {
            console.log(`[CARD CLICK] Blocked - gameOver: ${this.gameOver}, turn: ${this.currentTurn}`);
            return;
        }
        
        // Handle pending spell targeting
        if (this.pendingSpell) {
            this.handleSpellTargeting(card, isPlayerCard);
            return;
        }
        
        if (isPlayerCard && this.playerHand.includes(card)) {
            this.playCard(card, 'player');
        } else if (isPlayerCard && this.playerField.includes(card)) {
            if (card.canAttack()) {
                this.selectedCard = card;
                this.updateDisplay();
            }
        } else if (!isPlayerCard && this.selectedCard) {
            if (this.aiField.includes(card)) {
                this.attack(this.selectedCard, card);
                this.selectedCard = null;
            }
        }
    }

    handleSpellTargeting(card, isPlayerCard) {
        // CRITICAL FIX: Check if we even have a pending spell
        // Prevents casting spell after Spell Shield blocks it
        if (!this.pendingSpell) {
            return;
        }
        
        let validTarget = false;
        
        // Check Spell Shield - blocks ALL spell targeting
        if (card.spellShield) {
            this.addLog(`${card.name}'s Spell Shield blocks the spell!`);
            card.spellShield = false; // Consume the shield
            
            // Clear pending spell
            this.pendingSpell = null;
            this.pendingTargetType = null;
            this.updateDisplay();
            return;
        }
        
        if (this.pendingTargetType === 'enemy' && !isPlayerCard) {
            validTarget = true;
        } else if (this.pendingTargetType === 'enemy creature' && !isPlayerCard && this.aiField.includes(card)) {
            validTarget = true;
        }
        
        if (validTarget) {
            const spellCard = this.pendingSpell;
            this.pendingSpell = null;
            this.pendingTargetType = null;
            
            const index = this.playerHand.indexOf(spellCard);
            if (index > -1) {
                this.playerHand.splice(index, 1);
                this.playerMana -= spellCard.cost;
                this.playerSpellsCount++;
                this.handleSpell(spellCard, 'player', card);
                this.updateDisplay();
            }
        }
    }

    handleFieldClick(target) {
        console.log(`[FIELD CLICK] Clicked ${target}, selectedCard:`, this.selectedCard?.name);
        
        if (this.gameOver || this.currentTurn !== 'player') {
            console.log(`[FIELD CLICK] Blocked - gameOver: ${this.gameOver}, currentTurn: ${this.currentTurn}`);
            return;
        }
        
        if (this.pendingSpell && this.pendingTargetType === 'enemy') {
            const spellCard = this.pendingSpell;
            this.pendingSpell = null;
            this.pendingTargetType = null;
            
            const index = this.playerHand.indexOf(spellCard);
            if (index > -1) {
                this.playerHand.splice(index, 1);
                this.playerMana -= spellCard.cost;
                this.playerSpellsCount++;
                this.handleSpell(spellCard, 'player', 'ai');
                this.updateDisplay();
            }
        } else if (this.selectedCard) {
            console.log(`[FIELD CLICK] Selected card ability: "${this.selectedCard.ability}"`);
            
            const taunts = this.aiField.filter(c => c.ability === 'Taunt' || c.taunt);
            const cannotBeBlocked = this.selectedCard.ability && this.selectedCard.ability.includes('Cannot be blocked');
            
            console.log(`[FIELD CLICK] Taunts: ${taunts.length}, Cannot be blocked: ${cannotBeBlocked}`);
            
            if (taunts.length > 0 && !cannotBeBlocked) {
                this.addLog("Must attack Taunt creatures first!");
                return;
            }
            
            if (target === 'ai') {
                this.attack(this.selectedCard, 'ai');
                this.selectedCard = null;
            }
        }
    }

    updateDisplay() {
        // Update health
        document.getElementById('playerHealthBar').style.width = `${(this.playerHealth / this.playerMaxHealth) * 100}%`;
        document.getElementById('playerHealthText').textContent = `${this.playerHealth}/${this.playerMaxHealth}`;
        document.getElementById('aiHealthBar').style.width = `${(this.aiHealth / this.aiMaxHealth) * 100}%`;
        document.getElementById('aiHealthText').textContent = `${this.aiHealth}/${this.aiMaxHealth}`;
        
        // Update mana
        this.updateManaDisplay('player', this.playerMana, this.playerMaxMana);
        this.updateManaDisplay('ai', this.aiMana, this.aiMaxMana);
        
        // Update card counts
        document.getElementById('playerDeckCount').textContent = this.playerDeck.length;
        document.getElementById('aiCardCount').textContent = this.aiHand.length;
        
        // Update turn indicator
        document.getElementById('turnIndicator').textContent = 
            `${this.currentTurn === 'player' ? 'Your Turn' : "AI's Turn"} (Turn ${this.totalTurns})`;
        document.getElementById('endTurnBtn').disabled = this.currentTurn !== 'player';
        
        // Update hands and fields
        this.renderHand();
        this.renderFields();
    }

    updateManaDisplay(player, current, max) {
        const container = document.getElementById(`${player}Mana`);
        container.innerHTML = '';
        
        for (let i = 0; i < max; i++) {
            const crystal = document.createElement('div');
            crystal.className = 'mana-crystal';
            if (i >= current) {
                crystal.classList.add('used');
            }
            container.appendChild(crystal);
        }
    }

    renderHand() {
        const handEl = document.getElementById('playerHand');
        handEl.innerHTML = '';
        
        this.playerHand.forEach(card => {
            const cardEl = this.createCardElement(card, true);
            const actualCost = card.getDisplayCost(this.playerSpellsCount);
            
            if (actualCost <= this.playerMana && this.currentTurn === 'player') {
                cardEl.classList.add('playable');
            }
            if (this.pendingSpell === card) {
                cardEl.classList.add('selected');
            }
            
            handEl.appendChild(cardEl);
        });
        
        // AI hand (hidden)
        const aiHandEl = document.getElementById('aiHand');
        aiHandEl.innerHTML = '';
        for (let i = 0; i < this.aiHand.length; i++) {
            const cardBack = document.createElement('div');
            cardBack.className = 'card';
            cardBack.style.background = 'linear-gradient(135deg, #232526, #414345)';
            cardBack.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:40px;">?</div>';
            aiHandEl.appendChild(cardBack);
        }
    }

    renderFields() {
        // Player field
        const playerFieldEl = document.getElementById('playerField');
        playerFieldEl.innerHTML = '';
        this.playerField.forEach(card => {
            const cardEl = this.createCardElement(card, true, true);
            if (this.selectedCard === card) {
                cardEl.classList.add('selected');
            }
            if (card.tapped) {
                cardEl.classList.add('tapped');
            }
            // Show defending status for untapped non-taunt creatures
            if (!card.tapped && !card.taunt && !card.ability?.includes('Taunt')) {
                cardEl.classList.add('defending');
            }
            playerFieldEl.appendChild(cardEl);
        });
        
        // AI field
        const aiFieldEl = document.getElementById('aiField');
        aiFieldEl.innerHTML = '';
        
        // Set up field click handler that won't interfere with card clicks
        aiFieldEl.onclick = (e) => {
            // Check if the click was on a card or any card child element
            let element = e.target;
            let isCardClick = false;
            
            // Traverse up the DOM tree to see if we clicked on a card
            while (element && element !== aiFieldEl) {
                if (element.classList && element.classList.contains('card')) {
                    isCardClick = true;
                    break;
                }
                element = element.parentElement;
            }
            
            // Only handle field click if we didn't click on a card
            if (!isCardClick) {
                this.handleFieldClick('ai');
            }
        };
        
        if (this.aiField.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-field-message';
            emptyMsg.style.color = 'rgba(255,255,255,0.3)';
            emptyMsg.textContent = 'No creatures';
            aiFieldEl.appendChild(emptyMsg);
        } else {
            this.aiField.forEach((card, index) => {
                const cardEl = this.createCardElement(card, false, true);
                if (card.tapped) {
                    cardEl.classList.add('tapped');
                }
                // Show defending status for untapped non-taunt creatures
                if (!card.tapped && !card.taunt && !card.ability?.includes('Taunt')) {
                    cardEl.classList.add('defending');
                }
                
                // Extra protection for first card position
                if (index === 0) {
                    cardEl.style.zIndex = '15'; // Higher z-index for first card
                    cardEl.style.position = 'relative';
                }
                
                aiFieldEl.appendChild(cardEl);
            });
        }
    }

    // Helper: Abbreviate ability text for display
    abbreviateAbility(ability, cardType) {
        if (!ability || ability.trim() === '') return '';
        
        // Attack Trigger abilities are too complex to abbreviate - show "See Text"
        if (cardType === 'creature' && ability.includes('Attack Trigger:')) {
            return 'See Text';
        }
        
        // SPELLS: Show up to 21 characters
        if (cardType === 'spell') {
            if (ability.length <= 21) return ability;
            return ability.substring(0, 21).trim() + '...';
        }
        
        // CREATURES: Extract keywords (max 2)
        const keywords = [];
        const keywordList = ['Quick', 'Burn', 'Splash 2', 'Splash', 'Taunt', 'Rush', 'Flying', 'Stealth',
            'Charge', 'Haste', 'Vigilance', 'Lifelink', 'Lifesteal', 'Regenerate', 'Trample', 
            'Deathtouch', 'Poison', 'First Strike', 'Double Strike', 'Windfury', 'Divine Shield',
            'Spell Shield', 'Enrage', 'Reach', 'Spell Power +1', 'Spell Power +2', 'Spell Power +3'];
        
        if (ability.includes('Deathrattle:')) keywords.push('Deathrattle');
        if (ability.includes('Battlecry:')) keywords.push('Battlecry');
        // NOTE: NOT including 'Attack Trigger' - it's a prefix for complex abilities, not a displayable keyword
        
        const sortedKeywords = keywordList.sort((a, b) => b.length - a.length);
        for (let i = 0; i < sortedKeywords.length && keywords.length < 3; i++) {
            const kw = sortedKeywords[i];
            if (ability.includes(kw)) {
                // Check if we already have a keyword that CONTAINS this one (e.g., "Bypass Taunt" contains "Taunt")
                const isDuplicate = keywords.some(k => k !== kw && k.includes(kw));
                if (!isDuplicate) keywords.push(kw);
            }
        }
        
        if (keywords.length === 0) return 'See Text';
        if (keywords.length <= 2) return keywords.join('. ');
        return keywords.slice(0, 2).join('. ') + ' +';
    }

    createCardElement(card, isPlayerCard, onField = false) {
        const cardEl = document.createElement('div');
        let classes = 'card ' + card.type + ' ' + card.rarity + ' ' + (card.color || 'colorless');
        if (card.fullArt || card.variant === 'Full Art') classes += ' full-art';
        if (card.splashFriendly) classes += ' splash-friendly';
        cardEl.className = classes;
        cardEl.setAttribute('data-color', card.color || 'colorless');
        cardEl.setAttribute('data-rarity', card.rarity);
        
        if (onField) {
            cardEl.style.position = 'relative';
            cardEl.style.zIndex = '10';
            cardEl.style.pointerEvents = 'auto';
        }
        
        // ABBREVIATE TEXT (built-in logic)
        let displayText = this.abbreviateAbility(card.ability || '', card.type);
        
        // Add splash indicator
        if (card.splashFriendly && displayText) {
            if (card.type === 'spell' && displayText.length < 15) {
                displayText = displayText + ' [Splash]';
            } else if (card.type === 'creature' && displayText !== 'See Text') {
                displayText = displayText + ' [S]';
            }
        }
        
        // Check if we should hide stat emojis
        const hasLongText = card.type === 'creature' && ((card.ability && card.ability.length > 10) || (card.name && card.name.length > 12));
        
        // Dynamic name sizing
        const nameLen = card.name.length;
        const nameSize = nameLen <= 12 ? 'short' : nameLen <= 15 ? 'medium' : nameLen <= 18 ? 'long' : 'very-long';
        
        // Build HTML
        let html = '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
        
        // Display actual cost (with reductions) for cards in hand
        const displayCost = (!onField && isPlayerCard) ? this.calculateActualCost(card, 'player') : card.cost;
        
        // Debug: Log cost calculation for player hand cards
        if (!onField && isPlayerCard && card.cost !== displayCost) {
            console.log(`[COST DISPLAY] ${card.name}: ${card.cost} → ${displayCost}`);
        }
        
        html += '<div class="card-cost">' + displayCost + '</div>';
        html += '<div class="card-name" data-name-length="' + nameSize + '">' + card.name + '</div>';
        html += '<div class="card-image">' + card.emoji + '</div>';
        
        if (card.type === 'creature') {
            html += '<div class="card-description">' + displayText + '</div>';
            html += '<div class="card-stats">';
            html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
            html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
            html += '</div>';
        } else {
            html += '<div class="card-description">' + displayText + '</div>';
        }
        
        cardEl.innerHTML = html;
        
        const self = this;
        cardEl.onclick = function(e) {
            e.stopPropagation();
            if (!e.target.classList.contains('card-info-btn')) {
                self.handleCardClick(card, isPlayerCard);
            }
        };
        
        return cardEl;
    }

    addLog(message) {
        const log = document.getElementById('gameLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        log.insertBefore(entry, log.firstChild);
        
        while (log.children.length > 10) {
            log.removeChild(log.lastChild);
        }
    }

    async endGame(winner) {
        this.gameOver = true;
        
        // Compile detailed game statistics
        const gameData = {
            turnCount: this.totalTurns,
            damageDealt: this.gameStats.playerDamageDealt,
            damageTaken: this.gameStats.playerDamageTaken,
            cardsPlayed: this.gameStats.playerCardsPlayed,
            manaSpent: this.gameStats.playerManaSpent,
            creaturesSummoned: this.gameStats.playerCreaturesSummoned,
            spellsCast: this.gameStats.playerSpellsCast,
            cardsUsed: Array.from(this.gameStats.cardsUsedThisGame),
            winBy: winner === 'player' ? this.determineWinCondition() : null,
            lostBy: winner !== 'player' ? this.determineWinCondition() : null,
            gameDuration: Date.now() - this.gameStats.startTime,
            playerTurns: this.playerTurnCount,
            aiMaxMana: this.aiMaxMana,
            playerMaxMana: this.playerMaxMana
        };
        
        console.log('[GAME STATS] Game ended with data:', gameData);
        console.log('[REWARDS] Winner:', winner);
        
        // In v3 mode, use server API for rewards
        if (window.isV3Mode) {
            await this.endGameV3(winner, gameData);
            return;
        }
        
        // v2.1 mode - use localStorage
        console.log('[REWARDS] Gold before:', window.storage.playerData.gold);
        
        window.storage.recordGameResult(winner === 'player', gameData);
        
        let goldReward = 0;
        let gemReward = 0;
        
        if (winner === 'player') {
            goldReward = 50 + Math.floor(Math.random() * 50);
            if (Math.random() < 0.1) gemReward = 1;
            
            console.log('[REWARDS] Victory! Granting:', goldReward, 'gold and', gemReward, 'gems');
            window.storage.addGold(goldReward);
            if (gemReward > 0) window.storage.addGems(gemReward);
        } else {
            goldReward = 10;
            console.log('[REWARDS] Defeat. Granting consolation:', goldReward, 'gold');
            window.storage.addGold(goldReward);
        }
        
        console.log('[REWARDS] Gold after:', window.storage.playerData.gold);
        console.log('[REWARDS] Calling showWinnerScreen with rewards:', goldReward, gemReward);
        
        window.ui.showWinnerScreen(winner, goldReward, gemReward);
    }
    
    // v3.0.0: End game via server API
    async endGameV3(winner, gameData) {
        try {
            console.log('[V3] Sending game result to server...');
            
            const result = await window.storage.recordGameResultV3(winner === 'player', gameData);
            
            // Update local data from server
            window.playerData.gold = result.newGold;
            window.playerData.gems = result.newGems;
            
            // Update UI and show rewards
            window.ui.updateCurrencyDisplay();
            window.ui.showWinnerScreen(winner, result.goldReward || 0, result.gemsReward || 0);
            
            console.log('[V3] Game result recorded, rewards:', result.goldReward, result.gemsReward);
        } catch (error) {
            console.error('[V3] Failed to record game result:', error);
            // Still show winner screen even if API fails
            window.ui.showWinnerScreen(winner, 0, 0);
            alert('Failed to save game result. Your rewards may not have been saved.');
        }
    }
    
    // Determine how the game was won/lost
    determineWinCondition() {
        if (this.playerHealth <= 0 || this.aiHealth <= 0) {
            return 'damage'; // Most common win condition
        } else if (this.playerDeck.length === 0 || this.aiDeck.length === 0) {
            return 'deckout'; // Ran out of cards
        } else {
            return 'surrender'; // Game ended by restart/quit
        }
    }

    restart() {
        document.getElementById('winnerScreen').style.display = 'none';
        
        // Create fresh Card instances from the original templates to avoid health caching
        const freshDeck = this.originalPlayerDeckTemplates.map(template => new window.Card(template));
        window.game = new Game(freshDeck);
    }
}

// Debug Game Class
class DebugGame extends Game {
    constructor(playerDeckCards, debugSetup) {
        super(playerDeckCards);
        
        // Override with debug values
        this.isDebugMode = true;
        this.playerHealth = debugSetup.playerHealth;
        this.aiHealth = debugSetup.aiHealth;
        this.playerMana = debugSetup.playerMana;
        this.playerMaxMana = debugSetup.playerMana;
        this.aiMana = debugSetup.aiMana;
        this.aiMaxMana = debugSetup.aiMana;
        
        // Set up debug cards
        this.playerHand = [...debugSetup.playerHand];
        this.playerField = [...debugSetup.playerField];
        this.aiField = [...debugSetup.aiField];
        
        this.playerDeck = playerDeckCards.slice(10);
        
        // Initialize debug turn counters based on mana (estimate)
        this.playerTurnCount = debugSetup.playerMana;
        this.totalTurns = debugSetup.playerMana * 2 - 1; // Rough estimate
        
        this.updateDisplay();
        this.addLog("=== DEBUG MODE ACTIVE ===");
        this.addLog("No rewards will be given in debug mode.");
    }
    
    restart() {
        document.getElementById('winnerScreen').style.display = 'none';
        // For debug mode, create a new regular game with fresh Card instances
        const freshDeck = this.originalPlayerDeckTemplates.map(template => new window.Card(template));
        window.game = new Game(freshDeck);
    }
    
    endGame(winner) {
        this.gameOver = true;
        const goldReward = 0;
        const gemReward = 0;
        window.ui.showWinnerScreen(winner, goldReward, gemReward);
    }
}

// Make Game classes globally available
window.Game = Game;
window.DebugGame = DebugGame;

console.log('✅ Game classes loaded');
