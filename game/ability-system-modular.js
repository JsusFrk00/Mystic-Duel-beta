// ========================================================================
// MODULAR ABILITY SYSTEM - Event-Driven Architecture (Updated)
// ========================================================================
// Abilities trigger at specific lifecycle events
// Each event has its own handler that checks for relevant abilities

console.log('🎯 Loading Modular Ability System...');

// ========================================================================
// ABILITY EVENT SYSTEM
// ========================================================================

class AbilityEventSystem {
    constructor(game) {
        this.game = game;
        this.events = new Map(); // Track which events have fired to prevent duplicates
    }
    
    // Generate unique event ID to prevent duplicate processing
    getEventId(eventType, cardName, timestamp = Date.now()) {
        return `${eventType}:${cardName}:${timestamp}`;
    }
    
    // Check if event already processed
    hasProcessed(eventId) {
        return this.events.has(eventId);
    }
    
    // Mark event as processed
    markProcessed(eventId) {
        this.events.set(eventId, Date.now());
        
        // Clean up old events (older than 5 seconds)
        const now = Date.now();
        for (let [id, time] of this.events.entries()) {
            if (now - time > 5000) {
                this.events.delete(id);
            }
        }
    }
    
    // ====================================================================
    // EVENT 1: ON TARGETING (BEFORE spell effects)
    // ====================================================================
    onTargeting(spell, target, caster) {
        console.log(`[EVENT: ON_TARGETING] ${spell.name} → ${target?.name || target}`);
        
        // Can't target if not a creature
        if (!target || target === 'player' || target === 'ai') {
            return { allowed: true }; // Allow targeting player
        }
        
        // CHECK: Spell Shield (blocks spell)
        if (target.spellShield) {
            console.log(`[SPELL SHIELD] ${target.name} blocks ${spell.name}!`);
            target.spellShield = false; // Consume shield
            this.game.addLog(`${target.name}'s Spell Shield blocks the spell!`);
            return { 
                allowed: false, 
                blocked: true, 
                reason: 'Spell Shield' 
            };
        }
        
        // CHECK: Stealth (can't be targeted)
        if (target.stealth) {
            console.log(`[STEALTH] ${target.name} can't be targeted - Stealth active`);
            return { 
                allowed: false, 
                blocked: false, 
                reason: 'Stealth' 
            };
        }
        
        // CHECK: Untargetable
        if (target.untargetable) {
            console.log(`[UNTARGETABLE] ${target.name} can't be targeted`);
            return { 
                allowed: false, 
                blocked: false, 
                reason: 'Untargetable' 
            };
        }
        
        return { allowed: true };
    }
    
    // ====================================================================
    // EVENT 2: ON PLAY (Enter field)
    // ====================================================================
    onPlay(card, player, field) {
        const eventId = this.getEventId('ON_PLAY', card.name);
        if (this.hasProcessed(eventId)) return;
        this.markProcessed(eventId);
        
        console.log(`[EVENT: ON_PLAY] ${card.name}`);
        
        const ability = card.ability;
        if (!ability) return;
        
        // BATTLECRY: Draw cards
        if (ability.includes('Battlecry: Draw') || ability.includes('Draw a card') || ability.includes('Draw 2 cards') || ability.includes('Draw 3 cards')) {
            const drawCount = parseInt(ability.match(/\d+/)?.[0] || 1);
            for (let i = 0; i < drawCount; i++) {
                this.game.drawCard(player);
            }
            this.game.addLog(`${card.name}: Drew ${drawCount} card(s)!`);
        }
        
        // BATTLECRY: Deal damage
        if (ability.includes('Battlecry: Deal') && ability.includes('damage')) {
            const damage = parseInt(ability.match(/Deal (\d+)/)?.[1] || 0);
            if (damage > 0) {
                const enemyPlayer = player === 'player' ? 'ai' : 'player';
                this.game.dealDamage(enemyPlayer, damage);
                this.game.addLog(`${card.name}: Dealt ${damage} damage!`);
            }
        }
        
        // BATTLECRY: Gain health
        if (ability.includes('Battlecry: Gain') && ability.includes('health')) {
            const health = parseInt(ability.match(/Gain (\d+)/)?.[1] || 0);
            if (health > 0) {
                if (player === 'player') {
                    this.game.playerHealth = Math.min(this.game.playerMaxHealth, this.game.playerHealth + health);
                } else {
                    this.game.aiHealth = Math.min(this.game.aiMaxHealth, this.game.aiHealth + health);
                }
                this.game.addLog(`${card.name}: Gained ${health} health!`);
            }
        }
        
        // Set keyword abilities
        if (ability === 'Taunt' || ability.includes('Taunt')) card.taunt = true;
        if (ability === 'Divine Shield') card.divineShield = true;
        if (ability === 'Spell Shield') {
            card.spellShield = true;
            console.log(`[SPELL SHIELD] ${card.name} has Spell Shield active`);
        }
        if (ability === 'Stealth') card.stealth = true;
        
        // Haste effects (can attack immediately)
        if (ability === 'Quick' || ability === 'Charge' || ability === 'Haste') {
            card.tapped = false;
        }
        
        if (ability === 'Rush') {
            card.tapped = false;
            card.justPlayed = true;
            card.canOnlyAttackCreatures = true;
        }
    }
    
