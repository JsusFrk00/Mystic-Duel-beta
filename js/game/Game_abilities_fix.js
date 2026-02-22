// Additional ability handlers to add to Game.js
// This file contains the missing ability implementations

export const AbilityHandlers = {
    // Complete handleEnterPlayAbilities function
    handleCompleteEnterPlayAbilities(card, player, field) {
        const ability = card.ability;
        
        switch(ability) {
            case 'Draw a card':
            case 'Draw 2 cards':
            case 'Draw 3 cards':
                const drawCount = parseInt(ability.match(/\d+/)?.[0] || 1);
                for (let i = 0; i < drawCount; i++) {
                    this.drawCard(player);
                }
                break;
                
            case 'Battlecry: Damage':
                if (player === 'ai') {
                    this.dealDamage('player', 2);
                } else {
                    this.addLog("Battlecry triggered! Deal 2 damage.");
                    // Should trigger targeting
                }
                break;
                
            case 'AOE damage':
                const enemyField = player === 'player' ? this.aiField : this.playerField;
                enemyField.forEach(c => {
                    c.health -= 2;
                    this.addLog(`${c.name} takes 2 damage from AOE!`);
                });
                this.checkCreatureDeaths();
                break;
                
            case 'Summon skeletons':
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
                break;
                
            case 'Summon nature':
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
                break;
                
            case 'Divine Shield':
                card.divineShield = true;
                this.addLog(`${card.name} has Divine Shield!`);
                break;
                
            case 'Stealth':
                card.stealth = true;
                this.addLog(`${card.name} is stealthed!`);
                break;
                
            case 'Spell Shield':
                card.spellShield = true;
                this.addLog(`${card.name} has Spell Shield!`);
                break;
                
            case 'Taunt, Immune':
                card.immune = true;
                card.taunt = true;
                this.addLog(`${card.name} is Immune and has Taunt!`);
                break;
                
            case 'Resurrect all':
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
                break;
                
            case 'Destroy all':
                // Dragon Emperor ability - destroy all other creatures
                [...this.playerField, ...this.aiField].forEach(c => {
                    if (c !== card && !c.immune) {
                        c.health = 0;
                    }
                });
                this.addLog("All other creatures destroyed!");
                this.checkCreatureDeaths();
                break;
                
            case 'Destroy hand':
                // Void Walker ability
                const enemyHand = player === 'player' ? this.aiHand : this.playerHand;
                const discarded = enemyHand.length;
                enemyHand.length = 0;
                this.addLog(`Enemy discarded ${discarded} cards!`);
                break;
                
            case 'Heal all allies':
                // Angel of Light ability
                field.forEach(c => {
                    c.health = c.maxHealth;
                });
                this.addLog("All allies healed to full!");
                break;
                
            case 'Rewind turn':
                // Time Lord ability
                this.rewindTurn();
                break;
                
            case 'Double spell damage':
                // Archmage Solarius
                this.addLog(`${card.name} doubles spell damage!`);
                break;
                
            case 'Instant kill':
                // Death's Shadow
                card.instantKill = true;
                this.addLog(`${card.name} destroys any creature it damages!`);
                break;
                
            case 'Random chaos':
                // World Tree effect on summon
                this.handleRandomChaos(player);
                break;
                
            // Flying, Reach, and other passive abilities are handled elsewhere
        }
    },
    
    // Complete spell handlers
    handleCompleteSpell(card, player, target = null) {
        const ability = card.ability;
        
        // Handle all spell types
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
        } else if (ability === 'Extra turn') {
            // Time Warp
            this.handleExtraTurn(player);
        } else if (ability === 'Random chaos') {
            // Chaos Orb
            this.handleRandomChaos(player);
        }
    },
    
    // Enhanced creature combat
    handleEnhancedCombat(attacker, target) {
        if (target.immune || target.tempImmune) {
            this.addLog(`${target.name} is Immune and cannot be damaged!`);
            return;
        }
        
        let attackerDamage = attacker.attack;
        let targetDamage = target.attack;
        
        // Handle immunity and Divine Shield
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
            target.health -= attackerDamage;
            if (target.health > 0) {
                attacker.health -= targetDamage;
            }
        } else if (target.ability === 'First Strike' && !attacker.ability?.includes('First Strike')) {
            attacker.health -= targetDamage;
            if (attacker.health > 0) {
                target.health -= attackerDamage;
            }
        } else {
            // Normal combat
            target.health -= attackerDamage;
            attacker.health -= targetDamage;
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
        
        // Handle Enrage
        if (attacker.ability === 'Enrage' && attacker.health > 0 && targetDamage > 0) {
            attacker.attack += 2;
            this.addLog(`${attacker.name} enrages! +2 attack!`);
        }
        
        // Handle Trample
        if (attacker.ability === 'Trample' && target.health <= 0) {
            const excess = Math.abs(target.health);
            const enemyPlayer = this.currentTurn === 'player' ? 'ai' : 'player';
            if (excess > 0) {
                this.dealDamage(enemyPlayer, excess);
                this.addLog(`Trample deals ${excess} excess damage!`);
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
    },
    
    // Check valid attack targets
    canAttackTarget(attacker, target, isTargetCreature = false) {
        // Check Rush restriction
        if (attacker.canOnlyAttackCreatures && !isTargetCreature) {
            this.addLog(`${attacker.name} with Rush can only attack creatures this turn!`);
            return false;
        }
        
        // Check Taunt
        const enemyField = this.currentTurn === 'player' ? this.aiField : this.playerField;
        const taunts = enemyField.filter(c => c.ability === 'Taunt' || c.taunt);
        
        if (taunts.length > 0 && isTargetCreature) {
            if (!target.ability?.includes('Taunt') && !target.taunt) {
                this.addLog("Must attack Taunt creatures first!");
                return false;
            }
        } else if (taunts.length > 0 && !isTargetCreature) {
            this.addLog("Must attack Taunt creatures first!");
            return false;
        }
        
        // Check Stealth
        if (isTargetCreature && target.stealth) {
            this.addLog("Can't attack stealthed creatures!");
            return false;
        }
        
        // Check Flying
        if (isTargetCreature && target.ability === 'Flying') {
            if (attacker.ability !== 'Flying' && attacker.ability !== 'Reach') {
                this.addLog("Can't reach flying creatures without Flying or Reach!");
                return false;
            }
        }
        
        // Check Windfury limits
        if (attacker.ability === 'Windfury' && attacker.windfuryUsed) {
            this.addLog(`${attacker.name} already attacked twice this turn!`);
            return false;
        }
        
        // Check Double Strike limits
        if (attacker.ability === 'Double Strike' && attacker.doubleStrikeUsed) {
            this.addLog(`${attacker.name} already used Double Strike!`);
            return false;
        }
        
        return true;
    },
    
    // Handle Burn damage at turn start
    handleBurnDamage(player) {
        const field = player === 'player' ? this.playerField : this.aiField;
        const enemyField = player === 'player' ? this.aiField : this.playerField;
        
        const burners = field.filter(c => c.ability === 'Burn');
        if (burners.length > 0) {
            const burnDamage = burners.length;
            const target = player === 'player' ? 'ai' : 'player';
            this.dealDamage(target, burnDamage);
            this.addLog(`Burn deals ${burnDamage} damage!`);
        }
    }
};
