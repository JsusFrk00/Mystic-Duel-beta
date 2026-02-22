// Fix for missing deathrattle abilities in Game.js
// DISABLED: v3-abilities-complete.js now handles all deathrattles
// This file was causing issues by overriding checkCreatureDeaths with .filter()
// which created new arrays and broke spell summoning

console.log('⚠️ fix-deathrattle-abilities.js DISABLED - using v3-abilities-complete.js instead');

/* DISABLED - conflicts with v3-abilities-complete.js
    
    // Override with enhanced version that handles ALL deathrattle types
    window.Game.prototype.checkCreatureDeaths = function() {
        // Check player creatures
        this.playerField = this.playerField.filter(c => {
            if (c.health <= 0) {
                this.addLog(c.name + ' was destroyed!');
                
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
                
                // Handle all deathrattle effects
                if (c.ability && c.ability.includes('Deathrattle:')) {
                    // Extract the deathrattle effect
                    const effect = c.ability.substring(c.ability.indexOf('Deathrattle:') + 12).trim();
                    
                    if (effect.includes('Draw')) {
                        this.drawCard('player');
                        this.addLog("Deathrattle: Drew a card!");
                    }
                    else if (effect.includes('Deal') && effect.includes('damage')) {
                        // Extract damage amount - matches patterns like "Deal 2 damage", "Deal 3 damage to all enemies", etc.
                        const damageMatch = effect.match(/Deal (\d+) damage/i);
                        if (damageMatch) {
                            const damage = parseInt(damageMatch[1]);
                            
                            if (effect.includes('to enemy player') || effect.includes('to opponent')) {
                                this.dealDamage('ai', damage);
                                this.addLog('Deathrattle: Deals ' + damage + ' damage to opponent!');
                            }
                            else if (effect.includes('to all enemies')) {
                                this.dealDamage('ai', damage);
                                for (var i = 0; i < this.aiField.length; i++) {
                                    var enemy = this.aiField[i];
                                    var actualDamage = enemy.takeDamage ? enemy.takeDamage(damage) : (enemy.health -= damage, damage);
                                    if (actualDamage > 0) {
                                        this.addLog(enemy.name + ' takes ' + actualDamage + ' damage from deathrattle!');
                                    }
                                }
                                this.addLog('Deathrattle: Deals ' + damage + ' damage to all enemies!');
                                // DON'T call checkCreatureDeaths here - will be called after all deathrattles process
                            }
                            else {
                                // Generic damage - hit opponent
                                this.dealDamage('ai', damage);
                                this.addLog('Deathrattle: Deals ' + damage + ' damage!');
                            }
                        }
                    }
                    else if (effect.includes('Summon')) {
                        // Handle summoning effects
                        const summonMatch = effect.match(/Summon a? (\d+)\/(\d+) (.+)/i);
                        if (summonMatch && this.playerField.length < 7) {
                            const attack = parseInt(summonMatch[1]);
                            const health = parseInt(summonMatch[2]);
                            const tokenName = summonMatch[3];
                            const token = new window.Card({
                                name: tokenName,
                                cost: 0,
                                type: "creature",
                                attack: attack,
                                health: health,
                                ability: "",
                                emoji: "💀",
                                rarity: "common"
                            });
                            token.tapped = true;
                            this.playerField.push(token);
                            this.addLog('Deathrattle: Summoned ' + tokenName + '!');
                        }
                    }
                    else if (effect.includes('enemy loses') && effect.includes('health')) {
                        // Handle health loss effects
                        const lossMatch = effect.match(/enemy loses (\d+) health/i);
                        if (lossMatch) {
                            const healthLoss = parseInt(lossMatch[1]);
                            this.dealDamage('ai', healthLoss);
                            this.addLog('Deathrattle: Enemy loses ' + healthLoss + ' health!');
                        }
                    }
                }
                
                // Handle Resurrect
                if (c.ability === 'Resurrect') {
                    const newCard = new window.Card({
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
                        this.addLog(c.name + ' returns to hand!');
                    }
                }
                
                return false;
            }
            return true;
        });
        
        // Check AI creatures (same deathrattle handling)
        this.aiField = this.aiField.filter(c => {
            if (c.health <= 0) {
                this.addLog(c.name + ' was destroyed!');
                
                // Add to graveyard
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
                
                // Handle all deathrattle effects for AI
                if (c.ability && c.ability.includes('Deathrattle:')) {
                    const effect = c.ability.substring(c.ability.indexOf('Deathrattle:') + 12).trim();
                    
                    if (effect.includes('Draw')) {
                        this.drawCard('ai');
                    }
                    else if (effect.includes('Deal') && effect.includes('damage')) {
                        const damageMatch = effect.match(/Deal (\d+) damage/i);
                        if (damageMatch) {
                            const damage = parseInt(damageMatch[1]);
                            
                            if (effect.includes('to enemy player') || effect.includes('to opponent')) {
                                this.dealDamage('player', damage);
                                this.addLog('Deathrattle: Deals ' + damage + ' damage to you!');
                            }
                            else if (effect.includes('to all enemies')) {
                                this.dealDamage('player', damage);
                                for (var i = 0; i < this.playerField.length; i++) {
                                    var enemy = this.playerField[i];
                                    var actualDamage = enemy.takeDamage ? enemy.takeDamage(damage) : (enemy.health -= damage, damage);
                                    if (actualDamage > 0) {
                                        this.addLog(enemy.name + ' takes ' + actualDamage + ' damage from deathrattle!');
                                    }
                                }
                                this.addLog('Deathrattle: Deals ' + damage + ' damage to all enemies!');
                                // DON'T call checkCreatureDeaths here - will be called after all deathrattles process
                            }
                            else {
                                this.dealDamage('player', damage);
                                this.addLog('Deathrattle: Deals ' + damage + ' damage!');
                            }
                        }
                    }
                    else if (effect.includes('Summon')) {
                        const summonMatch = effect.match(/Summon a? (\d+)\/(\d+) (.+)/i);
                        if (summonMatch && this.aiField.length < 7) {
                            const attack = parseInt(summonMatch[1]);
                            const health = parseInt(summonMatch[2]);
                            const tokenName = summonMatch[3];
                            const token = new window.Card({
                                name: tokenName,
                                cost: 0,
                                type: "creature",
                                attack: attack,
                                health: health,
                                ability: "",
                                emoji: "💀",
                                rarity: "common"
                            });
                            token.tapped = true;
                            this.aiField.push(token);
                        }
                    }
                    else if (effect.includes('enemy loses') && effect.includes('health')) {
                        const lossMatch = effect.match(/enemy loses (\d+) health/i);
                        if (lossMatch) {
                            const healthLoss = parseInt(lossMatch[1]);
                            this.dealDamage('player', healthLoss);
                        }
                    }
                }
                
                // Handle Resurrect
                if (c.ability === 'Resurrect') {
                    const newCard = new window.Card({
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
        
        // Check for chain deaths from deathrattle damage
        // Only check if we actually processed any deathrattles that dealt damage
        const hasDeadCreatures = this.playerField.some(c => c.health <= 0) || 
                                 this.aiField.some(c => c.health <= 0);
        if (hasDeadCreatures) {
            // Use setTimeout to avoid immediate recursion
            setTimeout(() => {
                if (this.checkCreatureDeaths) {
                    this.checkCreatureDeaths();
                }
            }, 10);
        }
    };
    
    console.log('✅ Deathrattle fixes applied successfully!');
    console.log('   - Lava Hound will now deal 2 damage to opponent when killed');
    console.log('   - All "Deathrattle: Deal X damage" effects now work');
    console.log('   - Summoning and health loss deathrattles also supported');
} else {
    console.warn('⚠️ Game class not found yet. Load this script AFTER Game.js');
}
*/
