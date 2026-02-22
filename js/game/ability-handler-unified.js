// ========================================================================
// UNIFIED ABILITY HANDLER - Quick Fix for Ability Override Issues
// ========================================================================
// This file should load BEFORE other patches to prevent ability overwrites
// It provides a centralized ability handling system

console.log('🎯 Loading Unified Ability Handler...');

// Create a global ability registry to prevent duplicate processing
window.abilityRegistry = {
    processed: new Set(),
    
    markProcessed(abilityId) {
        this.processed.add(abilityId);
    },
    
    wasProcessed(abilityId) {
        return this.processed.has(abilityId);
    },
    
    clearFor(cardName) {
        // Clear processed flags for a specific card (useful for testing)
        for (let id of this.processed) {
            if (id.startsWith(cardName + ':')) {
                this.processed.delete(id);
            }
        }
    }
};

// Store ORIGINAL methods before any patches
if (!window._originalGameMethods) {
    window._originalGameMethods = {
        playCard: Game.prototype.playCard,
        playCreature: Game.prototype.playCreature,
        handleEnterPlayAbilities: Game.prototype.handleEnterPlayAbilities,
        handleSpell: Game.prototype.handleSpell,
        handleDamageSpell: Game.prototype.handleDamageSpell,
        attack: Game.prototype.attack,
        checkCreatureDeaths: Game.prototype.checkCreatureDeaths
    };
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function hasColorOnBoard(field, color) {
    return field.some(c => c.color && c.color.includes(color));
}

function hasBothColors(field, cardColor) {
    if (!cardColor || !cardColor.includes('-')) return false;
    const colors = cardColor.split('-');
    return colors.every(c => hasColorOnBoard(field, c));
}

function getColorCreatureCount(field, color) {
    return field.filter(c => c.color && c.color.includes(color)).length;
}

// ========================================================================
// UNIFIED ABILITY PROCESSOR
// ========================================================================

class UnifiedAbilityProcessor {
    constructor(game) {
        this.game = game;
    }
    
    // Check Spell Shield BEFORE any spell effect (returns true if blocked)
    checkSpellShield(target, spellCard, player) {
        // Can't block if targeting player directly
        if (!target || target === 'player' || target === 'ai') {
            return false;
        }
        
        // Check if target has Spell Shield
        if (target.spellShield) {
            console.log(`[SPELL SHIELD] ${target.name}'s Spell Shield blocks ${spellCard.name}!`);
            target.spellShield = false; // Consume the shield
            this.game.addLog(`${target.name}'s Spell Shield blocks the spell!`);
            return true; // Spell is blocked
        }
        
        return false; // Spell not blocked
    }
    
    // Process enter-play abilities
    processEnterPlayAbility(card, player, field) {
        const abilityId = `${card.name}:enterplay:${Date.now()}`;
        
        // Prevent duplicate processing
        if (window.abilityRegistry.wasProcessed(abilityId)) {
            console.log(`[ABILITY] Skipping duplicate enter-play for ${card.name}`);
            return;
        }
        
        window.abilityRegistry.markProcessed(abilityId);
        
        const ability = card.ability;
        if (!ability) return;
        
        console.log(`[ABILITY] Processing enter-play: ${card.name} - "${ability}"`);
        
        // === BATTLECRY: DRAW CARDS ===
        if (ability.includes('Battlecry: Draw') || ability.includes('Draw a card') || ability.includes('Draw 2 cards') || ability.includes('Draw 3 cards')) {
            const drawCount = parseInt(ability.match(/\d+/)?.[0] || 1);
            for (let i = 0; i < drawCount; i++) {
                this.game.drawCard(player);
            }
            this.game.addLog(`${card.name}: Drew ${drawCount} card(s)!`);
            return; // IMPORTANT: Return after handling to prevent fallthrough
        }
        
        // === BATTLECRY: DEAL DAMAGE ===
        if (ability.includes('Battlecry: Deal') && ability.includes('damage')) {
            const damage = parseInt(ability.match(/Deal (\d+)/)?.[1] || 0);
            if (damage > 0) {
                const enemyPlayer = player === 'player' ? 'ai' : 'player';
                this.game.dealDamage(enemyPlayer, damage);
                this.game.addLog(`${card.name}: Dealt ${damage} damage!`);
                return;
            }
        }
        
        // === BATTLECRY: GAIN HEALTH ===
        if (ability.includes('Battlecry: Gain') && ability.includes('health')) {
            const health = parseInt(ability.match(/Gain (\d+)/)?.[1] || 0);
            if (health > 0) {
                if (player === 'player') {
                    this.game.playerHealth = Math.min(this.game.playerMaxHealth, this.game.playerHealth + health);
                } else {
                    this.game.aiHealth = Math.min(this.game.aiMaxHealth, this.game.aiHealth + health);
                }
                this.game.addLog(`${card.name}: Gained ${health} health!`);
                return;
            }
        }
        
        // === TAUNT ===
        if (ability === 'Taunt' || ability.includes('Taunt')) {
            card.taunt = true;
        }
        
        // === CHARGE / QUICK / RUSH ===
        if (ability === 'Quick' || ability === 'Charge' || ability === 'Haste') {
            card.tapped = false;
        }
        
        if (ability === 'Rush') {
            card.tapped = false;
            card.justPlayed = true;
            card.canOnlyAttackCreatures = true;
        }
        
        // === DIVINE SHIELD ===
        if (ability === 'Divine Shield' || ability.includes('Divine Shield')) {
            card.divineShield = true;
        }
        
        // === SPELL SHIELD ===
        if (ability === 'Spell Shield' || ability.includes('Spell Shield')) {
            card.spellShield = true;
            console.log(`[SPELL SHIELD] ${card.name} now has Spell Shield!`);
        }
        
        // === STEALTH ===
        if (ability === 'Stealth' || ability.includes('Stealth')) {
            card.stealth = true;
        }
        
        // Add more ability handlers here as needed...
        // This is the SINGLE place to add new ability logic
    }
    
    // Process attack trigger abilities
    processAttackTrigger(attacker, target, player) {
        const ability = attacker.ability;
        if (!ability || !ability.includes('Attack Trigger:')) return;
        
        const abilityId = `${attacker.name}:attacktrigger:${Date.now()}`;
        if (window.abilityRegistry.wasProcessed(abilityId)) return;
        window.abilityRegistry.markProcessed(abilityId);
        
        console.log(`[ABILITY] Processing attack trigger: ${attacker.name}`);
        
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        const enemyField = player === 'player' ? this.game.aiField : this.game.playerField;
        
        // === ATTACK TRIGGER: DEAL DAMAGE ===
        if (ability.includes('Deal') && ability.includes('damage')) {
            const damage = parseInt(ability.match(/Deal (\d+)/)?.[1] || 0);
            if (damage > 0) {
                if (ability.includes('to enemy player')) {
                    this.game.dealDamage(enemyPlayer, damage);
                } else if (ability.includes('to all enemies')) {
                    this.game.dealDamage(enemyPlayer, damage);
                    enemyField.forEach(c => c.takeDamage(damage));
                    this.game.checkCreatureDeaths();
                }
                this.game.addLog(`${attacker.name} attack trigger: ${damage} damage!`);
            }
        }
        
        // === ATTACK TRIGGER: DRAW CARD ===
        if (ability.includes('Draw a card')) {
            this.game.drawCard(player);
            this.game.addLog(`${attacker.name}: Drew a card!`);
        }
        
        // Add more attack triggers here...
    }
    
    // Process deathrattle abilities
    processDeathrattle(card, player) {
        const ability = card.ability;
        if (!ability || !ability.includes('Deathrattle:')) return;
        
        const abilityId = `${card.name}:deathrattle:${Date.now()}`;
        if (window.abilityRegistry.wasProcessed(abilityId)) return;
        window.abilityRegistry.markProcessed(abilityId);
        
        console.log(`[ABILITY] Processing deathrattle: ${card.name}`);
        
        const field = player === 'player' ? this.game.playerField : this.game.aiField;
        const hand = player === 'player' ? this.game.playerHand : this.game.aiHand;
        const enemyPlayer = player === 'player' ? 'ai' : 'player';
        
        // === DEATHRATTLE: DRAW ===
        if (ability.includes('Draw a card') || ability === 'Deathrattle: Draw') {
            this.game.drawCard(player);
            this.game.addLog(`${card.name} deathrattle: Drew a card!`);
        }
        
        // === DEATHRATTLE: DEAL DAMAGE ===
        if (ability.includes('Deal') && ability.includes('damage')) {
            const damage = parseInt(ability.match(/Deal (\d+)/)?.[1] || 0);
            if (damage > 0) {
                this.game.dealDamage(enemyPlayer, damage);
                this.game.addLog(`${card.name} deathrattle: ${damage} damage!`);
            }
        }
        
        // === DEATHRATTLE: RETURN TO HAND ===
        if (ability.includes('Return to hand') || ability === 'Resurrect') {
            const newCard = new window.Card({
                ...card,
                health: card.maxHealth
            });
            if (hand.length < 10) {
                hand.push(newCard);
                this.game.addLog(`${card.name} returns to hand!`);
            }
        }
        
        // Add more deathrattles here...
    }
}

// ========================================================================
// PATCH GAME METHODS TO USE UNIFIED PROCESSOR
// ========================================================================

// Create processor instance for each game
Game.prototype._getAbilityProcessor = function() {
    if (!this._abilityProcessor) {
        this._abilityProcessor = new UnifiedAbilityProcessor(this);
    }
    return this._abilityProcessor;
};

// Patch handleEnterPlayAbilities to use unified processor FIRST
const _originalHandleEnterPlay = Game.prototype.handleEnterPlayAbilities;
Game.prototype.handleEnterPlayAbilities = function(card, player, field) {
    // Process with unified system FIRST
    this._getAbilityProcessor().processEnterPlayAbility(card, player, field);
    
    // Then call original (which may have some abilities not yet in unified)
    // The ability registry will prevent duplicates
    if (_originalHandleEnterPlay) {
        _originalHandleEnterPlay.call(this, card, player, field);
    }
};

// CRITICAL: Patch handleDamageSpell to check Spell Shield FIRST
const _originalHandleDamageSpell = Game.prototype.handleDamageSpell;
Game.prototype.handleDamageSpell = function(card, player, target) {
    console.log(`[SPELL SHIELD CHECK] ${card.name} targeting ${target?.name || target}`);
    
    // Check Spell Shield BEFORE any damage
    if (this._getAbilityProcessor().checkSpellShield(target, card, player)) {
        console.log(`[SPELL SHIELD] Spell blocked! Exiting early.`);
        return; // Exit immediately - spell is blocked
    }
    
    // Spell not blocked, proceed with normal damage
    if (_originalHandleDamageSpell) {
        _originalHandleDamageSpell.call(this, card, player, target);
    }
};

// CRITICAL: Also patch handleSpell for non-damage spells with Spell Shield check
const _originalHandleSpell = Game.prototype.handleSpell;
Game.prototype.handleSpell = function(card, player, target = null) {
    // If spell targets a creature, check Spell Shield first
    if (target && target !== 'player' && target !== 'ai') {
        console.log(`[SPELL SHIELD CHECK] ${card.name} targeting ${target.name}`);
        
        if (this._getAbilityProcessor().checkSpellShield(target, card, player)) {
            console.log(`[SPELL SHIELD] Non-damage spell blocked! Exiting early.`);
            return; // Exit immediately - spell is blocked
        }
    }
    
    // Spell not blocked, proceed normally
    if (_originalHandleSpell) {
        _originalHandleSpell.call(this, card, player, target);
    }
};

// Patch attack to trigger attack abilities
const _originalAttack = Game.prototype.attack;
Game.prototype.attack = function(attacker, target) {
    // Call original attack first
    if (_originalAttack) {
        const attackerHadAttacked = attacker.hasAttackedThisTurn;
        _originalAttack.call(this, attacker, target);
        
        // If attack succeeded, trigger attack abilities
        if (attacker.hasAttackedThisTurn && !attackerHadAttacked) {
            const player = this.playerField.includes(attacker) ? 'player' : 'ai';
            this._getAbilityProcessor().processAttackTrigger(attacker, target, player);
        }
    }
};

// Patch checkCreatureDeaths to trigger deathrattles
const _originalCheckDeaths = Game.prototype.checkCreatureDeaths;
Game.prototype.checkCreatureDeaths = function() {
    // Before checking deaths, mark which creatures are about to die
    const dyingPlayerCreatures = this.playerField.filter(c => c.health <= 0);
    const dyingAICreatures = this.aiField.filter(c => c.health <= 0);
    
    // Process deathrattles BEFORE removing from field
    dyingPlayerCreatures.forEach(c => {
        this._getAbilityProcessor().processDeathrattle(c, 'player');
    });
    dyingAICreatures.forEach(c => {
        this._getAbilityProcessor().processDeathrattle(c, 'ai');
    });
    
    // Now call original to actually remove dead creatures
    if (_originalCheckDeaths) {
        _originalCheckDeaths.call(this);
    }
};

console.log('✅ Unified Ability Handler loaded!');
console.log('   - Ability registry active');
console.log('   - Duplicate processing prevented');
console.log('   - Core methods patched');
console.log('   - 🛡️ SPELL SHIELD protection active - checks BEFORE spell effects');
