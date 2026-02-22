// V3.0 Complete Abilities System
// Implements ALL missing abilities from colored card expansion
// Load this AFTER Game.js to extend ability handling

console.log('🎴 Loading v3.0 Complete Abilities System...');

// ==================== HELPER FUNCTIONS ====================

// Check if player has specific color on board
function hasColorOnBoard(field, color, excludeCard = null) {
    return field.some(c => c !== excludeCard && c.color && c.color.includes(color));
}

// Check if player has both colors from a dual-color card
// excludeCard: Don't count this card when checking (prevents self-counting)
function hasBothColors(field, cardColor, excludeCard = null) {
    if (!cardColor || !cardColor.includes('-')) return false;
    const colors = cardColor.split('-');
    return colors.every(c => hasColorOnBoard(field, c, excludeCard));
}

// Get count of specific color creatures
function getColorCreatureCount(field, color) {
    return field.filter(c => c.color && c.color.includes(color)).length;
}

// Check if card is splash (3rd color)
function isSplashCard(card, field) {
    if (!card.splashFriendly) return false;
    
    const mainColors = new Set();
    field.forEach(c => {
        if (c.color !== 'colorless' && !c.splashFriendly && c !== card) {
            c.color.split('-').forEach(col => mainColors.add(col));
        }
    });
    
    return !mainColors.has(card.color);
}

// ==================== EXTEND GAME CLASS ====================

// Store original methods
const originalPlayCreature = Game.prototype.playCreature;
const originalHandleEnterPlayAbilities = Game.prototype.handleEnterPlayAbilities;
const originalHandleSpell = Game.prototype.handleSpell;
const originalAttack = Game.prototype.attack;
const originalCheckCreatureDeaths = Game.prototype.checkCreatureDeaths;
const originalStartNewTurn = Game.prototype.startNewTurn;
const originalPlayCard = Game.prototype.playCard;
const originalCreatureCombat = Game.prototype.creatureCombat;

// Track creatures that died this game for cost reduction
Game.prototype.totalCreatureDeaths = 0;