    // ====================================================================
    // EVENT 3: BEFORE DAMAGE (Prevention/Reduction)
    // ====================================================================
    beforeDamage(source, target, damageAmount) {
        console.log(`[EVENT: BEFORE_DAMAGE] ${source?.name || source} → ${target.name} (${damageAmount} damage)`);
        
        let actualDamage = damageAmount;
        let prevented = false;
        
        // CHECK: Immune (prevents all damage)
        if (target.immune || target.tempImmune) {
            console.log(`[IMMUNE] ${target.name} is immune - no damage taken`);
            return { damage: 0, prevented: true, reason: 'Immune' };
        }
        
        // CHECK: Divine Shield (prevents all damage once)
        if (target.divineShield && damageAmount > 0) {
            console.log(`[DIVINE SHIELD] ${target.name}'s shield absorbs damage`);
            target.divineShield = false;
            this.game.addLog(`${target.name}'s Divine Shield absorbs the damage!`);
            return { damage: 0, prevented: true, reason: 'Divine Shield' };
        }
        
        return { damage: actualDamage, prevented: false };
    }
    
    // ====================================================================
    // EVENT 4: ON TAKING DAMAGE (Reactive abilities)
    // ====================================================================
    onTakingDamage(target, damageAmount, source) {
        if (damageAmount <= 0) return;
        
        console.log(`[EVENT: ON_TAKING_DAMAGE] ${target.name} took ${damageAmount} damage`);
        
        const ability = target.ability;
        if (!ability) return;
        
        // Determine which field the target belongs to
        const targetOwner = this.game.playerField.includes(target) ? 'player' : 'ai';
        const targetField = targetOwner === 'player' ? this.game.playerField : this.game.aiField;
        
        // ENRAGE: Gain attack when damaged
        if (ability === 'Enrage' && target.health > 0) {
            if (!target.enraged) {
                target.enraged = true;
                target.attack += 2;
                this.game.addLog(`${target.name} enrages! +2 attack!`);
            }
        }
        
        // Reactive damage abilities
        if (ability.includes('Whenever this takes damage, deal')) {
            const reactDamage = parseInt(ability.match(/deal (\d+)/i)?.[1] || 0);
            if (reactDamage > 0 && source && source.health > 0) {
                source.takeDamage(reactDamage);
                this.game.addLog(`${target.name} deals ${reactDamage} damage back!`);
            }
        }
        
        // VERDANT HYDRA: Summon when damaged (BEFORE death check)
        if (ability.includes('Whenever this takes damage, summon a 2/2 Verdant Spawn')) {
            console.log(`[ON_TAKING_DAMAGE] Verdant Hydra summon trigger - health: ${target.health}, field: ${targetField.length}/7`);
            if (target.health > 0 && targetField.length < 7) {
                const spawn = new window.Card({
                    name: "Verdant Spawn", 
                    cost: 0, 
                    type: "creature", 
                    attack: 2, 
                    health: 2,
                    ability: "", 
                    emoji: "🐍", 
                    rarity: "common", 
                    color: "verdant"
                });
                spawn.tapped = true;
                targetField.push(spawn);
                this.game.addLog(`${target.name} summoned a 2/2 Verdant Spawn!`);
                console.log(`[ON_TAKING_DAMAGE] Spawn summoned successfully`);
            } else {
                console.log(`[ON_TAKING_DAMAGE] Cannot summon - dead: ${target.health <= 0}, full: ${targetField.length >= 7}`);
            }
        }
    }
    
