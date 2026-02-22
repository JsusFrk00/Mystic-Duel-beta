// V3.0 Complete Abilities System - Part 2
// Additional spell handlers and complex mechanics
// Load this AFTER v3-abilities-complete.js

console.log('🎴 Loading v3.0 Abilities Part 2...');

// Store original spell handler
const originalHandleSpellComplete = Game.prototype.handleSpell;

// Enhanced spell handler with remaining spells
Game.prototype.handleSpell = function(card, player, target = null) {
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    const graveyard = player === 'player' ? this.playerGraveyard : this.aiGraveyard;
    const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
    
    const isSplash = isSplashCard(card, field);
    
    // Damage spells with special effects
    if (ability.includes('Deal 5 damage to target. Deal 2 damage to yourself')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 5);
            else {
                target.takeDamage(5);
                this.checkCreatureDeaths();
            }
        }
        if (player === 'player') this.playerHealth -= 2;
        else this.aiHealth -= 2;
    }
    
    // Damage spells with conditional draw
    if (ability.includes('Deal 3 damage. If Azure card in hand, draw a card')) {
        const damage = 3;
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, damage);
            else {
                target.takeDamage(damage);
                this.checkCreatureDeaths();
            }
        }
        
        const hasAzureInHand = hand.some(c => c.color && c.color.includes('azure'));
        if (hasAzureInHand) {
            this.drawCard(player);
            this.addLog("Drew a card!");
        }
    }
    
    // Chain Lightning - cast again if kills
    if (ability.includes('Deal 3 damage. If it kills, cast again on another target')) {
        if (target && target !== 'player' && target !== 'ai') {
            const killed = target.health <= 3;
            target.takeDamage(3);
            this.addLog(`Dealt 3 damage to ${target.name}!`);
            this.checkCreatureDeaths();
            
            if (killed && enemyField.length > 0) {
                const nextTarget = enemyField[0];
                nextTarget.takeDamage(3);
                this.addLog(`Chained to ${nextTarget.name}!`);
                this.checkCreatureDeaths();
            }
        }
    }
    
    // Necrotic Plague - chain if kills
    if (ability.includes('Deal 5 damage. If target dies, cast this on another')) {
        if (target && target !== 'player' && target !== 'ai') {
            let currentTarget = target;
            let chainCount = 0;
            
            while (currentTarget && chainCount < 5) {
                const killed = currentTarget.health <= 5;
                currentTarget.takeDamage(5);
                this.addLog(`Dealt 5 damage to ${currentTarget.name}!`);
                this.checkCreatureDeaths();
                
                if (killed) {
                    const remainingEnemies = player === 'player' ? this.aiField : this.playerField;
                    if (remainingEnemies.length > 0) {
                        currentTarget = remainingEnemies[0];
                        chainCount++;
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }
        }
    }
    
    // Draw + damage spells
    if (ability.includes('Deal 2 damage. Draw card. Gain 2 health')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 2);
            else {
                target.takeDamage(2);
                this.checkCreatureDeaths();
            }
        }
        this.drawCard(player);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
    }
    
    // Draw spells with penalties/bonuses
    if (ability.includes('Enemy discards 2 cards. You draw 1')) {
        const discarded = Math.min(2, enemyHand.length);
        enemyHand.splice(0, discarded);
        this.drawCard(player);
        this.addLog(`Enemy discarded ${discarded} cards!`);
    }
    
    // Mass drain
    if (ability.includes('Deal 3 damage to all enemies. Gain 3 health for each')) {
        let hitCount = 0;
        this.dealDamage(enemyPlayer, 3);
        hitCount++;
        enemyField.forEach(c => {
            c.takeDamage(3);
            hitCount++;
        });
        this.checkCreatureDeaths();
        
        const healing = hitCount * 3;
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + healing);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + healing);
        this.addLog(`Gained ${healing} health!`);
    }
    
    // Draw + damage to all
    if (ability.includes('Draw 5 cards. Deal 5 damage to all enemies')) {
        for (let i = 0; i < 5; i++) this.drawCard(player);
        this.dealDamage(enemyPlayer, 5);
        enemyField.forEach(c => c.takeDamage(5));
        this.checkCreatureDeaths();
    }
    
    // Complex multi-effect spells
    if (ability.includes('Deal 6 damage. Draw 3 cards')) {
        const costIsFree = hasBothColors(field, card.color);
        // Cost already handled in playCard
        
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 6);
            else {
                target.takeDamage(6);
                this.checkCreatureDeaths();
            }
        }
        for (let i = 0; i < 3; i++) this.drawCard(player);
        
        if (costIsFree) this.addLog("Cost 0 due to both colors!");
    }
    
    if (ability.includes('Deal 8 damage. Summon three 3/1 Crimson Flames')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 8);
            else {
                target.takeDamage(8);
                this.checkCreatureDeaths();
            }
        }
        // Token summoning handled in Part 1
    }
    
    if (ability.includes('Deal 10 damage. Restore 10 health. Summon a 5/5 Treant')) {
        console.log(`[NATURE'S VENGEANCE] Handler triggered, target:`, target);
        
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 10);
            else {
                target.takeDamage(10);
                this.checkCreatureDeaths();
            }
        }
        
        console.log(`[NATURE'S VENGEANCE] Restoring 10 health`);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 10);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 10);
        
        // FIXED: Get fresh reference to field after checkCreatureDeaths() may have replaced the array
        const currentField = player === 'player' ? this.playerField : this.aiField;
        
        console.log(`[NATURE'S VENGEANCE] Summoning Treant, field length: ${currentField.length}`);
        if (currentField.length < 7) {
            const treant = new Card({
                name: "Treant", cost: 0, type: "creature", attack: 5, health: 5,
                ability: "", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = true;
            
            // Push directly to this.playerField/aiField to ensure we're using the current array reference
            if (player === 'player') {
                this.playerField.push(treant);
            } else {
                this.aiField.push(treant);
            }
            
            this.addLog("Summoned a 5/5 Treant!");
            console.log(`[NATURE'S VENGEANCE] Treant added to field, new length: ${currentField.length + 1}`);
            
            // Force display update
            this.updateDisplay();
        } else {
            console.log(`[NATURE'S VENGEANCE] Field is full! Cannot summon Treant.`);
        }
        console.log(`[NATURE'S VENGEANCE] Complete, returning early`);
        return; // Don't call original handler
    }
    
    // Omniscience - draw 5, spells cost 0 this turn
    if (ability.includes('Draw 5 cards. Your spells cost 0 this turn')) {
        for (let i = 0; i < 5; i++) this.drawCard(player);
        if (player === 'player') {
            this.playerSpellsCost0ThisTurn = true;
        } else {
            this.aiSpellsCost0ThisTurn = true;
        }
        this.addLog("Spells cost 0 this turn!");
    }
    
    // Reckless Gambit - damage with conditional self-damage
    if (ability.includes('Deal 6 damage to any target. Deal 2 damage to yourself')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 6);
            else {
                target.takeDamage(6);
                this.checkCreatureDeaths();
            }
        }
        
        if (!isSplash || !card.splashBonus) {
            if (player === 'player') this.playerHealth -= 2;
            else this.aiHealth -= 2;
        } else {
            this.addLog("Splash bonus: Don't take self-damage!");
        }
    }
    
    // Cauterize - damage with splash heal
    if (card.name === 'Cauterize' && ability.includes('Deal 4 damage')) {
        if (target) {
            if (target === 'player' || target === 'ai') this.dealDamage(target, 4);
            else {
                target.takeDamage(4);
                this.checkCreatureDeaths();
            }
        }
        
        if (isSplash && card.splashBonus) {
            if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 3);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 3);
            this.addLog("Splash bonus: Restored 3 health!");
        }
    }
    
    // Enemy discard
    if (ability.includes('Enemy loses 2 health. You gain 2 health')) {
        this.dealDamage(enemyPlayer, 2);
        if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 2);
        else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + 2);
    }
    
    // Bounce low-cost creatures
    if (ability.includes('Bounce enemy creature (2- cost)')) {
        const targets = enemyField.filter(c => c.cost <= 2);
        if (targets.length > 0) {
            const bounceTarget = targets[Math.floor(Math.random() * targets.length)];
            enemyField.splice(enemyField.indexOf(bounceTarget), 1);
            if (enemyHand.length < 10) {
                enemyHand.push(bounceTarget);
                this.addLog(`Returned ${bounceTarget.name} to hand!`);
            }
        }
    }
    
    // Shadow Escape - return from graveyard with cost penalty
    if (ability.includes('Return target creature from your graveyard to your hand')) {
        if (graveyard.length > 0) {
            const creature = graveyard.pop();
            const returned = new Card({...creature, health: creature.maxHealth});
            
            if (!isSplash || !card.splashBonus) {
                returned.cost += 2;
                this.addLog(`${creature.name} returned to hand (costs 2 more)!`);
            } else {
                this.addLog(`${creature.name} returned to hand! Splash bonus: Doesn't cost more!`);
            }
            
            if (hand.length < 10) {
                hand.push(returned);
            }
        }
    }
    
    // Plague Wind - AOE with health cost
    if (ability.includes('Deal 2 damage to all creatures. Lose 2 health for each enemy creature destroyed')) {
        const initialEnemyCount = enemyField.length;
        [...this.playerField, ...this.aiField].forEach(c => c.takeDamage(2));
        this.checkCreatureDeaths();
        
        const enemiesDestroyed = initialEnemyCount - (player === 'player' ? this.aiField : this.playerField).length;
        
        if (!isSplash || !card.splashBonus) {
            const healthLoss = enemiesDestroyed * 2;
            if (player === 'player') this.playerHealth -= healthLoss;
            else this.aiHealth -= healthLoss;
            this.addLog(`Lost ${healthLoss} health!`);
        } else {
            this.addLog("Splash bonus: Don't lose health!");
        }
    }
    
    // Frost Ward - Freeze target + splash bonus
    if (card.name === 'Frost Ward' && ability.includes('Freeze target creature')) {
        if (target && target !== 'player' && target !== 'ai') {
            target.frozen = true;
            this.addLog(`${target.name} is frozen!`);
            
            // Splash bonus - freeze 2 additional enemy creatures
            if (isSplash && card.splashBonus) {
                const otherEnemies = enemyField.filter(c => c !== target && !c.frozen);
                const toFreeze = Math.min(2, otherEnemies.length);
                
                for (let i = 0; i < toFreeze; i++) {
                    otherEnemies[i].frozen = true;
                    this.addLog(`Splash bonus: ${otherEnemies[i].name} is frozen!`);
                }
            }
        }
    }
    
    // Call the original enhanced handler from Part 1
    originalHandleSpellComplete.call(this, card, player, target);
};