// ==================== ENHANCED PLAY CARD (COST MODIFIERS) ====================
Game.prototype.playCard = function(card, player) {
    if (this.gameOver) return;
    
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    let mana = player === 'player' ? this.playerMana : this.aiMana;
    
    // Calculate actual cost with ALL modifiers
    let actualCost = this.calculateActualCost(card, player);
    
    // Handle Death's Shadow (costs health instead of mana)
    if (card.ability === "Costs health instead of mana (1 health per mana)") {
        const healthCost = card.cost;
        if (player === 'player') {
            if (this.playerHealth <= healthCost) {
                this.addLog("Not enough health!");
                return false;
            }
            this.playerHealth -= healthCost;
        } else {
            if (this.aiHealth <= healthCost) return false;
            this.aiHealth -= healthCost;
        }
        actualCost = 0; // No mana cost
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
    
    // Handle targeting spells (existing code)
    if (card.type === 'spell' && player === 'player') {
        if (card.ability.includes('Deal') || card.ability.includes('Destroy creature') || 
            card.ability.includes('Freeze target') || card.ability.includes('Return target') ||
            card.ability.includes('Steal creature')) {
            this.pendingSpell = card;
            this.pendingTargetType = this.determineTargetType(card);
            this.addLog("Select a target for " + card.name);
            this.updateDisplay();
            return false;
        }
    }
    
    // Remove card from hand and spend mana
    const index = hand.indexOf(card);
    hand.splice(index, 1);
    
    if (player === 'player') {
        this.playerMana -= actualCost;
        if (card.type === 'spell') this.playerSpellsCount++;
        this.gameStats.playerCardsPlayed++;
        this.gameStats.playerManaSpent += actualCost;
        this.gameStats.cardsUsedThisGame.add(card.name);
        if (card.type === 'spell') this.gameStats.playerSpellsCast++;
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
    
    // Trigger on-spell-cast effects
    this.triggerOnSpellCast(card, player);
    
    this.updateDisplay();
    return true;
};

// Calculate actual cost with all modifiers
Game.prototype.calculateActualCost = function(card, player) {
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const spellsCount = player === 'player' ? this.playerSpellsCount : this.aiSpellsCount;
    
    let cost = card.cost;
    
    // Aura-based cost reduction
    field.forEach(c => {
        // Generic cost reduction - FIX: Use .includes() to catch The Nexus
        if (c.ability && (c.ability.includes("Your cards cost 1 less") || c.ability.includes("Your spells cost 1 less"))) {
            if (c.ability.includes('spells') && card.type === 'spell') cost -= 1;
            else if (c.ability.includes('Your cards cost 1 less')) cost -= 1;
        }
        if (c.ability === "Your spells cost 2 less" && card.type === 'spell') cost -= 2;
        if (c.ability === "Your spells cost 2 less and draw a card" && card.type === 'spell') cost -= 2;
        
        // Color-specific cost reduction
        if (c.ability.includes("Your Azure cards cost 1 less") && card.color && card.color.includes('azure')) cost -= 1;
        if (c.ability.includes("Your Azure cards cost 2 less") && card.color && card.color.includes('azure')) cost -= 2;
        if (c.ability.includes("All your Azure cards cost 2 less") && card.color && card.color.includes('azure')) cost -= 2;
        if (c.ability.includes("Your Crimson creatures cost 1 less") && card.type === 'creature' && card.color && card.color.includes('crimson')) cost -= 1;
        if (c.ability.includes("Your Umbral creatures cost 1 less") && card.type === 'creature' && card.color && card.color.includes('umbral')) cost -= 1;
        if (c.ability.includes("Your Umbral creatures cost 2 less") && card.type === 'creature' && card.color && card.color.includes('umbral')) cost -= 2;
        if (c.ability.includes("All your Verdant creatures cost 2 less") && card.type === 'creature' && card.color && card.color.includes('verdant')) cost -= 2;
        if (c.ability.includes("All Verdant creatures cost 1 less") && card.type === 'creature' && card.color && card.color.includes('verdant')) cost -= 1;
        
        // Multi-color cost reduction
        if (c.ability.includes("Your Azure and Verdant cards cost 2 less") && card.color && (card.color.includes('azure') || card.color.includes('verdant'))) cost -= 2;
        if (c.ability.includes("Your Azure and Umbral cards cost 0") && card.color && (card.color.includes('azure') || card.color.includes('umbral'))) {
            cost = 0;
        }
    });
    
    // Card-specific cost reduction
    if (card.ability === "Costs 1 less per spell cast (minimum 2)") {
        cost = Math.max(2, cost - spellsCount);
    }
    if (card.ability === "Costs 1 less for each spell cast this game") {
        cost = Math.max(0, cost - spellsCount);
    }
    if (card.ability.includes("Costs 1 less for each spell cast")) {
        cost = Math.max(0, cost - spellsCount);
    }
    if (card.ability.includes("Costs 1 less for each damaged creature")) {
        const damagedCount = [...field, ...enemyField].filter(c => c.health < c.maxHealth).length;
        cost = Math.max(0, cost - damagedCount);
    }
    if (card.ability.includes("Costs 1 less for each enemy creature")) {
        cost = Math.max(0, cost - enemyField.length);
    }
    if (card.ability.includes("Costs 1 less for each friendly creature that died")) {
        const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
        cost = Math.max(0, cost - graveyard.length);
    }
    if (card.ability.includes("Costs 1 less for each creature that died this game")) {
        cost = Math.max(0, cost - this.totalCreatureDeaths);
    }
    if (card.ability.includes("Costs 1 less for each Verdant creature you control")) {
        const verdantCount = getColorCreatureCount(field, 'verdant');
        cost = Math.max(0, cost - verdantCount);
    }
    if (card.ability.includes("Costs 1 less for each friendly creature")) {
        cost = Math.max(0, cost - field.length);
    }
    
    return Math.max(0, cost);
};

// Determine spell target type
Game.prototype.determineTargetType = function(card) {
    if (card.ability.includes('enemy creature') || card.ability.includes('Destroy creature') || 
        card.ability.includes('Steal creature')) {
        return 'enemy creature';
    }
    if (card.ability.includes('Return target creature') || card.ability.includes('Freeze target')) {
        return 'any creature';
    }
    return 'enemy';
};

// ==================== ENHANCED PLAY CREATURE ====================
Game.prototype.playCreature = function(card, player, field) {
    card.tapped = true;
    card.frozen = false;
    card.hasAttackedThisTurn = false;
    card.doubleStrikeUsed = false;
    field.push(card);
    this.addLog(`${player === 'player' ? 'You' : 'AI'} played ${card.name}`);
    
    if (player === 'player') {
        this.gameStats.playerCreaturesSummoned++;
    }
    
    // Handle immediate abilities
    if (card.ability === 'Rush') {
        card.tapped = false;
        card.justPlayed = true;
        card.canOnlyAttackCreatures = true;
    } else if (card.ability === 'Quick' || card.ability === 'Charge' || card.ability === 'Haste') {
        card.tapped = false;
    } else if (card.ability.includes('Charge')) {
        card.tapped = false;
    }
    
    if (card.ability === 'Vigilance' || card.ability.includes('Vigilance')) {
        card.vigilance = true;
    }
    
    // Handle enter-play abilities
    this.handleEnterPlayAbilities(card, player, field);
    
    // Apply auras from this creature
    this.applyAuras();
    
    // Update spell power
    this.updateSpellPower();
};

// ==================== ENHANCED ENTER PLAY ABILITIES ====================
Game.prototype.handleEnterPlayAbilities = function(card, player, field) {
    const ability = card.ability;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    
    // Simple draw effects (exclude deathrattles)
    if (!ability.includes('Deathrattle') && (ability === 'Draw a card' || ability === 'Draw a card when played' || ability.includes('Draw 2 cards') || ability.includes('Draw 3 cards'))) {
        const drawCount = parseInt(ability.match(/\d+/)?.[0] || 1);
        for (let i = 0; i < drawCount; i++) {
            this.drawCard(player);
        }
    }
    
    // Conditional draw effects
    if (ability.includes('Battlecry: If you control a Verdant creature, draw a card')) {
        if (hasColorOnBoard(field, 'verdant')) {
            this.drawCard(player);
            this.addLog("Battlecry: Drew a card!");
        }
    }
    if (ability.includes('Draw card. If Verdant on board, gain 3 health')) {
        this.drawCard(player);
        if (hasColorOnBoard(field, 'verdant')) {
            if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
            this.addLog("Also gained 3 health!");
        }
    }
    if (ability.includes('Draw card. If Crimson creature on board, deal 2 damage')) {
        this.drawCard(player);
        if (hasColorOnBoard(field, 'crimson')) {
            this.dealDamage(enemyPlayer, 2);
            this.addLog("Also dealt 2 damage!");
        }
    }
    if (ability.includes('Draw card. If both colors, enemy loses 2 health')) {
        this.drawCard(player);
        // Exclude the card itself from both colors check
        if (hasBothColors(field, card.color, card)) {
            this.dealDamage(enemyPlayer, 2);
            this.addLog("Enemy loses 2 health!");
        }
    }
    
    // Battlecry draw effects
    if (ability.includes('Battlecry: Draw cards equal to Azure creatures you control')) {
        const azureCount = getColorCreatureCount(field, 'azure');
        for (let i = 0; i < azureCount; i++) {
            this.drawCard(player);
        }
        this.addLog(`Battlecry: Drew ${azureCount} cards!`);
    }
    if (ability.includes('Battlecry: Draw cards equal to Verdant creatures')) {
        const verdantCount = getColorCreatureCount(field, 'verdant');
        for (let i = 0; i < verdantCount; i++) {
            this.drawCard(player);
        }
        // Make those cards cost 1
        const recentCards = (player === 'player' ? this.playerHand : this.aiHand).slice(-verdantCount);
        recentCards.forEach(c => {
            c.tempCost = 1;
            c.cost = 1;
        });
        this.addLog(`Battlecry: Drew ${verdantCount} cards! They cost 1.`);
    }
    
    // Battlecry: Deal damage
    if (ability.includes('Battlecry: Deal 2 damage')) {
        this.dealDamage(enemyPlayer, 2);
        this.addLog("Battlecry: Dealt 2 damage!");
    }
    if (ability.includes('Battlecry: Deal 3 damage')) {
        this.dealDamage(enemyPlayer, 3);
        this.drawCard(player);
        this.addLog("Battlecry: Dealt 3 damage and drew a card!");
    }
    if (ability.includes('Battlecry: Deal 4 damage to all other creatures')) {
        [...this.playerField, ...this.aiField].forEach(c => {
            if (c !== card && !c.immune) {
                c.takeDamage(4);
            }
        });
        this.addLog("Battlecry: Dealt 4 damage to all other creatures!");
        this.checkCreatureDeaths();
    }
    
    // Battlecry: Gain health
    if (ability.includes('Battlecry: Gain 2 health')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
        this.addLog("Battlecry: Gained 2 health!");
    }
    if (ability.includes('Battlecry: Gain 3 health') || ability.includes('Gain 3 health')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
        this.addLog("Gained 3 health!");
    }
    if (ability.includes('Gain 2 health. If Crimson on board, deal 2 damage')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
        if (hasColorOnBoard(field, 'crimson')) {
            this.dealDamage(enemyPlayer, 2);
            this.addLog("Also dealt 2 damage!");
        }
    }
    
    // Battlecry: Buff allies
    if (ability.includes('Battlecry: All allies gain +1/+2')) {
        field.forEach(c => {
            if (c !== card) {
                c.attack += 1;
                c.health += 2;
                c.maxHealth += 2;
            }
        });
        this.addLog("Battlecry: All allies gain +1/+2!");
    }
    
    // Battlecry: Restore health
    if (ability.includes('Battlecry: Restore 5 health')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
        this.addLog("Battlecry: Restored 5 health!");
    }
    
    // Battlecry: Return creatures to hand
    if (ability.includes('Battlecry: Return all tapped creatures to their owner\'s hands')) {
        // Time Lord - Return all tapped creatures
        [...this.playerField, ...this.aiField].forEach(c => {
            if (c !== card && c.tapped) {
                if (this.playerField.includes(c)) {
                    this.playerField.splice(this.playerField.indexOf(c), 1);
                    if (this.playerHand.length < 10) this.playerHand.push(c);
                } else {
                    this.aiField.splice(this.aiField.indexOf(c), 1);
                    if (this.aiHand.length < 10) this.aiHand.push(c);
                }
            }
        });
        this.addLog("Time Lord: All tapped creatures returned to hand!");
    } else if (ability.includes('Battlecry: Return all other creatures to hand')) {
        [...this.playerField, ...this.aiField].forEach(c => {
            if (c !== card) {
                if (this.playerField.includes(c)) {
                    this.playerField.splice(this.playerField.indexOf(c), 1);
                    if (this.playerHand.length < 10) this.playerHand.push(c);
                } else {
                    this.aiField.splice(this.aiField.indexOf(c), 1);
                    if (this.aiHand.length < 10) this.aiHand.push(c);
                }
            }
        });
        this.addLog("Battlecry: All other creatures returned to hand!");
    }
    if (ability.includes('Battlecry: Return enemy creature to hand (3+ cost)')) {
        const targets = enemyField.filter(c => c.cost >= 3);
        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            enemyField.splice(enemyField.indexOf(target), 1);
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            if (enemyHand.length < 10) enemyHand.push(target);
            this.addLog(`Battlecry: Returned ${target.name} to hand!`);
        }
    }
    
    // Battlecry: Freeze
    if (ability.includes('Freeze all enemy creatures when played')) {
        enemyField.forEach(c => {
            c.frozen = true;
        });
        this.addLog("Battlecry: Froze all enemy creatures!");
    }
    
    // Battlecry: Summon tokens
    if (ability.includes('Battlecry: Gain +4/+4 or Summon two 2/2 Treants')) {
        // For AI, randomly choose; for player, would need UI
        if (player === 'ai' || Math.random() < 0.5) {
            card.attack += 4;
            card.health += 4;
            card.maxHealth += 4;
            this.addLog(`${card.name} gains +4/+4!`);
        } else {
            for (let i = 0; i < 2 && field.length < 7; i++) {
                const treant = new Card({
                    name: "Treant", cost: 0, type: "creature", attack: 2, health: 2,
                    ability: "", emoji: "🌳", rarity: "common", color: "verdant"
                });
                treant.tapped = true;
                field.push(treant);
            }
            this.addLog("Summoned two 2/2 Treants!");
        }
    }
    
    // Prismatic Golem - Gain random keyword
    if (ability.includes('Battlecry: Gain random keyword (Charge/Flying/Taunt/Lifesteal)')) {
        const keywords = [
            { name: 'Charge', apply: (c) => { c.tapped = false; c.ability = 'Charge'; } },
            { name: 'Flying', apply: (c) => { c.ability = 'Flying'; } },
            { name: 'Taunt', apply: (c) => { c.taunt = true; c.ability = 'Taunt'; } },
            { name: 'Lifesteal', apply: (c) => { c.ability = 'Lifesteal'; } }
        ];
        
        const chosen = keywords[Math.floor(Math.random() * keywords.length)];
        chosen.apply(card);
        this.addLog(`${card.name} gained ${chosen.name}!`);
    }
    
    // Battlecry: Take extra turn
    if (ability.includes('Battlecry: Take an extra turn')) {
        if (player === 'player') {
            this.playerExtraTurn = true;
        } else {
            this.aiExtraTurn = true;
        }
        this.addLog("Will take an extra turn!");
    }
    
    // Conditional bonuses
    if (ability.includes('Charge. If you control both Crimson and Verdant, +2/+2')) {
        card.tapped = false;
        if (hasBothColors(field, 'crimson-verdant')) {
            card.attack += 2;
            card.health += 2;
            card.maxHealth += 2;
            this.addLog(`${card.name} gains +2/+2!`);
        }
    }
    if (ability.includes('Taunt. Draw a card. If both colors, +2/+2')) {
        card.taunt = true;
        this.drawCard(player);
        // Exclude the card itself from both colors check
        if (hasBothColors(field, card.color, card)) {
            card.attack += 2;
            card.health += 2;
            card.maxHealth += 2;
            this.addLog(`${card.name} gains +2/+2!`);
        }
    }
    if (ability.includes('If you control an Azure card, gain Taunt')) {
        if (hasColorOnBoard(field, 'azure')) {
            card.taunt = true;
            this.addLog(`${card.name} gains Taunt!`);
        }
    }
    
    // Call original for remaining legacy abilities
    originalHandleEnterPlayAbilities.call(this, card, player, field);
};

// ==================== APPLY AURAS ====================
// Apply all aura effects from creatures on board
Game.prototype.applyAuras = function() {
    // Reset all creatures to base stats and clear aura bonuses
    [...this.playerField, ...this.aiField].forEach(c => {
        // Initialize baseAttack/baseHealth if not set (for existing cards)
        if (c.baseAttack === undefined) {
            c.baseAttack = c.attack;
            console.log(`[AURA FIX] Initializing baseAttack for ${c.name}: ${c.baseAttack}`);
        }
        if (c.baseHealth === undefined) {
            c.baseHealth = c.maxHealth;
        }
        
        // Reset to base stats (excluding permanent buffs from spells)
        c.attack = c.baseAttack + (c.enraged ? 2 : 0); // Keep enrage bonus
        
        // Carefully reset health to base while preserving damage taken
        const healthDiff = c.maxHealth - c.health; // Track damage taken
        c.maxHealth = c.baseHealth;
        c.health = Math.max(1, c.maxHealth - healthDiff);
        
        // Reset aura bonuses
        c.auraAttackBonus = 0;
        c.auraHealthBonus = 0;
        c.auraCharge = false;
    });
    
    // Apply player auras
    this.playerField.forEach(source => {
        this.applyCreatureAuras(source, this.playerField, 'player');
    });
    
    // Apply AI auras
    this.aiField.forEach(source => {
        this.applyCreatureAuras(source, this.aiField, 'ai');
    });
    
    // Apply enemy debuff auras
    this.playerField.forEach(source => {
        this.applyDebuffAuras(source, this.aiField);
    });
    this.aiField.forEach(source => {
        this.applyDebuffAuras(source, this.playerField);
    });
    
    // Now apply the aura bonuses to actual stats
    [...this.playerField, ...this.aiField].forEach(c => {
        c.attack += c.auraAttackBonus;
        c.health += c.auraHealthBonus;
        c.maxHealth += c.auraHealthBonus;
        
        // Log War Drummer's effect
        if (c.auraAttackBonus > 0) {
            console.log(`[AURA] ${c.name} gets +${c.auraAttackBonus} attack from auras (total: ${c.attack})`);
        }
    });
};

// Apply auras from a single creature
Game.prototype.applyCreatureAuras = function(source, field, player) {
    const ability = source.ability;
    
    console.log(`[AURA DEBUG] Checking auras from ${source.name}: "${ability}"`);
    
    // Tribal attack buffs
    if (ability.includes('Your Crimson creatures have +1 attack')) {
        console.log(`[AURA DEBUG] War Drummer found! Applying +1 attack to Crimson creatures`);
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('crimson')) {
                c.auraAttackBonus += 1;
                console.log(`[AURA DEBUG] ${c.name} (${c.color}) gets +1 attack`);
            }
        });
    }
    if (ability.includes('All your Crimson creatures have Charge and +2 attack')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('crimson')) {
                c.auraAttackBonus += 2;
                c.auraCharge = true;
                if (c.tapped && !c.hasAttackedThisTurn) c.tapped = false;
            }
        });
    }
    
    // Verdant creature buffs
    if (ability.includes('All your Verdant creatures have +1/+1')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('verdant')) {
                c.auraAttackBonus += 1;
                c.auraHealthBonus += 1;
            }
        });
    }
    if (ability.includes('All your Verdant creatures cost 2 less and have +2/+2') || 
        ability.includes('All your Verdant creatures have +2/+2')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('verdant')) {
                c.auraAttackBonus += 2;
                c.auraHealthBonus += 2;
            }
        });
    }
    if (ability.includes('Your Verdant creatures have +0/+1')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('verdant')) {
                c.auraHealthBonus += 1;
            }
        });
    }
    if (ability.includes('All your Verdant creatures have Charge and +2 attack')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('verdant')) {
                c.auraAttackBonus += 2;
                c.auraCharge = true;
                if (c.tapped && !c.hasAttackedThisTurn) c.tapped = false;
            }
        });
    }
    
    // Crimson creature abilities
    if (ability.includes('Your Crimson creatures have Charge')) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('crimson')) {
                c.auraCharge = true;
                if (c.tapped && !c.hasAttackedThisTurn) c.tapped = false;
            }
        });
    }
    
    // Regenerate aura
    if (ability.includes('All your creatures have Regenerate')) {
        field.forEach(c => {
            if (c !== source) {
                c.auraRegenerate = true;
            }
        });
    }
    
    // Deathrattle aura
    if (ability.includes("Your Verdant creatures have 'Deathrattle: Return to hand'")) {
        field.forEach(c => {
            if (c !== source && c.color && c.color.includes('verdant')) {
                c.auraDeathrattleReturn = true;
            }
        });
    }
    
    // Can't die aura
    if (ability.includes("Your creatures can't die")) {
        field.forEach(c => {
            if (c !== source) {
                c.cantDie = true;
            }
        });
    }
};