    // ====================================================================
    // EVENT 5: ON DEALING DAMAGE (Post-damage effects)
    // ====================================================================
    onDealingDamage(source, target, damageDealt) {
        if (damageDealt <= 0) return;
        
        console.log(`[EVENT: ON_DEALING_DAMAGE] ${source.name} dealt ${damageDealt} damage`);
        
        const ability = source.ability;
        if (!ability) return;
        
        // LIFESTEAL: Heal when dealing damage
        if (ability.includes('Lifesteal') || ability.includes('Lifelink')) {
            const owner = this.game.playerField.includes(source) ? 'player' : 'ai';
            if (owner === 'player') {
                this.game.playerHealth = Math.min(this.game.playerMaxHealth, this.game.playerHealth + damageDealt);
            } else {
                this.game.aiHealth = Math.min(this.game.aiMaxHealth, this.game.aiHealth + damageDealt);
            }
            this.game.addLog(`Lifesteal: Healed for ${damageDealt}!`);
        }
    }
    
    // ====================================================================
    // EVENT 6: ON ATTACK (Attack triggers)
    // ====================================================================
    onAttack(attacker, target, attackerOwner) {
        const eventId = this.getEventId('ON_ATTACK', attacker.name);
        if (this.hasProcessed(eventId)) return;
        this.markProcessed(eventId);
        
        console.log(`[EVENT: ON_ATTACK] ${attacker.name} attacks ${target?.name || target}`);
        
        const ability = attacker.ability;
        if (!ability || !ability.includes('Attack Trigger:')) return;
        
        const enemyPlayer = attackerOwner === 'player' ? 'ai' : 'player';
        const enemyField = attackerOwner === 'player' ? this.game.aiField : this.game.playerField;
        
        // Attack Trigger: Deal damage
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
        
        // Attack Trigger: Draw card
        if (ability.includes('Draw a card')) {
            this.game.drawCard(attackerOwner);
            this.game.addLog(`${attacker.name}: Drew a card!`);
        }
    }
    
    // ====================================================================
    // EVENT 7: ON DEATH (Deathrattles)
    // ====================================================================
    onDeath(card, owner) {
        const eventId = this.getEventId('ON_DEATH', card.name);
        if (this.hasProcessed(eventId)) return;
        this.markProcessed(eventId);
        
        console.log(`[EVENT: ON_DEATH] ${card.name}`);
        
        const ability = card.ability;
        if (!ability || !ability.includes('Deathrattle:')) return;
        
        const field = owner === 'player' ? this.game.playerField : this.game.aiField;
        const hand = owner === 'player' ? this.game.playerHand : this.game.aiHand;
        const enemyPlayer = owner === 'player' ? 'ai' : 'player';
        
        // Deathrattle: Draw
        if (ability.includes('Draw a card') || ability === 'Deathrattle: Draw') {
            this.game.drawCard(owner);
            this.game.addLog(`${card.name} deathrattle: Drew a card!`);
        }
        
        // Deathrattle: Deal damage
        if (ability.includes('Deal') && ability.includes('damage')) {
            const damage = parseInt(ability.match(/Deal (\d+)/)?.[1] || 0);
            if (damage > 0) {
                this.game.dealDamage(enemyPlayer, damage);
                this.game.addLog(`${card.name} deathrattle: ${damage} damage!`);
            }
        }
        
        // Deathrattle: Return to hand
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
    }
    
    // ====================================================================
    // EVENT 8: ON SPELL CAST (Spell-reactive abilities)
    // ====================================================================
    onSpellCast(spell, caster) {
        console.log(`[EVENT: ON_SPELL_CAST] ${spell.name}`);
        
        const field = caster === 'player' ? this.game.playerField : this.game.aiField;
        
        // Check all creatures for spell-reactive abilities
        field.forEach(creature => {
            const ability = creature.ability;
            if (!ability) return;
            
            if (ability.includes('Whenever you cast a spell, draw a card')) {
                this.game.drawCard(caster);
                this.game.addLog(`${creature.name}: Drew a card!`);
            }
        });
    }
    
    // ====================================================================
    // EVENT 9: START OF TURN
    // ====================================================================
    onStartOfTurn(player) {
        console.log(`[EVENT: START_OF_TURN] ${player}`);
        
        const field = player === 'player' ? this.game.playerField : this.game.aiField;
        
        field.forEach(creature => {
            const ability = creature.ability;
            if (!ability) return;
            
            // Regenerate: Restore to full health
            if (ability === 'Regenerate' || ability.includes('Regenerate')) {
                creature.health = creature.maxHealth;
            }
            
            // Draw cards each turn
            if (ability.includes('Draw a card each turn')) {
                this.game.drawCard(player);
            }
        });
    }
    
