// ========================================================================
// V3 ABILITIES CRITICAL FIXES
// ========================================================================
// Fixes crashes and deathrattle failures in v3-abilities-complete.js
// MUST load AFTER all v3-abilities patches

console.log('🔧 Loading v3 Abilities Critical Fixes...');

// FIX 1: triggerAttackAbilities - player variable undefined
const _originalTriggerAttackAbilities = Game.prototype.triggerAttackAbilities;
Game.prototype.triggerAttackAbilities = function(attacker, target, attackingPlayer, enemyPlayer) {
    const ability = attacker.ability;
    const field = attackingPlayer === 'player' ? this.playerField : this.aiField;
    const enemyField = attackingPlayer === 'player' ? this.aiField : this.playerField;
    
    if (ability.includes('Attack Trigger: Deal 1 damage to enemy player')) {
        this.dealDamage(enemyPlayer, 1);
    } else if (ability.includes('Attack Trigger: Deal 1 damage')) {
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
    if (ability.includes('Attack Trigger: Deal damage equal to this creature\'s attack to all enemies')) {
        this.dealDamage(enemyPlayer, attacker.attack);
        enemyField.forEach(c => c.takeDamage(attacker.attack));
        this.addLog(`Deals ${attacker.attack} damage to all enemies!`);
        this.checkCreatureDeaths();
    }
    if (ability.includes('Attack Trigger: Draw a card')) {
        this.drawCard(attackingPlayer);
    }
    if (ability.includes('Attack Trigger: Enemy discards a card')) {
        const enemyHand = attackingPlayer === 'player' ? this.aiHand : this.playerHand;
        if (enemyHand.length > 0) {
            enemyHand.splice(Math.floor(Math.random() * enemyHand.length), 1);
            this.addLog("Enemy discarded a card!");
        }
    }
    if (ability.includes('Attack Trigger: Destroy random enemy creature')) {
        if (enemyField.length > 0) {
            const randomTarget = enemyField[Math.floor(Math.random() * enemyField.length)];
            randomTarget.health = 0;
            this.addLog(`Destroyed ${randomTarget.name}!`);
            this.checkCreatureDeaths();
        }
    }
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
        if (attackingPlayer === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 5);
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
    if (ability.includes('Freeze enemy when attacking')) {
        if (target !== 'player' && target !== 'ai') {
            target.frozen = true;
            this.addLog(`${target.name} is frozen!`);
        }
    }
    if (ability.includes('Draw a card when attacking')) {
        this.drawCard(attackingPlayer);
    }
};

// FIX 2: handleDeathrattle - COMPLETE REPLACEMENT with all base properties set
Game.prototype.handleDeathrattle = function(card, player) {
    console.log(`[DEATHRATTLE FIX] Processing ${card.name}: "${card.ability}"`);
    
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    
    if (!ability || !ability.includes('Deathrattle:')) {
        return;
    }
    
    // Void Lord - Summon 3/3 Voidlings with Taunt
    if (ability.includes('Summon three 3/3 Voidlings with Taunt')) {
        console.log(`[VOIDLING SUMMON] Field before: ${field.length}/7`);
        
        const beforeLength = field.length;
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const voidling = new window.Card({
                name: "Voidling", 
                cost: 0, 
                type: "creature", 
                attack: 3, 
                health: 3,
                ability: "Taunt", 
                emoji: "😈", 
                rarity: "common", 
                color: "umbral"
            });
            
            // Set ALL required properties for aura system
            voidling.tapped = true;
            voidling.taunt = true;
            voidling.maxHealth = 3;
            voidling.baseAttack = 3;  // CRITICAL: Aura system needs this
            voidling.baseHealth = 3;  // CRITICAL: Aura system needs this
            voidling.hasAttackedThisTurn = false;
            voidling.frozen = false;
            
            field.push(voidling);
            console.log(`[VOIDLING SUMMON] Created Voidling ${i+1}, field: ${field.length}/7`);
        }
        
        const summoned = field.length - beforeLength;
        this.addLog(`Deathrattle: Summoned ${summoned} Voidling${summoned > 1 ? 's' : ''} with Taunt!`);
        console.log(`[VOIDLING SUMMON] Total summoned: ${summoned}, field after: ${field.length}/7`);
        return; // Don't process other handlers
    }
    
    // Treant summon
    if (ability.includes('Summon three 3/3 Treants')) {
        const beforeLength = field.length;
        for (let i = 0; i < 3 && field.length < 7; i++) {
            const treant = new window.Card({
                name: "Treant", cost: 0, type: "creature", attack: 3, health: 3,
                ability: "", emoji: "🌳", rarity: "common", color: "verdant"
            });
            treant.tapped = true;
            treant.maxHealth = 3;
            treant.baseAttack = 3;
            treant.baseHealth = 3;
            treant.hasAttackedThisTurn = false;
            treant.frozen = false;
            field.push(treant);
        }
        const summoned = field.length - beforeLength;
        if (summoned > 0) {
            this.addLog(`Deathrattle: Summoned ${summoned} Treant${summoned > 1 ? 's' : ''}!`);
        }
        return;
    }
    
    // Skeleton/Shadow summon
    if (ability.includes('Summon a 1/1 Skeleton')) {
        if (field.length < 7) {
            const skeleton = new window.Card({
                name: "Skeleton", cost: 0, type: "creature", attack: 1, health: 1,
                ability: "", emoji: "💀", rarity: "common", color: "umbral"
            });
            skeleton.tapped = true;
            skeleton.maxHealth = 1;
            skeleton.baseAttack = 1;
            skeleton.baseHealth = 1;
            field.push(skeleton);
            this.addLog("Deathrattle: Summoned 1/1 Skeleton!");
        }
        return;
    }
    
    if (ability.includes('Summon a 2/2 Shadow')) {
        if (field.length < 7) {
            const shadow = new window.Card({
                name: "Shadow", cost: 0, type: "creature", attack: 2, health: 2,
                ability: "", emoji: "👤", rarity: "common", color: "umbral"
            });
            shadow.tapped = true;
            shadow.maxHealth = 2;
            shadow.baseAttack = 2;
            shadow.baseHealth = 2;
            field.push(shadow);
            this.addLog("Deathrattle: Summoned 2/2 Shadow!");
        }
        return;
    }
    
    // Draw deathrattles
    if (ability.includes('Draw')) {
        const drawCount = parseInt(ability.match(/Draw (\d+)/)?.[1] || 1);
        for (let i = 0; i < drawCount; i++) {
            this.drawCard(player);
        }
        this.addLog(`Deathrattle: Drew ${drawCount} card(s)!`);
        return;
    }
    
    // Return to hand
    if (ability.includes('Return to hand')) {
        const bonus = ability.includes('with +2/+2') ? 2 : 0;
        const newCard = new window.Card({
            name: card.name, cost: card.cost, type: card.type,
            attack: card.attack + bonus, health: card.maxHealth + bonus,
            ability: card.ability, emoji: card.emoji, rarity: card.rarity, color: card.color
        });
        newCard.maxHealth = card.maxHealth + bonus;
        newCard.baseAttack = card.attack + bonus;
        newCard.baseHealth = card.maxHealth + bonus;
        if (hand.length < 10) {
            hand.push(newCard);
            this.addLog(`${card.name} returns to hand${bonus > 0 ? ' with +2/+2' : ''}!`);
        }
        return;
    }
    
    // Rat - Conditional enemy discard (if you control no other creatures)
    if (ability.includes('If you control no other creatures, enemy discards')) {
        // Check if player has no other creatures on field
        if (field.length === 0) {
            console.log('[RAT] Deathrattle triggered - no other creatures, enemy discards!');
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            
            if (enemyHand.length > 0) {
                // Random discard
                const randomIndex = Math.floor(Math.random() * enemyHand.length);
                const discarded = enemyHand.splice(randomIndex, 1)[0];
                
                this.addLog(`Rat: Enemy discarded ${discarded.name}!`);
                console.log(`[RAT] Enemy discarded ${discarded.name}`);
            } else {
                console.log('[RAT] Enemy hand is empty, nothing to discard');
            }
        } else {
            console.log(`[RAT] Deathrattle not triggered - ${field.length} other creatures on field`);
        }
        return;
    }
    
    // Deal damage
    if (ability.includes('Deal') || ability.includes('Enemy loses')) {
        const damage = parseInt(ability.match(/(\d+)/)?.[1] || 0);
        if (damage > 0) {
            if (ability.includes('to all enemies')) {
                this.dealDamage(enemyPlayer, damage);
                enemyField.forEach(c => c.takeDamage(damage));
            } else {
                this.dealDamage(enemyPlayer, damage);
            }
            this.addLog(`Deathrattle: ${damage} damage!`);
        }
        return;
    }
    
    // Gain health
    if (ability.includes('Gain')) {
        const health = parseInt(ability.match(/(\d+)/)?.[1] || 0);
        if (health > 0) {
            if (player === 'player') this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + health);
            else this.aiHealth = Math.min(this.aiMaxHealth, this.aiHealth + health);
            this.addLog(`Deathrattle: Gained ${health} health!`);
        }
        return;
    }
    
    console.log(`[DEATHRATTLE FIX] Unhandled deathrattle: "${ability}"`);
};