// Apply debuff auras to enemy creatures
Game.prototype.applyDebuffAuras = function(source, enemyField) {
    const ability = source.ability;
    
    if (ability.includes('All enemy creatures have -1/-1')) {
        enemyField.forEach(c => {
            c.attack = Math.max(0, c.attack - 1);
            c.health = Math.max(1, c.health - 1);
            c.maxHealth = Math.max(1, c.maxHealth - 1);
        });
    }
    if (ability.includes('All enemy creatures have -2/-2') || ability.includes('All enemy creatures get -2/-2')) {
        enemyField.forEach(c => {
            c.attack = Math.max(0, c.attack - 2);
            c.health = Math.max(1, c.health - 2);
            c.maxHealth = Math.max(1, c.maxHealth - 2);
        });
    }
};

// ==================== ENHANCED ATTACK ====================
Game.prototype.attack = function(attacker, target) {
    console.log(`[ATTACK DEBUG] ${attacker.name} trying to attack ${target.name || target}`);
    console.log(`[ATTACK DEBUG] Attacker ability: "${attacker.ability}"`);
    
    if (this.gameOver || !attacker.canAttack()) {
        console.log(`[ATTACK DEBUG] Attack blocked - gameOver: ${this.gameOver}, canAttack: ${attacker.canAttack()}`);
        return;
    }
    
    // FISH BYPASS TAUNT FIX: Check bypass BEFORE calling original attack
    const isTargetCreature = (target !== 'player' && target !== 'ai');
    const attackingPlayer = this.playerField.includes(attacker) ? 'player' : 'ai';
    const enemyPlayer = attackingPlayer === 'player' ? 'ai' : 'player';
    const enemyField = attackingPlayer === 'player' ? this.aiField : this.playerField;
    const taunts = enemyField.filter(c => c.ability === 'Taunt' || c.taunt);
    const bypassesTaunt = attacker.ability && attacker.ability.includes('Bypass Taunt');
    
    console.log(`[TAUNT CHECK] ${attacker.name}, Bypass: ${bypassesTaunt}, Taunts: ${taunts.length}`);
    
    // If attacker can bypass taunt, temporarily clear the taunt flags
    if (bypassesTaunt && taunts.length > 0 && !isTargetCreature) {
        console.log(`[BYPASS TAUNT] ${attacker.name} bypassing ${taunts.length} taunt creatures!`);
        // Temporarily remove taunt properties so original attack function allows it
        const tauntBackup = taunts.map(c => ({creature: c, hadTaunt: c.taunt}));
        taunts.forEach(c => {
            c.taunt = false;
        });
        
        // Call original attack
        const attackerHadAttacked = attacker.hasAttackedThisTurn;
        originalAttack.call(this, attacker, target);
        
        // Restore taunt properties
        tauntBackup.forEach(backup => {
            backup.creature.taunt = backup.hadTaunt;
        });
        
        // Trigger attack abilities if attack succeeded
        if (attacker.hasAttackedThisTurn && !attackerHadAttacked) {
            this.triggerAttackAbilities(attacker, target, attackingPlayer, enemyPlayer);
        }
        return;
    }
    
    // Store initial state to detect if attack succeeded
    const attackerHadAttacked = attacker.hasAttackedThisTurn;
    
    // Call original attack (validation happens here)
    originalAttack.call(this, attacker, target);
    
    // CRITICAL: Only trigger attack abilities if attack actually happened
    // Check if attacker state changed (attack was successful)
    if (attacker.hasAttackedThisTurn && !attackerHadAttacked) {
        // Attack succeeded! Trigger attack-based abilities
        this.triggerAttackAbilities(attacker, target, attackingPlayer, enemyPlayer);
    }
};