    // ====================================================================
    // EVENT 10: END OF TURN
    // ====================================================================
    onEndOfTurn(player) {
        console.log(`[EVENT: END_OF_TURN] ${player}`);
        
        // NOTE: Burn/Splash damage removed from here
        // Base game.js already handles it in startNewTurn()
        // Having it in both places caused DOUBLE burn damage (2 per turn instead of 1)
        
        // Add other end-of-turn effects here if needed
        // Examples:
        // - Creatures that lose health at end of turn
        // - Temporary buffs that expire
        // - Effects that trigger "at the end of your turn"
    }
}

// ========================================================================
// INTEGRATE WITH GAME CLASS
// ========================================================================

// Add ability system to game instance
Game.prototype._getAbilitySystem = function() {
    if (!this._abilitySystem) {
        this._abilitySystem = new AbilityEventSystem(this);
    }
    return this._abilitySystem;
};

// Store original methods if not already stored
if (!window._originalGameMethods) {
    window._originalGameMethods = {
        playCreature: Game.prototype.playCreature,
        handleEnterPlayAbilities: Game.prototype.handleEnterPlayAbilities,
        handleSpellTargeting: Game.prototype.handleSpellTargeting,
        handleDamageSpell: Game.prototype.handleDamageSpell,
        handleSpell: Game.prototype.handleSpell,
        attack: Game.prototype.attack,
        creatureCombat: Game.prototype.creatureCombat,
        checkCreatureDeaths: Game.prototype.checkCreatureDeaths,
        startNewTurn: Game.prototype.startNewTurn,
        endTurn: Game.prototype.endTurn
    };
}

// ========================================================================
// PATCH: ON PLAY
// ========================================================================
const _originalPlayCreature = Game.prototype.playCreature;
Game.prototype.playCreature = function(card, player, field) {
    // Call original to put creature on field
    if (_originalPlayCreature) {
        _originalPlayCreature.call(this, card, player, field);
    }
    
    // Trigger ON_PLAY event
    this._getAbilitySystem().onPlay(card, player, field);
};

// ========================================================================
// PATCH: ON TARGETING (BEFORE spell execution)
// ========================================================================
const _originalHandleSpellTargeting = Game.prototype.handleSpellTargeting;
Game.prototype.handleSpellTargeting = function(card, isPlayerCard) {
    // Get the pending spell and target
    const spell = this.pendingSpell;
    const target = card; // The card being targeted
    const caster = this.currentTurn;
    
    if (!spell) {
        // No spell pending, call original
        if (_originalHandleSpellTargeting) {
            return _originalHandleSpellTargeting.call(this, card, isPlayerCard);
        }
        return;
    }
    
    // CHECK ON_TARGETING event
    const targetingResult = this._getAbilitySystem().onTargeting(spell, target, caster);
    
    if (!targetingResult.allowed) {
        if (targetingResult.blocked) {
            // Spell Shield blocked it - consume spell but no effect
            console.log('[TARGETING] Spell blocked by Spell Shield - consuming spell');
            
            // Remove spell from hand and spend mana
            const index = this.playerHand.indexOf(spell);
            if (index > -1) {
                this.playerHand.splice(index, 1);
                this.playerMana -= spell.cost;
                this.playerSpellsCount++;
            }
            
            // Clear pending spell
            this.pendingSpell = null;
            this.pendingTargetType = null;
            this.updateDisplay();
            return; // EXIT - spell consumed but blocked
        } else {
            // Can't target (Stealth, etc) - don't consume spell
            this.addLog(`Can't target ${target.name}: ${targetingResult.reason}`);
            return;
        }
    }
    
    // Targeting allowed, proceed with original
    if (_originalHandleSpellTargeting) {
        _originalHandleSpellTargeting.call(this, card, isPlayerCard);
    }
};