// ==================== HANDLE DRAW EFFECTS ====================
// Override draw to handle special draw effects
const originalDrawCard = Game.prototype.drawCard;

Game.prototype.drawCard = function(player) {
    const field = player === 'player' ? this.playerField : this.aiField;
    
    // Azure Infinity - reduce random card cost when drawing
    field.forEach(c => {
        if (c.ability.includes('Whenever you draw a card, reduce a random card\'s cost by 1')) {
            const hand = player === 'player' ? this.playerHand : this.aiHand;
            if (hand.length > 0) {
                const randomCard = hand[Math.floor(Math.random() * hand.length)];
                randomCard.cost = Math.max(0, randomCard.cost - 1);
                this.addLog(`${randomCard.name} costs 1 less!`);
            }
        }
    });
    
    originalDrawCard.call(this, player);
};

// ==================== HANDLE SPECIAL ATTACK CASES ====================
// Override canAttack for "Can't attack" creatures
const originalCanAttack = Card.prototype.canAttack;

Card.prototype.canAttack = function() {
    if (this.ability && this.ability.includes("Can't attack")) {
        return false;
    }
    return originalCanAttack.call(this);
};

// ==================== HANDLE DAMAGE PREVENTION ====================
// Override dealDamage to handle Ancient Protector
const originalDealDamage = Game.prototype.dealDamage;