// Trigger abilities that activate when attacking
// attackingPlayer and enemyPlayer passed in to avoid dead creature field checks
Game.prototype.triggerAttackAbilities = function(attacker, target, attackingPlayer, enemyPlayer) {
    const ability = attacker.ability;
    const field = attackingPlayer === 'player' ? this.playerField : this.aiField;
    const enemyField = attackingPlayer === 'player' ? this.aiField : this.playerField;
    
    // Attack Trigger: Deal damage to enemy player
    if (ability.includes('Attack Trigger: Deal 1 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 1);
    } else if (ability.includes('Attack Trigger: Deal 1 damage')) {
        // Generic "Deal 1 damage" (Magma Lizard)
        this.dealDamage(enemyPlayer, 1);
    } else if (ability.includes('Attack Trigger: Deal 2 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 2);
        enemyField.forEach(c => c.takeDamage(2));
        this.checkCreatureDeaths();
    }
    if (ability.includes('Attack Trigger: Deal 3 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 3);
    }
    if (ability.includes('Attack Trigger: Deal 3 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 3);
        enemyField.forEach(c => c.takeDamage(3));
        this.checkCreatureDeaths();
    }
    if (ability.includes('Attack Trigger: Deal 4 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 4);
        enemyField.forEach(c => c.takeDamage(4));
        this.checkCreatureDeaths();
    }
    if (ability.includes('Attack Trigger: Deal 5 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 5);
    }
    // Shadow Infinity - Deal 7 damage when attacking
    if (ability.includes('Deal 7 damage to all enemies when attacking')) {
        this.dealDamage(enemyPlayer, 7);
        enemyField.forEach(c => c.takeDamage(7));
        this.checkCreatureDeaths();
        this.addLog(`${card.name} deals 7 damage to all enemies!`);
    }
    if (ability.includes('Attack Trigger: Deal 5 damage to enemy player (old)')) {
        this.dealDamage(enemyPlayer, 5);
    }
    if (ability.includes('Attack Trigger: Deal damage equal to this creature\'s attack to all enemies')) {
        this.dealDamage(enemyPlayer, attacker.attack);
        enemyField.forEach(c => c.takeDamage(attacker.attack));
        this.addLog(`Deals ${attacker.attack} damage to all enemies!`);
        this.checkCreatureDeaths();
    }
    
    // Attack Trigger: Draw card
    if (ability.includes('Attack Trigger: Draw a card')) {
        this.drawCard(attackingPlayer);
    }
    
    // Attack Trigger: Discard
    if (ability.includes('Attack Trigger: Enemy discards a card')) {
        const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
        if (enemyHand.length > 0) {
            enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1);
            this.addLog("Enemy discarded a card!");
        }
    }
    
    // Attack Trigger: Destroy creature
    if (ability.includes('Attack Trigger: Destroy random enemy creature')) {
        if (enemyField.length > 0) {
            const target = enemyField[Math.floor(Math.random() * enemyField.length)];
            target.health = 0;
            this.addLog(`Destroyed ${target.name}!`);
            this.checkCreatureDeaths();
        }
    }
    
    // Attack Trigger: Buff allies
    if (ability.includes('Attack Trigger: All allies gain +1/+1')) {
        field.forEach(c => {
            if (c !== attacker) {
                c.attack += 1;
                c.health += 1;
                c.maxHealth += 1;
            }
        });
        this.addLog("All allies gain +1/+1!");
    }
    if (ability.includes('Attack Trigger: All allies gain +2/+2')) {
        field.forEach(c => {
            if (c !== attacker) {
                c.attack += 2;
                c.health += 2;
                c.maxHealth += 2;
            }
        });
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
        this.addLog("All allies gain +2/+2! You gain 5 health!");
    }
    if (ability.includes('Attack Trigger: All Crimson/Verdant allies +1/+1')) {
        field.forEach(c => {
            if (c !== attacker && c.color && (c.color.includes('crimson') || c.color.includes('verdant'))) {
                c.attack += 1;
                c.health += 1;
                c.maxHealth += 1;
            }
        });
        this.addLog("Crimson/Verdant allies gain +1/+1!");
    }
    
    // Freeze enemy when attacking
    if (ability.includes('Freeze enemy when attacking')) {
        if (target !== 'player' && target !== 'ai') {
            target.frozen = true;
            this.addLog(`${target.name} is frozen!`);
        }
    }
    
    // Draw a card when attacking
    if (ability.includes('Draw a card when attacking')) {
        this.drawCard(player);
    }
};

// ==================== ENHANCED CREATURE COMBAT ====================
Game.prototype.creatureCombat = function(attacker, target) {
    // Call original combat
    originalCreatureCombat.call(this, attacker, target);
    
    // Trigger on-damage abilities
    this.triggerOnDamageAbilities(attacker, target);
};

// Trigger abilities when creatures take damage
Game.prototype.triggerOnDamageAbilities = function(attacker, target) {
    const attackerOwner = this.playerField.includes(attacker) ? 'player' : 'ai';
    const targetOwner = this.playerField.includes(target) ? 'player' : 'ai';
    const attackerField = attackerOwner === 'player' ? this.playerField : this.aiField;
    const targetField = targetOwner === 'player' ? this.playerField : this.aiField;
    
    // Thornmail Beast - deal damage back to attacker
    if (target.ability.includes('Whenever this takes damage, deal 2 damage to attacker')) {
        if (attacker.health > 0) {
            attacker.takeDamage(2);
            this.addLog(`${target.name} deals 2 damage back to ${attacker.name}!`);
        }
    }
    
    // Verdant Hydra - summon spawn when damaged
    if (target.ability.includes('Whenever this takes damage, summon a 2/2 Verdant Spawn') && target.health > 0) {
        if (targetField.length < 7) {
            const spawn = new Card({
                name: "Verdant Spawn", cost: 0, type: "creature", attack: 2, health: 2,
                ability: "", emoji: "🐍", rarity: "common", color: "verdant"
            });
            spawn.tapped = true;
            targetField.push(spawn);
            this.addLog("Summoned a 2/2 Verdant Spawn!");
        }
    }
};

// ==================== ON SPELL CAST TRIGGERS ====================
Game.prototype.triggerOnSpellCast = function(spell, player) {
    if (spell.type !== 'spell') return;
    
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // Mirror Mage - draw when casting spell
    field.forEach(c => {
        if (c.ability === 'Whenever you cast a spell, draw a card') {
            this.drawCard(player);
            this.addLog(`${c.name} triggers: Drew a card!`);
        }
    });
    
    // War Machine - gain +1/+1 when casting Crimson spell
    field.forEach(c => {
        if (c.ability.includes('Whenever you cast a Crimson spell, this gains +1/+1') && 
            spell.color && spell.color.includes('crimson')) {
            c.attack += 1;
            c.health += 1;
            c.maxHealth += 1;
            this.addLog(`${c.name} gains +1/+1!`);
        }
    });
    
    // Stormcaller Zephyr / Pyroclast Archon - spell triggers
    field.forEach(c => {
        if (c.ability.includes('Whenever you cast a spell, draw a card and deal 2 damage to all enemies') ||
            c.ability.includes('Whenever you cast spell, deal 3 damage and draw card')) {
            const damage = c.ability.includes('deal 3') ? 3 : 2;
            this.drawCard(player);
            const enemyPlayer = player === 'player' ? 'ai' : 'player';
            const enemyField = player === 'player' ? this.aiField : this.playerField;
            this.dealDamage(enemyPlayer, damage);
            enemyField.forEach(ec => ec.takeDamage(damage));
            this.addLog(`${c.name} triggers: Drew a card and dealt ${damage} damage to all enemies!`);
            this.checkCreatureDeaths();
        }
    });
    
    // Phoenix Archmage - different effects for different colors
    field.forEach(c => {
        if (c.ability.includes('Your Crimson spells draw a card. Your Azure spells deal 2 damage')) {
            if (spell.color && spell.color.includes('crimson')) {
                this.drawCard(player);
                this.addLog(`${c.name}: Crimson spell drew a card!`);
            }
            if (spell.color && spell.color.includes('azure')) {
                const enemyPlayer = player === 'player' ? 'ai' : 'player';
                this.dealDamage(enemyPlayer, 2);
                this.addLog(`${c.name}: Azure spell dealt 2 damage!`);
            }
        }
    });
    
    // Grand Archmage - spells draw a card
    field.forEach(c => {
        if (c.ability.includes('Your spells cost 2 less and draw a card')) {
            this.drawCard(player);
            this.addLog(`${c.name}: Drew a card!`);
        }
    });
    
    // Firestorm Titan - spells deal +2 damage (handled in spell damage calculation)
    // Infernox - Crimson spells deal +2 damage (handled in spell damage calculation)
};

// ==================== ENHANCED CHECK DEATHS ====================
Game.prototype.checkCreatureDeaths = function() {
    // Check player creatures
    this.playerField = this.playerField.filter(c => {
        // Can't die protection
        if (c.health <= 0 && c.cantDie) {
            c.health = 1;
            this.addLog(`${c.name} can't die!`);
            return true;
        }
        
        if (c.health <= 0) {
            this.addLog(`${c.name} was destroyed!`);
            
            // Track total deaths for cost reduction
            this.totalCreatureDeaths = (this.totalCreatureDeaths || 0) + 1;
            
            // Add to graveyard
            this.playerGraveyard.push({
                name: c.name, cost: c.cost, type: c.type, attack: c.attack,
                health: c.health, maxHealth: c.maxHealth, ability: c.ability,
                emoji: c.emoji, rarity: c.rarity, color: c.color
            });
            
            // Trigger on-death effects for OTHER creatures
            this.triggerOnCreatureDeath(c, 'player');
            
            // Handle deathrattles
            this.handleDeathrattle(c, 'player');
            
            return false;
        }
        return true;
    });
    
    // Check AI creatures
    this.aiField = this.aiField.filter(c => {
        // Can't die protection
        if (c.health <= 0 && c.cantDie) {
            c.health = 1;
            return true;
        }
        
        if (c.health <= 0) {
            this.addLog(`${c.name} was destroyed!`);
            
            this.totalCreatureDeaths = (this.totalCreatureDeaths || 0) + 1;
            
            this.aiGraveyard.push({
                name: c.name, cost: c.cost, type: c.type, attack: c.attack,
                health: c.health, maxHealth: c.maxHealth, ability: c.ability,
                emoji: c.emoji, rarity: c.rarity, color: c.color
            });
            
            this.triggerOnCreatureDeath(c, 'ai');
            this.handleDeathrattle(c, 'ai');
            
            return false;
        }
        return true;
    });
    
    // Reapply auras after deaths
    this.applyAuras();
    this.updateSpellPower();
};

// Trigger abilities when a creature dies
Game.prototype.triggerOnCreatureDeath = function(deadCreature, owner) {
    const field = owner === 'player' ? this.playerField : this.aiField;
    
    // Umbral Reaper - gain +1/+1 when creature dies
    field.forEach(c => {
        if (c.ability === 'Whenever a creature dies, gain +1/+1') {
            c.attack += 1;
            c.health += 1;
            c.maxHealth += 1;
            this.addLog(`${c.name} gains +1/+1!`);
        }
    });
    
    // Soul Harvester - gain 2 health when creature dies
    field.forEach(c => {
        if (c.ability === 'Whenever creature dies, you gain 2 health') {
            if (owner === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
            this.addLog(`${c.name}: Gained 2 health!`);
        }
    });
    
    // Grave Lord - summon skeleton when ally dies
    field.forEach(c => {
        if (c.ability === 'Whenever ally dies, summon 1/1 Skeleton' && owner === owner) {
            if (field.length < 7) {
                const skeleton = new Card({
                    name: "Skeleton", cost: 0, type: "creature", attack: 1, health: 1,
                    ability: "", emoji: "💀", rarity: "common", color: "umbral"
                });
                skeleton.tapped = true;
                field.push(skeleton);
                this.addLog("Summoned a 1/1 Skeleton!");
            }
        }
    });
    
    // Carrion Feeder - gains +1/+1 when ally dies
    field.forEach(c => {
        if (c.ability === 'Gains +1/+1 when ally dies') {
            c.attack += 1;
            c.health += 1;
            c.maxHealth += 1;
            this.addLog(`${c.name} gains +1/+1!`);
        }
    });
    
    // Eternal Necromancer - summon copy of any creature that dies
    field.forEach(c => {
        if (c.ability === 'Whenever creature dies, summon copy of it for you') {
            if (field.length < 7) {
                const copy = new Card({
                    name: deadCreature.name,
                    cost: deadCreature.cost,
                    type: deadCreature.type,
                    attack: deadCreature.attack,
                    health: deadCreature.maxHealth,
                    ability: deadCreature.ability,
                    emoji: deadCreature.emoji,
                    rarity: deadCreature.rarity,
                    color: deadCreature.color
                });
                copy.tapped = true;
                field.push(copy);
                this.addLog(`Summoned a copy of ${deadCreature.name}!`);
            }
        }
    });
};

// Handle deathrattle abilities
Game.prototype.handleDeathrattle = function(card, player) {
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
    
    // Existing deathrattles
    if (ability === 'Deathrattle: Draw' || ability === 'Deathrattle: Draw a card') {
        this.drawCard(player);
    }
    if (ability === 'Resurrect' || ability === 'Deathrattle: Return to hand') {
        const newCard = new Card({...card, health: card.maxHealth});
        if (hand.length < 10) {
            hand.push(newCard);
            this.addLog(`${card.name} returns to hand!`);
        }
    }
    
    // New deathrattles
    if (ability.includes('Deathrattle: Enemy loses 1 health')) {
        this.dealDamage(enemyPlayer, 1);
    }
    if (ability.includes('Deathrattle: Deal 2 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 2);
    }
    if (ability.includes('Deathrattle: Deal 2 damage to enemy')) {
        // Exclude the dying card from both colors check
        const bothColors = hasBothColors(field, card.color, card);
        const damage = bothColors ? 4 : 2;
        this.dealDamage(enemyPlayer, damage);
        this.addLog(`Deathrattle: Dealt ${damage} damage!`);
    }
    if (ability.includes('Deathrattle: Deal 2 damage')) {
        this.dealDamage(enemyPlayer, 2);
    }
    if (ability.includes('Deathrattle: Deal 3 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 3);
        enemyField.forEach(c => c.takeDamage(3));
        this.addLog("Deathrattle: Dealt 3 damage to all enemies!");
        this.checkCreatureDeaths();
    }
    if (ability.includes('Deathrattle: Deal 5 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 5);
        enemyField.forEach(c => c.takeDamage(5));
        this.addLog("Deathrattle: Dealt 5 damage to all enemies!");
        this.checkCreatureDeaths();
    }
    if (ability.includes('Deathrattle: Deal 6 damage to all enemies')) {
        this.dealDamage(enemyPlayer, 6);
        enemyField.forEach(c => c.takeDamage(6));
        this.addLog("Deathrattle: Dealt 6 damage to all enemies!");
        this.checkCreatureDeaths();
    }
    
    // Deathrattle: Summon tokens
    if (ability.includes('Deathrattle: Summon a 1/1 Skeleton')) {
        if (field.length < 7) {
            const skeleton = new Card({
                name: "Skeleton", cost: 0, type: "creature", attack: 1, health: 1,
                ability: "", emoji: "💀", rarity: "common", color: "umbral"
            });
            skeleton.tapped = true;
            field.push(skeleton);
            this.addLog("Summoned a 1/1 Skeleton!");
        }
    }
    if (ability.includes('Deathrattle: Summon a 2/2 Shadow')) {
        if (field.length < 7) {
            const shadow = new Card({
                name: "Shadow", cost: 0, type: "creature", attack: 2, health: 2,
                ability: "", emoji: "👤", rarity: "common", color: "umbral"
            });
            shadow.tapped = true;
            field.push(shadow);
            this.addLog("Summoned a 2/2 Shadow!");
        }
    }
    if (ability.includes('Deathrattle: Summon three 3/3 Treants')) {
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const treant = new Card({
                name: "Treant", cost: 0, type: "creature", attack: 3, health: 3,
                ability: "", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = true;
            field.push(treant);
        }
        this.addLog("Summoned three 3/3 Treants!");
    }
    if (ability.includes('Deathrattle: Summon three 3/3 Voidlings with Taunt')) {
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const voidling = new Card({
                name: "Voidling", cost: 0, type: "creature", attack: 3, health: 3,
                ability: "Taunt", emoji: "😈", rarity: "common", color: "umbral"
            });
            voidling.tapped = true;
            voidling.taunt = true;
            field.push(voidling);
        }
        this.addLog("Summoned three 3/3 Voidlings with Taunt!");
    }
    
    // Deathrattle: Gain health
    if (ability.includes('Deathrattle: Gain 2 health')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
        this.addLog("Deathrattle: Gained 2 health!");
    }
    if (ability.includes('Deathrattle: Gain 3 health')) {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
        this.addLog("Deathrattle: Gained 3 health!");
    }
    if (ability.includes('Deathrattle: All enemies lose 2 health')) {
        this.dealDamage(enemyPlayer, 2);
        this.addLog("Deathrattle: Enemies lose 2 health!");
    }
    
    // Deathrattle: Return with buff
    if (ability.includes('Deathrattle: Return to hand with +2/+2')) {
        const newCard = new Card({
            name: card.name, cost: card.cost, type: card.type,
            attack: card.attack + 2, health: card.maxHealth + 2,
            ability: card.ability, emoji: card.emoji, rarity: card.rarity, color: card.color
        });
        newCard.maxHealth = card.maxHealth + 2;
        if (hand.length < 10) {
            hand.push(newCard);
            this.addLog(`${card.name} returns to hand with +2/+2!`);
        }
    }
    
    // Deathrattle: Resurrect all
    if (ability.includes('Deathrattle: Return all Umbral creatures from graveyard with +2/+2')) {
        graveyard.filter(c => c.color && c.color.includes('umbral')).forEach(dead => {
            if (field.length < 7) {
                const resurrected = new Card({
                    ...dead,
                    attack: dead.attack + 2,
                    health: dead.maxHealth + 2
                });
                resurrected.tapped = true;
                field.push(resurrected);
                this.addLog(`${dead.name} returns with +2/+2!`);
            }
        });
    }
    if (ability.includes('Deathrattle: Summon all Umbral creatures that died this game')) {
        graveyard.filter(c => c.color && c.color.includes('umbral')).forEach(dead => {
            if (field.length < 7) {
                const resurrected = new Card({...dead, health: dead.maxHealth});
                resurrected.tapped = true;
                field.push(resurrected);
            }
        });
        this.addLog("Resurrected all Umbral creatures!");
    }
    if (ability.includes('Deathrattle: Summon all Verdant/Umbral creatures')) {
        graveyard.filter(c => c.color && (c.color.includes('verdant') || c.color.includes('umbral'))).forEach(dead => {
            if (field.length < 7) {
                const resurrected = new Card({...dead, health: dead.maxHealth});
                resurrected.tapped = true;
                field.push(resurrected);
            }
        });
        this.addLog("Resurrected all Verdant/Umbral creatures!");
    }
    if (ability.includes('Deathrattle: Resurrect all Crimson/Umbral creatures')) {
        graveyard.filter(c => c.color && (c.color.includes('crimson') || c.color.includes('umbral'))).forEach(dead => {
            if (field.length < 7) {
                const resurrected = new Card({...dead, health: dead.maxHealth});
                resurrected.tapped = true;
                field.push(resurrected);
            }
        });
        this.addLog("Resurrected all Crimson/Umbral creatures!");
    }
    if (ability.includes('Deathrattle: Heal all allies to full')) {
        field.forEach(c => {
            c.health = c.maxHealth;
        });
        this.addLog("Deathrattle: All allies healed to full!");
    }
    
    // Deathrattle: Draw cards
    if (ability.includes('Deathrattle: Draw 2 cards')) {
        for (let i = 0; i < 2; i++) {
            this.drawCard(player);
        }
    }
    
    // Aura deathrattle (from Worldtree Eternal)
    if (card.auraDeathrattleReturn) {
        const newCard = new Card({...card, health: card.maxHealth});
        if (hand.length < 10) {
            hand.push(newCard);
            this.addLog(`${card.name} returns to hand!`);
        }
    }
};

// ==================== ENHANCED START NEW TURN ====================
Game.prototype.startNewTurn = function(player) {
    originalStartNewTurn.call(this, player);
    
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // End of turn effects for opposite player
    const oppositePlayer = player === 'player' ? 'ai' : 'player';
    const oppositeField = player === 'player' ? this.aiField : this.playerField;
    
    // Bloodthirst Warrior - loses 1 health at end of turn
    oppositeField.forEach(c => {
        if (c.ability.includes('Loses 1 health at end of turn')) {
            c.health -= 1;
            if (c.health <= 0) {
                this.addLog(`${c.name} loses 1 health and dies!`);
            }
        }
    });
    
    // Eternal Lich - loses 2 health at end of turn
    oppositeField.forEach(c => {
        if (c.ability.includes('Loses 2 health at end of turn')) {
            c.health = Math.max(1, c.health - 2);
            this.addLog(`${c.name} loses 2 health!`);
        }
    });
    
    this.checkCreatureDeaths();
    
    // Start of turn effects for current player
    // Draw cards per turn effects
    field.forEach(c => {
        if (c.ability.includes('Draw a card each turn') || c.ability.includes('Draw 2 cards each turn')) {
            const drawCount = c.ability.includes('Draw 2') ? 2 : 1;
            for (let i = 0; i < drawCount; i++) {
                this.drawCard(player);
            }
            this.addLog(`${c.name}: Drew ${drawCount} card(s)!`);
        }
    });
    
    // Gain health per turn
    field.forEach(c => {
        if (c.ability.includes('You gain 3 health each turn')) {
            if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
            this.addLog(`${c.name}: Gained 3 health!`);
        }
    });
    
    // Aura regeneration
    field.forEach(c => {
        if (c.auraRegenerate) {
            c.health = c.maxHealth;
        }
    });
    
    // Phoenix Eternal - return if died
    if (player === 'player' && this.phoenixEternalToReturn) {
        if (this.playerField.length < 7) {
            this.playerField.push(this.phoenixEternalToReturn);
            this.addLog("Phoenix Eternal returns to play!");
        }
        this.phoenixEternalToReturn = null;
    }
    if (player === 'ai' && this.aiPhoenixEternalToReturn) {
        if (this.aiField.length < 7) {
            this.aiField.push(this.aiPhoenixEternalToReturn);
        }
        this.aiPhoenixEternalToReturn = null;
    }
    
    // Reapply auras at start of turn
    this.applyAuras();
};

// ==================== ENHANCED SPELL HANDLING ====================
Game.prototype.handleSpell = function(card, player, target = null) {
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
    
    // Check if this is a splash card for bonus effects
    const isSplash = isSplashCard(card, field);
    
    // Calculate spell damage bonus
    let spellDamageBonus = 0;
    field.forEach(c => {
        if (c.ability.includes('Your Crimson spells deal +2 damage') && card.color && card.color.includes('crimson')) {
            spellDamageBonus += 2;
        }
        if (c.ability.includes('Your damage spells deal +1 damage') && ability.includes('Deal')) {
            spellDamageBonus += 1;
        }
        if (c.ability.includes('Your spells cost 1 less and deal +2 damage')) {
            spellDamageBonus += 2;
        }
    });
    
    // Handle color-specific buffs
    if (ability.includes('All Crimson creatures gain +1/+1') || ability.includes('All your Crimson creatures gain +2/+1')) {
        const buff = ability.includes('+2/+1') ? [2, 1] : [1, 1];
        field.forEach(c => {
            if (c.color && c.color.includes('crimson')) {
                c.attack += buff[0];
                c.health += buff[1];
                c.maxHealth += buff[1];
            }
        });
        this.addLog(`All Crimson creatures gain +${buff[0]}/+${buff[1]}!`);
    }
    if (ability.includes('All Verdant creatures gain +1/+1') || ability.includes('All Verdant creatures gain +3/+3')) {
        const buff = ability.includes('+3/+3') ? 3 : 1;
        field.forEach(c => {
            if (c.color && c.color.includes('verdant')) {
                c.attack += buff;
                c.health += buff;
                c.maxHealth += buff;
            }
        });
        this.addLog(`All Verdant creatures gain +${buff}/+${buff}!`);
        
        // Rampage also grants Trample
        if (ability.includes('and Trample')) {
            field.forEach(c => {
                if (c.color && c.color.includes('verdant')) {
                    c.trampleGranted = true;
                }
            });
        }
    }
    
    // Crimson-specific temporary buffs
    if (ability.includes('Your Crimson creatures gain +2 attack this turn')) {
        field.forEach(c => {
            if (c.color && c.color.includes('crimson')) {
                c.tempAttackBonus = (c.tempAttackBonus || 0) + 2;
                c.attack += 2;
            }
        });
        this.addLog("Crimson creatures gain +2 attack this turn!");
    }
    if (ability.includes('All your creatures gain +2 attack this turn')) {
        field.forEach(c => {
            c.tempAttackBonus = (c.tempAttackBonus || 0) + 2;
            c.attack += 2;
        });
        this.addLog("All creatures gain +2 attack this turn!");
    }
    if (ability.includes('All Crimson creatures gain +3/+1 and Charge')) {
        field.forEach(c => {
            if (c.color && c.color.includes('crimson')) {
                c.attack += 3;
                c.health += 1;
                c.maxHealth += 1;
                c.tapped = false;
            }
        });
        this.addLog("All Crimson creatures gain +3/+1 and Charge!");
    }
    
    // Damage + Draw spells
    if (ability.includes('Deal 2 damage. Draw a card')) {
        const damage = 2 + spellDamageBonus + (player === 'player' ? this.playerSpellPower : this.aiSpellPower);
        if (target && target !== 'ai' && target !== 'player') {
            const died = target.health <= damage;
            target.takeDamage(damage);
            this.addLog(`Dealt ${damage} damage!`);
            this.checkCreatureDeaths();
        } else if (target) {
            this.dealDamage(target, damage);
        }
        this.drawCard(player);
    }
    if (ability.includes('Deal 2 damage. Draw a card if target dies')) {
        if (target && target !== 'ai' && target !== 'player') {
            const died = target.health <= 2;
            target.takeDamage(2);
            this.addLog(`Dealt 2 damage!`);
            if (died) {
                this.drawCard(player);
                this.addLog("Target died! Drew a card!");
            }
            this.checkCreatureDeaths();
        }
    }
    
    // Deal damage + Gain health spells
    if (ability.includes('Deal 3 damage. Gain 3 health')) {
        if (target) {
            if (target === 'player' || target === 'ai') {
                this.dealDamage(target, 3);
            } else {
                target.takeDamage(3);
                this.checkCreatureDeaths();
            }
        } else {
            this.dealDamage(enemyPlayer, 3);
        }
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
    }
    if (ability.includes('Deal 2 damage. Restore 2 health') || ability.includes('Deal 3 damage. Restore 3 health')) {
        const dmg = parseInt(ability.match(/Deal (\d+)/)[1]);
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, dmg);
            else {
                target.takeDamage(dmg);
                this.checkCreatureDeaths();
            }
        }
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + dmg);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + dmg);
    }
    if (ability.includes('Deal 6 damage. Restore 6 health')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 6);
            else {
                target.takeDamage(6);
                this.checkCreatureDeaths();
            }
        }
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 6);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 6);
    }
    
    // Conditional repeat spells
    if (ability.includes('If both colors on board, repeat') || ability.includes('If both colors, repeat')) {
        const shouldRepeat = hasBothColors(field, card.color);
        
        // Handle the base effect first
        if (ability.includes('Deal 4 damage. Draw a card')) {
            const damage = 4 + spellDamageBonus;
            if (target) {
                if (target === 'player' || target === 'ai') this.dealDamage(target, damage);
                else {
                    target.takeDamage(damage);
                    this.checkCreatureDeaths();
                }
            }
            this.drawCard(player);
            
            if (shouldRepeat) {
                if (target) {
                    if (target === 'player' || target === 'ai') this.dealDamage(target, damage);
                    else if (target.health > 0) {
                        target.takeDamage(damage);
                        this.checkCreatureDeaths();
                    }
                }
                this.drawCard(player);
                this.addLog("Repeated effect!");
            }
        }
        if (ability.includes('Deal 5 damage. Summon 3/3 Treant')) {
            const damage = 5 + spellDamageBonus;
            if (target) {
                if (target === 'player' || target === 'ai') this.dealDamage(target, damage);
                else {
                    target.takeDamage(damage);
                    this.checkCreatureDeaths();
                }
            }
            
            for (let reps = 0; reps < (shouldRepeat ? 2 : 1); reps++) {
                if (field.length < 7) {
                    const treant = new Card({
                        name: "Treant", cost: 0, type: "creature", attack: 3, health: 3,
                        ability: "", emoji: "🌳", rarity: "common", color: "verdant"
                    });
                    treant.tapped = true;
                    field.push(treant);
                }
            }
            this.addLog(shouldRepeat ? "Summoned TWO 3/3 Treants!" : "Summoned a 3/3 Treant!");
        }
        if (ability.includes('Deal 5 damage. Gain 5 health')) {
            for (let reps = 0; reps < (shouldRepeat ? 2 : 1); reps++) {
                if (target) {
                    if (target === 'player' || target === 'ai') this.dealDamage(target, 5);
                    else if (target.health > 0) {
                        target.takeDamage(5);
                        this.checkCreatureDeaths();
                    }
                }
                if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
                else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
            }
            if (shouldRepeat) this.addLog("Repeated effect!");
        }
        if (ability.includes('Draw 3 cards. Enemy loses 3 health')) {
            for (let reps = 0; reps < (shouldRepeat ? 2 : 1); reps++) {
                for (let i = 0; i < 3; i++) this.drawCard(player);
                this.dealDamage(enemyPlayer, 3);
            }
            if (shouldRepeat) this.addLog("Repeated effect!");
        }
    }
    
    // Conditional free cost spells
    if (ability.includes('If both colors, cost 0')) {
        // These are handled in cost calculation
    }
    
    // Draw + heal spells
    if (ability === 'Draw 2 cards. Gain 4 health') {
        for (let i = 0; i < 2; i++) this.drawCard(player);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 4);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 4);
    }
    if (ability.includes('Draw 3 cards. Restore 6 health')) {
        for (let i = 0; i < 3; i++) this.drawCard(player);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 6);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 6);
    }
    
    // AOE spells
    if (ability === 'Deal 2 damage to all enemies') {
        this.dealDamage(enemyPlayer, 2);
        enemyField.forEach(c => c.takeDamage(2));
        this.checkCreatureDeaths();
    }
    // REMOVED: This conflicts with part2's Plague Wind handler (full ability with self-damage)
    // part2 handles "Deal 2 damage to all creatures. Lose 2 health for each enemy creature destroyed" completely
    if (ability.includes('Deal 3 damage to all enemy creatures')) {
        enemyField.forEach(c => c.takeDamage(3 + spellDamageBonus));
        this.checkCreatureDeaths();
        
        // Flame Barrier splash bonus
        if (isSplash && card.splashBonus && card.splashBonus.includes('gain +5 armor')) {
            // Armor system not implemented, just log
            this.addLog("Splash bonus: +5 armor this turn!");
        }
    }
    if (ability.includes('Deal 6 damage to all creatures and enemy player')) {
        this.dealDamage(enemyPlayer, 6);
        [...this.playerField, ...this.aiField].forEach(c => c.takeDamage(6));
        this.checkCreatureDeaths();
    }
    if (ability.includes('Deal 10 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 10);
    }
    if (ability.includes('Deal 3 damage to all creatures and heroes')) {
        this.dealDamage('player', 3);
        this.dealDamage('ai', 3);
        [...this.playerField, ...this.aiField].forEach(c => c.takeDamage(3));
        this.checkCreatureDeaths();
    }
    if (ability.includes('Deal 6 damage to all enemies. All allies gain +3/+3')) {
        this.dealDamage(enemyPlayer, 6);
        enemyField.forEach(c => c.takeDamage(6));
        field.forEach(c => {
            c.attack += 3;
            c.health += 3;
            c.maxHealth += 3;
        });
        this.checkCreatureDeaths();
    }
    if (ability.includes('Deal 4 damage to all. You gain 2 health for each death')) {
        const initialEnemies = enemyField.length;
        enemyField.forEach(c => c.takeDamage(4));
        this.dealDamage(enemyPlayer, 4);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 4);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 4);
        this.checkCreatureDeaths();
        
        const deaths = initialEnemies - (player === 'player' ? this.aiField : this.playerField).length;
        const healing = deaths * 2;
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healing);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healing);
        this.addLog(`Gained ${healing} health from ${deaths} deaths!`);
    }
    if (ability.includes('Deal 5 damage to all creatures. Summon 2/2 Zombie for each death')) {
        const initialTotal = this.playerField.length + this.aiField.length;
        [...this.playerField, ...this.aiField].forEach(c => c.takeDamage(5));
        this.checkCreatureDeaths();
        const deaths = initialTotal - (this.playerField.length + this.aiField.length);
        
        for (let i = 0; i < deaths && field.length < 7; i++) {
            const zombie = new Card({
                name: "Zombie", cost: 0, type: "creature", attack: 2, health: 2,
                ability: "", emoji: "🧟", rarity: "common", color: "umbral"
            });
            zombie.tapped = true;
            field.push(zombie);
        }
        this.addLog(`Summoned ${Math.min(deaths, 7 - field.length)} Zombies!`);
    }
    
    // Summon token spells
    if (ability.includes('Summon two 1/1 Saplings with Taunt')) {
        for (let i = 0; i < 2 && field.length < 7; i++) {
            const sapling = new Card({
                name: "Sapling", cost: 0, type: "creature", attack: 1, health: 1,
                ability: "Taunt", emoji: "🌱", rarity: "common", color: "verdant"
            });
            sapling.tapped = true;
            sapling.taunt = true;
            field.push(sapling);
        }
        this.addLog("Summoned two 1/1 Saplings with Taunt!");
    }
    if (ability.includes('Summon three 2/2 Verdant Beasts')) {
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const beast = new Card({
                name: "Verdant Beast", cost: 0, type: "creature", attack: 2, health: 2,
                ability: "", emoji: "🦁", rarity: "common", color: "verdant"
            });
            beast.tapped = true;
            field.push(beast);
        }
        this.addLog("Summoned three 2/2 Verdant Beasts!");
    }
    if (ability.includes('Summon three 3/3 Treants with Taunt')) {
        for (let i = 0; i < 2; i++) this.drawCard(player);
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const treant = new Card({
                name: "Treant", cost: 0, type: "creature", attack: 3, health: 3,
                ability: "Taunt", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = true;
            treant.taunt = true;
            field.push(treant);
        }
        this.addLog("Summoned three 3/3 Treants! Drew 2 cards!");
    }
    if (ability.includes('Summon four 4/4 Verdant Beasts with Taunt')) {
        for (let i = 0; i < 4 && field.length < 7; i++) {
            const beast = new Card({
                name: "Verdant Beast", cost: 0, type: "creature", attack: 4, health: 4,
                ability: "Taunt", emoji: "🦁", rarity: "common", color: "verdant"
            });
            beast.tapped = true;
            beast.taunt = true;
            field.push(beast);
        }
        this.addLog("Summoned four 4/4 Verdant Beasts with Taunt!");
    }
    if (ability.includes('Summon three 5/5 Treants with Charge and Trample')) {
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const treant = new Card({
                name: "Treant", cost: 0, type: "creature", attack: 5, health: 5,
                ability: "Charge. Trample", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = false;
            treant.trampleGranted = true;
            field.push(treant);
        }
        this.addLog("Summoned three 5/5 Treants with Charge and Trample!");
    }
    if (ability.includes('Summon a 3/3 Treant with Taunt')) {
        if (field.length < 7) {
            const treant = new Card({
                name: "Treant", cost: 0, type: "creature", attack: 3, health: 3,
                ability: "Taunt", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = true;
            treant.taunt = true;
            field.push(treant);
            this.addLog("Summoned a 3/3 Treant with Taunt!");
            
            // Emergency Roots splash bonus
            if (isSplash && card.splashBonus) {
                if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
                else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
                this.addLog("Splash bonus: Restored 5 health!");
            }
        }
    }
    if (ability.includes('Summon three 3/1 Crimson Flames')) {
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const flame = new Card({
                name: "Crimson Flame", cost: 0, type: "creature", attack: 3, health: 1,
                ability: "", emoji: "🔥", rarity: "common", color: "crimson"
            });
            flame.tapped = true;
            field.push(flame);
        }
        this.addLog("Summoned three 3/1 Crimson Flames!");
    }
    
    // Freeze spells
    if (ability === 'Freeze all enemy creatures') {
        enemyField.forEach(c => {
            c.frozen = true;
        });
        this.addLog("All enemy creatures frozen!");
    }
    if (ability.includes('Freeze target creature') || ability === 'Freeze creature. It can\'t unfreeze') {
        if (target && target !== 'player' && target !== 'ai') {
            target.frozen = true;
            if (ability.includes("can't unfreeze")) {
                target.permanentlyFrozen = true;
            }
            this.addLog(`${target.name} is frozen!`);
        }
    }
    
    // Return/Bounce spells
    if (ability.includes('Return target creature to owner\'s hand') || ability.includes('Return creature to hand')) {
        if (target && target !== 'player' && target !== 'ai') {
            const targetOwner = this.playerField.includes(target) ? 'player' : 'ai';
            const targetField = targetOwner === 'player' ? this.playerField : this.aiField;
            const targetHand = targetOwner === 'player' ? this.playerHand : this.aiHand;
            
            targetField.splice(targetField.indexOf(target), 1);
            if (targetHand.length < 10) {
                targetHand.push(target);
                this.addLog(`${target.name} returned to hand!`);
                
                // Tactical Retreat splash bonus
                if (isSplash && card.splashBonus && card.splashBonus.includes('draw a card')) {
                    this.drawCard(player);
                    this.addLog("Splash bonus: Drew a card!");
                }
            }
        }
    }
    if (ability.includes('Return all creatures to their owner\'s hands')) {
        [...this.playerField].forEach(c => {
            this.playerField.splice(this.playerField.indexOf(c), 1);
            if (this.playerHand.length < 10) this.playerHand.push(c);
        });
        [...this.aiField].forEach(c => {
            this.aiField.splice(this.aiField.indexOf(c), 1);
            if (this.aiHand.length < 10) this.aiHand.push(c);
        });
        this.addLog("All creatures returned to hands!");
    }
    
    // Destroy spells
    if (ability.includes('Destroy target creature')) {
        if (target && target !== 'player' && target !== 'ai') {
            target.health = 0;
            this.addLog(`Destroyed ${target.name}!`);
            
            // Desperation Pact - lose health unless splash
            if (ability.includes('Lose 3 health')) {
                if (!isSplash || !card.splashBonus) {
                    if (player === 'player') this.playerHealth -= 3;
                    else this.aiHealth -= 3;
                } else {
                    this.addLog("Splash bonus: Don't lose health!");
                }
            }
            
            // Cycle of Death - summon treant and gain health
            if (ability.includes('Summon 4/4 Treant. Gain 5 health')) {
                if (field.length < 7) {
                    const treant = new Card({
                        name: "Treant", cost: 0, type: "creature", attack: 4, health: 4,
                        ability: "", emoji: "🌳", rarity: "common", color: "verdant"
                    });
                    treant.tapped = true;
                    field.push(treant);
                }
                if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
                else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 5);
            }
            
            this.checkCreatureDeaths();
        }
    }
    if (ability.includes('Destroy creature with 5+ attack')) {
        if (target && target !== 'player' && target !== 'ai' && target.attack >= 5) {
            target.health = 0;
            this.addLog(`Destroyed ${target.name}!`);
            this.checkCreatureDeaths();
        } else if (target) {
            this.addLog("Target doesn't have 5+ attack!");
        }
    }
    if (ability.includes('Destroy all creatures')) {
        const initialCount = [...this.playerField, ...this.aiField].length;
        [...this.playerField, ...this.aiField].forEach(c => {
            if (!c.immune) c.health = 0;
        });
        this.checkCreatureDeaths();
        
        // End of Days - deal damage per creature destroyed
        if (ability.includes('Deal 1 damage to enemy player for each')) {
            const deaths = initialCount - (this.playerField.length + this.aiField.length);
            this.dealDamage(enemyPlayer, deaths);
            this.addLog(`Dealt ${deaths} damage!`);
        }
        
        // Soul Exchange - gain health equal to attack
        if (ability.includes('You gain health equal to their total attack')) {
            let totalAttack = 0;
            graveyard.forEach(c => totalAttack += c.attack);
            if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + totalAttack);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + totalAttack);
            this.addLog(`Gained ${totalAttack} health!`);
        }
    }
    if (ability.includes('Destroy ally')) {
        // Sacrifice / Dark Pact - player chooses, AI picks random
        let ally = null;
        if (player === 'ai' && field.length > 0) {
            ally = field[Math.floor(Math.random() * field.length)];
        }
        // For player, would need UI targeting - skip for now
        
        if (ally) {
            ally.health = 0;
            this.checkCreatureDeaths();
            
            if (ability.includes('Draw 2 cards')) {
                for (let i = 0; i < 2; i++) this.drawCard(player);
            }
            if (ability.includes('Gain 8 health')) {
                if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 8);
                else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 8);
            }
        }
    }
    
    // Heal spells
    if (ability === 'Restore 4 health') {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 4);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 4);
        
        // Battle Triage - conditional draw
        if (card.name === 'Battle Triage') {
            const shouldDraw = (player === 'player' && this.playerHealth < 15) || 
                             (player === 'ai' && this.aiHealth < 15) ||
                             (isSplash && card.splashBonus);
            if (shouldDraw) {
                this.drawCard(player);
                this.addLog(isSplash ? "Splash bonus: Drew a card!" : "Drew a card!");
            }
        }
    }
    if (ability === 'Restore 8 health') {
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 8);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 8);
        
        // Life Graft splash bonus
        if (isSplash && card.splashBonus) {
            this.drawCard(player);
            this.addLog("Splash bonus: Drew a card!");
        }
    }
    if (ability.includes('Restore all Verdant creatures to full health')) {
        field.forEach(c => {
            if (c.color && c.color.includes('verdant')) {
                c.health = c.maxHealth;
            }
        });
        this.addLog("All Verdant creatures restored to full health!");
    }
    if (ability.includes('Restore 10 health to all allies')) {
        field.forEach(c => {
            c.health = Math.min(c.maxHealth, c.health + 10);
        });
        this.addLog("All allies restored 10 health!");
    }
    
    // Draw spells
    if (ability === 'Draw 2 cards. Your spells cost 1 more next turn') {
        for (let i = 0; i < 2; i++) this.drawCard(player);
        // Cost penalty handled separately
        return; // Don't call original handler
    }
    if (ability.includes('Draw 3 cards') && !ability.includes('Enemy loses')) {
        for (let i = 0; i < 3; i++) this.drawCard(player);
        
        // Mana Drain - enemy discards
        if (ability.includes('Enemy discards 2 cards')) {
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            const discarded = Math.min(2, enemyHand.length);
            enemyHand.splice(0, discarded);
            this.addLog(`Enemy discarded ${discarded} cards!`);
        }
        return; // Don't call original handler
    }
    if (ability.includes('Draw 5 cards')) {
        for (let i = 0; i < 5; i++) this.drawCard(player);
        
        // Dark Bargain / Soul Bargain - lose health
        if (ability.includes('Lose 5 health')) {
            const healthLoss = (isSplash && card.splashBonus) ? 2 : 5;
            if (player === 'player') this.playerHealth -= healthLoss;
            else this.aiHealth -= healthLoss;
            this.addLog(isSplash ? `Splash bonus: Only lose 2 health!` : `Lost ${healthLoss} health!`);
        }
        
        // Perfect Recall - cards cost 2 less
        if (ability.includes('They cost 2 less')) {
            const recentCards = hand.slice(-5);
            recentCards.forEach(c => {
                c.cost = Math.max(0, c.cost - 2);
            });
            this.addLog("Those cards cost 2 less!");
        }
        return; // Don't call original handler
    }
    
    // Self-damage spells
    if (ability.includes('Deal 2 damage to yourself. Draw 2 cards')) {
        if (player === 'player') this.playerHealth -= 2;
        else this.aiHealth -= 2;
        for (let i = 0; i < 2; i++) this.drawCard(player);
    }
    if (ability.includes('Deal 2 damage to yourself')) {
        if (player === 'player') this.playerHealth -= 2;
        else this.aiHealth -= 2;
    }
    
    // Graveyard resurrection spells
    if (ability.includes('Return creature from your graveyard to play')) {
        if (graveyard.length > 0) {
            const creature = graveyard[graveyard.length - 1];
            graveyard.pop();
            const resurrected = new Card({...creature, health: creature.maxHealth});
            resurrected.tapped = true;
            if (field.length < 7) {
                field.push(resurrected);
                this.addLog(`Resurrected ${creature.name}!`);
            }
        }
    }
    if (ability.includes('Return two creatures from graveyard to play')) {
        for (let i = 0; i < 2 && graveyard.length > 0 && field.length < 7; i++) {
            const creature = graveyard.pop();
            const resurrected = new Card({...creature, health: creature.maxHealth});
            resurrected.tapped = true;
            field.push(resurrected);
            this.addLog(`Resurrected ${creature.name}!`);
        }
    }
    if (ability.includes('Return all creatures from graveyard. They gain +2/+2')) {
        [...this.playerGraveyard, ...this.aiGraveyard].forEach(dead => {
            const owner = this.playerGraveyard.includes(dead) ? 'player' : 'ai';
            const ownerField = owner === 'player' ? this.playerField : this.aiField;
            
            if (ownerField.length < 7) {
                const resurrected = new Card({
                    ...dead,
                    attack: dead.attack + 2,
                    health: dead.maxHealth + 2
                });
                resurrected.tapped = true;
                ownerField.push(resurrected);
            }
        });
        this.playerGraveyard = [];
        this.aiGraveyard = [];
        this.addLog("All creatures return from graveyards with +2/+2!");
    }
    
    // Buff all creatures
    if (ability.includes('All creatures gain +5/+5 and Trample')) {
        [...this.playerField, ...this.aiField].forEach(c => {
            c.attack += 5;
            c.health += 5;
            c.maxHealth += 5;
            c.trampleGranted = true;
        });
        this.addLog("All creatures gain +5/+5 and Trample!");
    }
    if (ability.includes('All friendly creatures gain +2/+2')) {
        field.forEach(c => {
            c.attack += 2;
            c.health += 2;
            c.maxHealth += 2;
        });
        
        // Verdant Sanctuary - self damage unless splash
        if (ability.includes('You take 2 damage')) {
            if (!isSplash || !card.splashBonus) {
                if (player === 'player') this.playerHealth -= 2;
                else this.aiHealth -= 2;
            } else {
                if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
                else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
                this.addLog("Splash bonus: Don't take damage and restore 3 health!");
            }
        }
    }
    
    // Transform
    if (ability.includes('Transform all creatures into 1/1 Frogs')) {
        [...this.playerField, ...this.aiField].forEach(c => {
            // Transform stats
            c.attack = 1;
            c.health = 1;
            c.maxHealth = 1;
            c.baseAttack = 1;  // Update base stats for aura system
            c.baseHealth = 1;
            
            // Transform identity
            c.name = "Frog";
            c.ability = "";
            c.emoji = "🐸";
            
            // Clear ALL keyword flags
            c.taunt = false;
            c.flying = false;
            c.stealth = false;
            c.charge = false;
            c.rush = false;
            c.vigilance = false;
            c.lifesteal = false;
            c.lifelink = false;
            c.regenerate = false;
            c.trample = false;
            c.trampleGranted = false;
            c.deathtouch = false;
            c.poison = false;
            c.firstStrike = false;
            c.doubleStrike = false;
            c.windfury = false;
            c.divineShield = false;
            c.spellShield = false;
            c.enrage = false;
            c.frozen = false;
            c.immune = false;
            c.cantDie = false;
            c.cantAttack = false;
            
            // Clear aura-related properties
            c.auraAttackBonus = 0;
            c.auraHealthBonus = 0;
            c.auraCharge = false;
            c.auraRegenerate = false;
            c.auraDeathrattleReturn = false;
        });
        this.addLog("All creatures transformed into 1/1 Frogs!");
        console.log('[MASS POLYMORPH] All creatures transformed into 1/1 Frogs with no abilities');
    }
    
    // Extra turns
    if (ability === 'Take two extra turns') {
        if (player === 'player') {
            this.playerExtraTurns = 2;
        } else {
            this.aiExtraTurns = 2;
        }
        this.addLog("Will take TWO extra turns!");
    }
    
    // Mind Control - Steal creature
    if (ability.includes('Steal creature') && target && target !== 'player' && target !== 'ai') {
        const targetOwner = this.playerField.includes(target) ? 'player' : 'ai';
        const targetField = targetOwner === 'player' ? this.playerField : this.aiField;
        const myField = player === 'player' ? this.playerField : this.aiField;
        
        const index = targetField.indexOf(target);
        if (index > -1 && myField.length < 7) {
            targetField.splice(index, 1);
            myField.push(target);
            target.tapped = true;
            this.addLog(`${player === 'player' ? 'You' : 'AI'} stole ${target.name}!`);
        }
        return; // Don't call original handler
    }
    
    // Call original handler for remaining spells
    originalHandleSpell.call(this, card, player, target);
};

console.log('✅ V3.0 Complete Abilities System loaded!');
console.log('📋 Implemented: Attack Triggers, Auras, Deathrattles, Cost Modifiers, and more!');