// ========================================================================
// PATCH: BEFORE DAMAGE
// ========================================================================
// Override Card.takeDamage to check BEFORE_DAMAGE event
if (window.Card && window.Card.prototype.takeDamage) {
    const _originalTakeDamage = window.Card.prototype.takeDamage;
    window.Card.prototype.takeDamage = function(amount, source) {
        // Get game instance (we need to find it)
        const game = window.game;
        if (!game) {
            // No game instance, use original
            return _originalTakeDamage.call(this, amount, source);
        }
        
        // Trigger BEFORE_DAMAGE event
        const result = game._getAbilitySystem().beforeDamage(source, this, amount);
        
        if (result.prevented) {
            console.log(`[BEFORE_DAMAGE] Damage prevented: ${result.reason}`);
            return 0; // No damage dealt
        }
        
        // Apply damage
        const actualDamage = _originalTakeDamage.call(this, result.damage, source);
        
        // Trigger ON_TAKING_DAMAGE event (while creature is still alive if possible)
        if (actualDamage > 0) {
            game._getAbilitySystem().onTakingDamage(this, actualDamage, source);
        }
        
        // Trigger ON_DEALING_DAMAGE event (for source)
        if (actualDamage > 0 && source && source.name) {
            game._getAbilitySystem().onDealingDamage(source, this, actualDamage);
        }
        
        return actualDamage;
    };
}

// ========================================================================
// PATCH: ON ATTACK
// ========================================================================
const _originalAttack = Game.prototype.attack;
Game.prototype.attack = function(attacker, target) {
    const attackerHadAttacked = attacker.hasAttackedThisTurn;
    
    // Call original attack
    if (_originalAttack) {
        _originalAttack.call(this, attacker, target);
    }
    
    // If attack succeeded, trigger ON_ATTACK event
    if (attacker.hasAttackedThisTurn && !attackerHadAttacked) {
        const owner = this.playerField.includes(attacker) ? 'player' : 'ai';
        this._getAbilitySystem().onAttack(attacker, target, owner);
    }
};

// ========================================================================
// PATCH: ON DEATH
// ========================================================================
const _originalCheckDeaths = Game.prototype.checkCreatureDeaths;
Game.prototype.checkCreatureDeaths = function() {
    // Find dying creatures
    const dyingPlayerCreatures = this.playerField.filter(c => c.health <= 0);
    const dyingAICreatures = this.aiField.filter(c => c.health <= 0);
    
    // Trigger ON_DEATH events BEFORE removing
    dyingPlayerCreatures.forEach(c => {
        this._getAbilitySystem().onDeath(c, 'player');
    });
    dyingAICreatures.forEach(c => {
        this._getAbilitySystem().onDeath(c, 'ai');
    });
    
    // Now remove dead creatures (call original)
    if (_originalCheckDeaths) {
        _originalCheckDeaths.call(this);
    }
};

// ========================================================================
// PATCH: ON SPELL CAST
// ========================================================================
const _originalHandleSpell = Game.prototype.handleSpell;
Game.prototype.handleSpell = function(card, player, target = null) {
    // Trigger ON_SPELL_CAST event
    this._getAbilitySystem().onSpellCast(card, player);
    
    // Proceed with spell effect
    if (_originalHandleSpell) {
        _originalHandleSpell.call(this, card, player, target);
    }
};

// ========================================================================
// PATCH: START OF TURN (No patch needed - just for documentation)
// ========================================================================
// Base game.js already calls startNewTurn which triggers START_OF_TURN event
// Burn damage is handled in base game.js startNewTurn (NOT in modular system)

const _originalStartNewTurn = Game.prototype.startNewTurn;
Game.prototype.startNewTurn = function(player) {
    // Trigger START_OF_TURN event
    this._getAbilitySystem().onStartOfTurn(player);
    
    // Call original (which handles Burn damage)
    if (_originalStartNewTurn) {
        _originalStartNewTurn.call(this, player);
    }
};

// ========================================================================
// PATCH: END OF TURN (No burn damage here - it's in startNewTurn)
// ========================================================================
const _originalEndTurn = Game.prototype.endTurn;
Game.prototype.endTurn = function() {
    // Trigger END_OF_TURN event for current player
    if (this.currentTurn) {
        this._getAbilitySystem().onEndOfTurn(this.currentTurn);
    }
    
    // Call original
    if (_originalEndTurn) {
        _originalEndTurn.call(this);
    }
};

console.log('✅ Modular Ability System loaded!');
console.log('   📋 Event-driven architecture');
console.log('   🎯 10 ability trigger points');
console.log('   🛡️ Spell Shield checks on TARGETING');
console.log('   ⚡ Before/After damage events');
console.log('   💀 Proper death handling');
console.log('   🔥 Burn damage handled by base game (no duplication)');
console.log('   🐍 Verdant Hydra summon-on-damage ability supported');