Game.prototype.dealDamage = function(target, amount) {
    // Check for Ancient Protector
    if (target === 'player') {
        const hasProtector = this.playerField.some(c => 
            c.ability && c.ability.includes('You take no damage while this is alive')
        );
        if (hasProtector) {
            this.addLog("Ancient Protector prevents damage!");
            return;
        }
    } else if (target === 'ai') {
        const hasProtector = this.aiField.some(c => 
            c.ability && c.ability.includes('You take no damage while this is alive')
        );
        if (hasProtector) {
            return;
        }
    }
    
    originalDealDamage.call(this, target, amount);
};

// ==================== HANDLE PERMANENT FREEZE ====================
// Override resetForTurn to handle permanent freeze
const originalResetForTurn = Card.prototype.resetForTurn;

Card.prototype.resetForTurn = function() {
    if (this.permanentlyFrozen) {
        // Don't unfreeze
        this.hasAttackedThisTurn = false;
        this.doubleStrikeUsed = false;
        this.windfuryUsed = false;
        this.canOnlyAttackCreatures = false;
        this.tempImmune = false;
        
        if (this.ability === 'Regenerate' || this.auraRegenerate) {
            this.health = this.maxHealth;
        }
        return;
    }
    
    originalResetForTurn.call(this);
};

// ==================== SPELL POWER CALCULATION ====================
// Enhanced spell power calculation
const originalUpdateSpellPower = Game.prototype.updateSpellPower;

Game.prototype.updateSpellPower = function() {
    originalUpdateSpellPower.call(this);
    
    // Add Spell Power +2 and +3
    this.playerSpellPower += this.playerField.filter(c => 
        c.ability && c.ability.includes('Spell Power +2')
    ).length * 2;
    
    this.playerSpellPower += this.playerField.filter(c => 
        c.ability && c.ability.includes('Spell Power +3')
    ).length * 3;
    
    this.aiSpellPower += this.aiField.filter(c => 
        c.ability && c.ability.includes('Spell Power +2')
    ).length * 2;
    
    this.aiSpellPower += this.aiField.filter(c => 
        c.ability && c.ability.includes('Spell Power +3')
    ).length * 3;
    
    // Handle conditional spell power
    this.playerField.forEach(c => {
        if (c.ability && c.ability.includes('If you control both Crimson and Azure creatures, +2 instead')) {
            if (hasBothColors(this.playerField, 'crimson-azure')) {
                this.playerSpellPower += 1; // Already counted +1, add another +1
            }
        }
    });
    
    this.aiField.forEach(c => {
        if (c.ability && c.ability.includes('If you control both Crimson and Azure creatures, +2 instead')) {
            if (hasBothColors(this.aiField, 'crimson-azure')) {
                this.aiSpellPower += 1;
            }
        }
    });
};