// FIX 3: Dragon Emperor - Add missing Battlecry: Deal 5 damage to all other creatures

// FIX 3: Dragon Emperor + Void Terror + Tide Shifter - Missing Battlecries
const _originalHandleEnterPlayForDragon = Game.prototype.handleEnterPlayAbilities;

// Track which cards have already had their battlecries processed (prevent duplicates)
if (!window._battlecryProcessed) {
    window._battlecryProcessed = new Set();
}

Game.prototype.handleEnterPlayAbilities = function(card, player, field) {
    const ability = card.ability;
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    
    // Void Terror - Destroy all allies, gain their stats
    if (ability && ability.includes('Battlecry: Destroy all allies. Gain their stats')) {
        if (window._battlecryProcessed.has(card)) {
            console.log('[VOID TERROR] Already processed - skipping');
            return;
        }
        window._battlecryProcessed.add(card);
        
        console.log('[VOID TERROR] Battlecry triggered!');
        
        let totalAttack = 0;
        let totalHealth = 0;
        const allies = field.filter(c => c !== card);
        
        console.log(`[VOID TERROR] Found ${allies.length} allies to consume`);
        
        allies.forEach(ally => {
            totalAttack += ally.attack;
            totalHealth += (ally.maxHealth || ally.health);
            console.log(`[VOID TERROR] Consuming ${ally.name}: +${ally.attack}/+${ally.maxHealth || ally.health}`);
        });
        
        for (let i = field.length - 1; i >= 0; i--) {
            if (field[i] !== card) {
                this.handleDeathrattle(field[i], player);
                field.splice(i, 1);
            }
        }
        
        if (this._pendingTokens && this._pendingTokens.length > 0) {
            console.log(`[VOID TERROR] Flushing ${this._pendingTokens.length} pending tokens`);
            this._pendingTokens.forEach(token => {
                const targetField = token.owner === 'player' ? this.playerField : this.aiField;
                if (targetField.length < 7) {
                    targetField.push(token.creature);
                }
            });
            this._pendingTokens = [];
        }
        
        card.attack += totalAttack;
        card.health += totalHealth;
        card.maxHealth = (card.maxHealth || card.health);
        card.baseAttack = card.attack;
        card.baseHealth = card.maxHealth;
        
        this.addLog(`Void Terror consumed ${allies.length} allies! Gained +${totalAttack}/+${totalHealth}!`);
        console.log(`[VOID TERROR] Final stats: ${card.attack}/${card.health}`);
        return;
    }
    
    // Tide Shifter - Bounce enemy creature (2- cost)
    if (ability && ability.includes('Bounce enemy creature (2- cost)')) {
        console.log('[TIDE SHIFTER] Battlecry triggered!');
        const targets = enemyField.filter(c => c.cost <= 2);
        console.log(`[TIDE SHIFTER] Found ${targets.length} targets (cost ≤2)`);
        
        if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            const index = enemyField.indexOf(target);
            if (index > -1) {
                enemyField.splice(index, 1);
            }
            
            const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
            const enemyMaxHand = this.getMaxHandSize(player === 'player' ? 'ai' : 'player');
            
            if (enemyHand.length < enemyMaxHand) {
                enemyHand.push(target);
                this.addLog(`Tide Shifter: Returned ${target.name} to hand!`);
                console.log(`[TIDE SHIFTER] Bounced ${target.name} (cost ${target.cost})`);
            } else {
                this.addLog(`Tide Shifter: Enemy hand is full!`);
                console.log(`[TIDE SHIFTER] Enemy hand full, ${target.name} destroyed`);
            }
        } else {
            this.addLog("Tide Shifter: No valid targets!");
            console.log('[TIDE SHIFTER] No enemy creatures with cost ≤2');
        }
        return;
    }
    
    // Dragon Emperor - Deal 5 damage to all other creatures
    if (ability && ability.includes('Battlecry: Deal 5 damage to all other creatures')) {
        console.log('[DRAGON EMPEROR] Battlecry triggered!');
        [...this.playerField, ...this.aiField].forEach(c => {
            if (c !== card && !c.immune) {
                c.takeDamage(5);
            }
        });
        this.addLog("Dragon Emperor: Dealt 5 damage to all other creatures!");
        this.checkCreatureDeaths();
        return;
    }
    
    // Call original for all other battlecries
    if (_originalHandleEnterPlayForDragon) {
        _originalHandleEnterPlayForDragon.call(this, card, player, field);
    }
};

console.log('✅ V3 Abilities Critical Fixes loaded!');
console.log('   🔧 Fixed: Attack triggers use attackingPlayer correctly');
console.log('   💀 Fixed: Deathrattles set baseAttack/baseHealth for aura system');
console.log('   🛡️ Fixed: All token properties initialized correctly');
console.log('   ⚠️ Completely replaces handleDeathrattle (no conflicts)');
console.log('   😈 Added: Void Terror battlecry (consume allies, gain stats)');
console.log('   🌊 Added: Tide Shifter battlecry (bounce enemy ≤2 cost)');
console.log('   🐉 Added: Dragon Emperor battlecry (5 AOE damage)');
console.log('   🐀 Added: Rat deathrattle (conditional enemy discard)');
