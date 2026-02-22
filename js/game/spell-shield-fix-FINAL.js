// ========================================================================
// SPELL SHIELD FIX - Direct Override (MUST LOAD ABSOLUTELY LAST)
// ========================================================================
// Completely replaces handleSpellTargeting to check Spell Shield FIRST
// OPTION 2: Both spell and shield are consumed (more balanced)

console.log('🛡️🛡️🛡️ Loading FINAL Spell Shield Fix - Direct Override...');

// Completely replace handleSpellTargeting
Game.prototype.handleSpellTargeting = function(card, isPlayerCard) {
    console.log(`[SPELL SHIELD] Target: ${card.name}, hasShield: ${card.spellShield}, pending: ${this.pendingSpell?.name}`);
    
    // No pending spell? Exit
    if (!this.pendingSpell) {
        console.log('[SPELL SHIELD] No pending spell, exiting');
        return;
    }
    
    const spellCard = this.pendingSpell;
    
    // === CRITICAL: CHECK SPELL SHIELD BEFORE ANYTHING ELSE ===
    if (card.spellShield) {
        console.log(`[SPELL SHIELD] 🛡️ ${card.name} BLOCKS ${spellCard.name}!`);
        
        // Consume the shield
        card.spellShield = false;
        
        // Show message
        this.addLog(`🛡️ ${card.name}'s Spell Shield blocks ${spellCard.name}!`);
        
        // OPTION 2: CONSUME BOTH SPELL AND SHIELD
        // This creates a fair trade: spell for shield
        // Remove spell from hand and spend mana
        const index = this.playerHand.indexOf(spellCard);
        if (index > -1) {
            this.playerHand.splice(index, 1);
            this.playerMana -= spellCard.cost;
            this.playerSpellsCount++;
            
            // Track statistics (spell was cast, even though blocked)
            this.gameStats.playerCardsPlayed++;
            this.gameStats.playerManaSpent += spellCard.cost;
            this.gameStats.cardsUsedThisGame.add(spellCard.name);
            this.gameStats.playerSpellsCast++;
        }
        
        // Clear pending spell
        this.pendingSpell = null;
        this.pendingTargetType = null;
        
        // Update display
        this.updateDisplay();
        
        console.log('[SPELL SHIELD] BOTH consumed - Fair trade: spell for shield, NO damage dealt');
        return; // EXIT - spell consumed, shield consumed, NO damage
    }
    
    // No Spell Shield, proceed with normal targeting validation
    let validTarget = false;
    
    if (this.pendingTargetType === 'enemy' && !isPlayerCard) {
        validTarget = true;
    } else if (this.pendingTargetType === 'enemy creature' && !isPlayerCard && this.aiField.includes(card)) {
        validTarget = true;
    } else if (this.pendingTargetType === 'any creature') {
        validTarget = true;
    }
    
    if (validTarget) {
        console.log(`[SPELL SHIELD] Valid target, no shield - casting spell`);
        
        // Clear pending spell
        this.pendingSpell = null;
        this.pendingTargetType = null;
        
        // NOW consume the spell (remove from hand, spend mana)
        const index = this.playerHand.indexOf(spellCard);
        if (index > -1) {
            this.playerHand.splice(index, 1);
            this.playerMana -= spellCard.cost;
            this.playerSpellsCount++;
            
            // Track statistics
            this.gameStats.playerCardsPlayed++;
            this.gameStats.playerManaSpent += spellCard.cost;
            this.gameStats.cardsUsedThisGame.add(spellCard.name);
            this.gameStats.playerSpellsCast++;
            
            // Execute spell effect
            this.handleSpell(spellCard, 'player', card);
            this.updateDisplay();
        }
    } else {
        console.log(`[SPELL SHIELD] Invalid target`);
    }
};

// ========================================================================
// Also fix AI spell targeting
// ========================================================================

Game.prototype.handleDamageSpell = function(card, player, target) {
    const baseDamage = parseInt(card.ability.match(/\d+/)[0]);
    const spellPower = player === 'player' ? this.playerSpellPower : this.aiSpellPower;
    let damage = baseDamage + spellPower;
    
    if ((player === 'player' && this.playerHasDoubleSpellDamage) ||
        (player === 'ai' && this.aiHasDoubleSpellDamage)) {
        damage *= 2;
        this.addLog("Double spell damage activated!");
    }
    
    if (player === 'ai') {
        // AI spell targeting
        let aiTarget = this.chooseSpellTarget(damage);
        
        if (aiTarget && aiTarget !== 'player') {
            // === CHECK SPELL SHIELD FOR AI SPELLS ===
            if (aiTarget.spellShield) {
                console.log(`[SPELL SHIELD] 🛡️ AI spell ${card.name} BLOCKED by ${aiTarget.name}!`);
                aiTarget.spellShield = false;
                this.addLog(`🛡️ ${aiTarget.name}'s Spell Shield blocks ${card.name}!`);
                console.log('[SPELL SHIELD] AI spell consumed, shield consumed, NO damage dealt');
                return; // EXIT - spell blocked (AI spell already consumed, which is correct)
            }
            
            console.log(`[SPELL DAMAGE] ${card.name} targeting ${aiTarget.name} for ${damage} damage`);
            const actualDamage = aiTarget.takeDamage ? aiTarget.takeDamage(damage) : (aiTarget.health -= damage, damage);
            this.addLog(`AI's ${card.name} deals ${actualDamage} damage to ${aiTarget.name}!`);
            if (card.ability.includes('Freeze')) {
                aiTarget.frozen = true;
                this.addLog(`${aiTarget.name} is frozen!`);
            }
            this.checkCreatureDeaths();
        } else {
            // Target player directly
            this.dealDamage('player', damage);
            this.addLog(`AI's ${card.name} deals ${damage} damage to you!`);
        }
    } else if (target) {
        // Player targeting (should already be checked in handleSpellTargeting, but double-check)
        if (target === 'ai') {
            this.dealDamage('ai', damage);
            this.addLog(`${card.name} deals ${damage} damage to opponent!`);
        } else {
            // This shouldn't happen if handleSpellTargeting works, but just in case
            if (target.spellShield) {
                console.log(`[SPELL SHIELD] Late check - ${target.name} blocks ${card.name}`);
                target.spellShield = false;
                this.addLog(`🛡️ ${target.name}'s Spell Shield blocks ${card.name}!`);
                return;
            }
            
            console.log(`[SPELL DAMAGE] ${card.name} targeting ${target.name} for ${damage} damage`);
            const actualDamage = target.takeDamage ? target.takeDamage(damage) : (target.health -= damage, damage);
            
            this.gameStats.playerDamageDealt += actualDamage;
            
            this.addLog(`${card.name} deals ${actualDamage} damage to ${target.name}!`);
            if (card.ability.includes('Freeze')) {
                target.frozen = true;
                this.addLog(`${target.name} is frozen!`);
            }
            this.checkCreatureDeaths();
        }
    }
};

console.log('✅✅✅ SPELL SHIELD FIX - Option 2 (Both Consumed) Active!');
console.log('   🛡️ When shield blocks: Spell consumed + Shield consumed + No damage');
console.log('   ⚖️ Fair trade: You lose spell, opponent loses shield');
console.log('   🎯 Strategic gameplay: Choose wisely when to break shields!');