// ==================== HAND SIZE LIMIT ====================
// Override to handle unlimited hand size
const originalEndTurn = Game.prototype.endTurn;

Game.prototype.endTurn = function() {
    // Check for unlimited hand size
    const playerHasUnlimitedHand = this.playerField.some(c => 
        c.ability && (c.ability.includes('Your hand size is unlimited') || 
                     c.ability.includes('Your maximum hand size is unlimited'))
    );
    
    const aiHasUnlimitedHand = this.aiField.some(c => 
        c.ability && (c.ability.includes('Your hand size is unlimited') || 
                     c.ability.includes('Your maximum hand size is unlimited'))
    );
    
    // Discard down to 10 if needed (unless unlimited)
    if (!playerHasUnlimitedHand && this.playerHand.length > 10) {
        this.playerHand.length = 10;
    }
    if (!aiHasUnlimitedHand && this.aiHand.length > 10) {
        this.aiHand.length = 10;
    }
    
    // Reset temporary attack bonuses
    [...this.playerField, ...this.aiField].forEach(c => {
        if (c.tempAttackBonus) {
            c.attack -= c.tempAttackBonus;
            c.tempAttackBonus = 0;
        }
    });
    
    originalEndTurn.call(this);
};

// ==================== TRAMPLE ENHANCEMENT ====================
// Handle trample from auras/granted abilities
// Note: originalCreatureCombat already declared in v3-abilities-complete.js

Game.prototype.creatureCombat = function(attacker, target) {
    originalCreatureCombat.call(this, attacker, target);
    
    // Check for granted trample
    if (attacker.trampleGranted && target.health <= 0) {
        const excess = Math.abs(target.health);
        const enemyPlayer = this.currentTurn === 'player' ? 'ai' : 'player';
        if (excess > 0) {
            this.dealDamage(enemyPlayer, excess);
            this.addLog(`Trample deals ${excess} excess damage!`);
        }
    }
};

// ==================== PHOENIX ETERNAL SPECIAL ====================
// Handle Phoenix Eternal's special deathrattle
const originalHandleDeathrattle = Game.prototype.handleDeathrattle;

Game.prototype.handleDeathrattle = function(card, player) {
    // Phoenix Eternal - return at end of turn
    if (card.ability && card.ability.includes('Whenever this dies, return it to play at end of turn')) {
        const newCard = new Card({
            name: card.name,
            cost: card.cost,
            type: card.type,
            attack: card.attack,
            health: card.maxHealth,
            ability: card.ability,
            emoji: card.emoji,
            rarity: card.rarity,
            color: card.color
        });
        newCard.tapped = true;
        
        if (player === 'player') {
            this.phoenixEternalToReturn = newCard;
        } else {
            this.aiPhoenixEternalToReturn = newCard;
        }
        this.addLog(`${card.name} will return at end of turn!`);
    }
    
    // Deathrattle: Deal 5 damage to all enemies
    if (card.ability && card.ability.includes('Charge. Deathrattle: Deal 5 damage to all enemies')) {
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        const enemyField = player === 'player' ? this.aiField : this.playerField;
        
        this.dealDamage(enemyPlayer, 5);
        enemyField.forEach(c => c.takeDamage(5));
        this.addLog("Deathrattle: Dealt 5 damage to all enemies!");
        this.checkCreatureDeaths();
    }
    
    originalHandleDeathrattle.call(this, card, player);
};

// ==================== ETERNAL LICH - CAN'T BE DESTROYED ====================
// Enhance takeDamage for Eternal Lich
const originalTakeDamage = Card.prototype.takeDamage;

Card.prototype.takeDamage = function(amount, source = null) {
    if (this.ability && this.ability.includes('Cannot be destroyed')) {
        if (amount <= 0) return 0;
        if (this.immune || this.tempImmune) return 0;
        if (this.divineShield) {
            this.divineShield = false;
            return 0;
        }
        
        // Take damage but never go below 1
        const actualDamage = Math.min(amount, this.health - 1);
        this.health = Math.max(1, this.health - amount);
        
        return actualDamage;
    }
    
    return originalTakeDamage.call(this, amount, source);
};

console.log('✅ V3.0 Abilities Part 2 loaded!');
console.log('📋 Added: Complex spells, special mechanics, draw triggers, and more!');
