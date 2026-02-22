// ========================================================================
// CHECK DEATHS DEATHRATTLE FIX
// ========================================================================
// Fixes issue where deathrattle tokens get lost during filter()
// Problem: filter() creates NEW array, but deathrattles add to OLD array
// Solution: Collect tokens during filter, add them AFTER filter completes

console.log('💀 Loading Check Deaths Deathrattle Fix...');

// Store tokens to summon after filter completes
Game.prototype._pendingTokens = [];

// Replace handleDeathrattle to collect tokens instead of adding immediately
Game.prototype.handleDeathrattle = function(card, player) {
    console.log(`[DEATHRATTLE] Processing ${card.name}: "${card.ability}"`);
    
    const ability = card.ability;
    const field = player === 'player' ? this.playerField : this.aiField;  // FIX: Add missing variable
    const enemyPlayer = player === 'player' ? 'ai' : 'player';
    const enemyField = player === 'player' ? this.aiField : this.playerField;
    const hand = player === 'player' ? this.playerHand : this.aiHand;
    if (!ability || !ability.includes('Deathrattle:')) {
        return;
    }
    
    // COLLECT tokens to summon (don't add to field yet!)
    
    // Void Lord - Summon 3/3 Voidlings
    if (ability.includes('Summon three 3/3 Voidlings with Taunt')) {
        console.log(`[VOIDLING] Queueing 3 Voidlings for ${player}`);
        for (let i = 0; i < 3; i++) {
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
            voidling.tapped = true;
            voidling.taunt = true;
            voidling.maxHealth = 3;
            voidling.baseAttack = 3;
            voidling.baseHealth = 3;
            voidling.hasAttackedThisTurn = false;
            voidling.frozen = false;
            
            this._pendingTokens.push({ creature: voidling, owner: player });
            console.log(`[VOIDLING] Queued Voidling ${i + 1}`);
        }
        this.addLog("Deathrattle: Summoned 3 Voidlings with Taunt!");
        return;
    }
    
    // Eternal Treant - Summon 3/3 Treants
    if (ability.includes('Summon three 3/3 Treants')) {
        for (let i = 0; i < 3; i++) {
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
            
            this._pendingTokens.push({ creature: treant, owner: player });
        }
        this.addLog("Deathrattle: Summoned 3 Treants!");
        return;
    }
    
    // Skeleton summon
    if (ability.includes('Summon a 1/1 Skeleton')) {
        const skeleton = new window.Card({
            name: "Skeleton", cost: 0, type: "creature", attack: 1, health: 1,
            ability: "", emoji: "💀", rarity: "common", color: "umbral"
        });
        skeleton.tapped = true;
        skeleton.maxHealth = 1;
        skeleton.baseAttack = 1;
        skeleton.baseHealth = 1;
        this._pendingTokens.push({ creature: skeleton, owner: player });
        this.addLog("Deathrattle: Summoned 1/1 Skeleton!");
        return;
    }
    
    // Shadow summon
    if (ability.includes('Summon a 2/2 Shadow')) {
        const shadow = new window.Card({
            name: "Shadow", cost: 0, type: "creature", attack: 2, health: 2,
            ability: "", emoji: "👤", rarity: "common", color: "umbral"
        });
        shadow.tapped = true;
        shadow.maxHealth = 2;
        shadow.baseAttack = 2;
        shadow.baseHealth = 2;
        this._pendingTokens.push({ creature: shadow, owner: player });
        this.addLog("Deathrattle: Summoned 2/2 Shadow!");
        return;
    }
    
    // Non-summon deathrattles (process immediately)
    
    // Draw
    if (ability.includes('Draw')) {
        const drawCount = parseInt(ability.match(/Draw (\d+)/)?.[1] || 1);
        for (let i = 0; i < drawCount; i++) {
            this.drawCard(player);
        }
        this.addLog(`Deathrattle: Drew ${drawCount} card(s)!`);
        return;
    }
    
    // Return to hand
    if (ability.includes('Return to hand') || ability === 'Resurrect') {
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
    
    console.log(`[DEATHRATTLE] Unhandled: "${ability}"`);
};

// REPLACE checkCreatureDeaths to add tokens AFTER filter
const _originalCheckCreatureDeaths = Game.prototype.checkCreatureDeaths;
Game.prototype.checkCreatureDeaths = function() {
    // Clear pending tokens
    this._pendingTokens = [];
    
    console.log(`[CHECK DEATHS] Player field before: ${this.playerField.length}, AI field before: ${this.aiField.length}`);
    
    // Check player creatures (filter creates NEW array)
    this.playerField = this.playerField.filter(c => {
        if (c.cantDie && c.health <= 0) {
            c.health = 1;
            this.addLog(`${c.name} can't die!`);
            return true;
        }
        
        if (c.health <= 0) {
            this.addLog(`${c.name} was destroyed!`);
            
            // Track deaths
            this.totalCreatureDeaths = (this.totalCreatureDeaths || 0) + 1;
            
            // Add to graveyard
            this.playerGraveyard = this.playerGraveyard || [];
            this.playerGraveyard.push({
                name: c.name, cost: c.cost, type: c.type, attack: c.attack,
                health: c.health, maxHealth: c.maxHealth, ability: c.ability,
                emoji: c.emoji, rarity: c.rarity, color: c.color
            });
            
            // Trigger death abilities (may queue tokens)
            this.handleDeathrattle(c, 'player');
            
            return false; // Remove from field
        }
        return true;
    });
    
    // Check AI creatures
    this.aiField = this.aiField.filter(c => {
        if (c.cantDie && c.health <= 0) {
            c.health = 1;
            return true;
        }
        
        if (c.health <= 0) {
            this.addLog(`${c.name} was destroyed!`);
            
            this.totalCreatureDeaths = (this.totalCreatureDeaths || 0) + 1;
            
            this.aiGraveyard = this.aiGraveyard || [];
            this.aiGraveyard.push({
                name: c.name, cost: c.cost, type: c.type, attack: c.attack,
                health: c.health, maxHealth: c.maxHealth, ability: c.ability,
                emoji: c.emoji, rarity: c.rarity, color: c.color
            });
            
            this.handleDeathrattle(c, 'ai');
            
            return false;
        }
        return true;
    });
    
    console.log(`[CHECK DEATHS] After filter - Player: ${this.playerField.length}, AI: ${this.aiField.length}`);
    console.log(`[CHECK DEATHS] Pending tokens: ${this._pendingTokens.length}`);
    
    // NOW add all pending tokens (after filter completes!)
    this._pendingTokens.forEach((token, index) => {
        const targetField = token.owner === 'player' ? this.playerField : this.aiField;
        
        if (targetField.length < 7) {
            targetField.push(token.creature);
            console.log(`[CHECK DEATHS] Added ${token.creature.name} to ${token.owner} field (${index + 1}/${this._pendingTokens.length})`);
        } else {
            console.log(`[CHECK DEATHS] Could not add ${token.creature.name} - field full`);
        }
    });
    
    console.log(`[CHECK DEATHS] Final - Player: ${this.playerField.length}, AI: ${this.aiField.length}`);
    
    // Clear pending tokens
    this._pendingTokens = [];
    
    // Reapply auras after deaths
    if (this.applyAuras) {
        this.applyAuras();
    }
    if (this.updateSpellPower) {
        this.updateSpellPower();
    }
    
    // Force display update
    this.updateDisplay();
};

console.log('✅ Check Deaths Deathrattle Fix loaded!');
console.log('   🔄 Tokens queued during filter, added after');
console.log('   💀 Prevents filter() array loss bug');
console.log('   🎯 Voidlings and all deathrattle tokens will appear!');
