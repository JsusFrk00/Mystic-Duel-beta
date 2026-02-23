// MASTER ABILITIES FIX - Ensures abilities are ALWAYS displayed
console.log('🎯 MASTER ABILITIES FIX LOADING...');

(function() {
    'use strict';
    
    // Step 1: Verify card data is loaded properly
    function verifyCardData() {
        if (!window.ALL_CARDS) {
            console.error('❌ ALL_CARDS not loaded!');
            return false;
        }
        
        if (!window.ABILITY_DESCRIPTIONS) {
            console.error('❌ ABILITY_DESCRIPTIONS not loaded!');
            return false;
        }
        
        // Check a sample of cards
        const testCards = ['Fire Drake', 'Goblin Scout', 'Shield Bearer'];
        testCards.forEach(name => {
            const card = window.ALL_CARDS.find(c => c.name === name);
            if (card) {
                console.log(`✅ ${name}: ability = "${card.ability}"`);
            } else {
                console.error(`❌ ${name} not found!`);
            }
        });
        
        return true;
    }
    
    // Step 2: Fix the Card constructor to ALWAYS preserve abilities
    function fixCardConstructor() {
        if (!window.Card) {
            console.error('❌ Card class not found!');
            return;
        }
        
        const OriginalCard = window.Card;
        
        window.Card = class Card extends OriginalCard {
            constructor(template) {
                // Ensure template has ability before calling super
                if (template && (!template.ability && template.ability !== '')) {
                    // Look up the ability from ALL_CARDS
                    const cardData = window.ALL_CARDS?.find(c => c.name === template.name);
                    if (cardData && cardData.ability) {
                        template.ability = cardData.ability;
                        console.log(`🔧 Restored ability "${cardData.ability}" for ${template.name}`);
                    } else {
                        template.ability = '';
                    }
                }
                
                // Call parent constructor
                super(template);
                
                // Double-check ability is set after construction
                if (!this.ability && this.ability !== '') {
                    const cardData = window.ALL_CARDS?.find(c => c.name === this.name);
                    if (cardData && cardData.ability) {
                        this.ability = cardData.ability;
                        console.log(`🔧 Post-construction fix: "${cardData.ability}" for ${this.name}`);
                    } else {
                        this.ability = '';
                    }
                }
                
                // Add ability description
                if (this.ability && window.ABILITY_DESCRIPTIONS) {
                    this.abilityDescription = window.ABILITY_DESCRIPTIONS[this.ability] || '';
                }
            }
        };
        
        console.log('✅ Card constructor patched');
    }
    
    // Step 3: Fix the Game's createCardElement method
    function fixGameCreateCardElement() {
        if (!window.Game) {
            console.error('❌ Game class not found!');
            return;
        }
        
        // DON'T override createCardElement - let FORCE-CARD-TEXT-FIX.js handle it
        console.log('✅ Skipping createCardElement override (handled by FORCE-CARD-TEXT-FIX)');
        
        // BUT DO fix the attack function for Bypass Taunt
        const originalAttack = window.Game.prototype.attack;
        
        window.Game.prototype.attack = function(attacker, target) {
            console.log(`[MASTER FIX ATTACK] Called with attacker: ${attacker?.name}, target: ${target?.name || target}`);
            console.log(`[MASTER FIX ATTACK] Attacker ability: "${attacker?.ability}"`);
            
            // Add Cannot be blocked support
            const isTargetCreature = (target !== 'player' && target !== 'ai');
            const cannotBeBlocked = attacker.ability && attacker.ability.includes('Cannot be blocked');
            
            console.log(`[MASTER FIX ATTACK] isTargetCreature: ${isTargetCreature}, cannotBeBlocked: ${cannotBeBlocked}`);
            
            if (cannotBeBlocked && !isTargetCreature) {
                const attackingPlayer = this.playerField.includes(attacker) ? 'player' : 'ai';
                const enemyField = attackingPlayer === 'player' ? this.aiField : this.playerField;
                const taunts = enemyField.filter(c => c.taunt || c.ability === 'Taunt');
                
                console.log(`[CANNOT BE BLOCKED] ${attacker.name} bypassing ${taunts.length} taunts to attack player directly`);
                
                if (taunts.length > 0) {
                    // Temporarily remove taunt
                    const tauntBackup = taunts.map(c => ({c: c, hadTaunt: c.taunt}));
                    taunts.forEach(c => c.taunt = false);
                    
                    // Call original
                    const result = originalAttack.call(this, attacker, target);
                    
                    // Restore taunt
                    tauntBackup.forEach(b => b.c.taunt = b.hadTaunt);
                    return result;
                }
            }
            
            // Call original attack
            console.log(`[MASTER FIX ATTACK] Calling original attack function`);
            return originalAttack.call(this, attacker, target);
        };
        
        console.log('✅ Attack function patched for Bypass Taunt');
    }
    
    // Step 4: Fix existing cards in any active game
    function fixExistingGameCards() {
        if (!window.game) {
            console.log('⏸️ No active game to fix');
            return;
        }
        
        let fixCount = 0;
        
        // Fix all cards in the game
        const allCards = [
            ...window.game.playerHand || [],
            ...window.game.aiHand || [],
            ...window.game.playerField || [],
            ...window.game.aiField || [],
            ...window.game.playerDeck || [],
            ...window.game.aiDeck || []
        ];
        
        allCards.forEach(card => {
            if (card && (!card.ability && card.ability !== '')) {
                const cardData = window.ALL_CARDS?.find(c => c.name === card.name);
                if (cardData && cardData.ability) {
                    card.ability = cardData.ability;
                    fixCount++;
                    console.log(`🛠️ Fixed ${card.name}: "${cardData.ability}"`);
                }
            }
        });
        
        if (fixCount > 0) {
            console.log(`✅ Fixed ${fixCount} cards in active game`);
            
            // Update display to show the fixes
            if (window.game.updateDisplay) {
                window.game.updateDisplay();
                console.log('🎨 Display updated');
            }
        } else {
            console.log('✅ All cards already have abilities');
        }
    }
    
    // Step 5: Monitor for new games and fix them automatically
    function setupGameMonitor() {
        let lastGame = window.game;
        
        setInterval(() => {
            if (window.game && window.game !== lastGame) {
                console.log('🎮 New game detected, applying ability fixes...');
                lastGame = window.game;
                setTimeout(fixExistingGameCards, 100);
            }
        }, 500);
        
        console.log('✅ Game monitor active');
    }
    
    // Step 6: Main initialization function
    function initializeMasterFix() {
        console.log('🚀 Initializing Master Abilities Fix...');
        
        // Wait for dependencies
        let attempts = 0;
        const maxAttempts = 50;
        
        const initInterval = setInterval(() => {
            attempts++;
            
            if (window.Card && window.ALL_CARDS && window.ABILITY_DESCRIPTIONS && window.Game) {
                clearInterval(initInterval);
                
                console.log('✅ All dependencies loaded, applying fixes...');
                
                // Apply all fixes
                verifyCardData();
                fixCardConstructor();
                fixGameCreateCardElement();
                fixExistingGameCards();
                setupGameMonitor();
                
                // Make fix functions globally available
                window.masterAbilityFix = {
                    verify: verifyCardData,
                    fixCards: fixExistingGameCards,
                    fixAll: function() {
                        fixCardConstructor();
                        fixGameCreateCardElement();
                        fixExistingGameCards();
                    }
                };
                
                console.log('🎯 MASTER ABILITIES FIX COMPLETE!');
                console.log('📝 Use window.masterAbilityFix.fixAll() to reapply fixes');
                
            } else if (attempts >= maxAttempts) {
                clearInterval(initInterval);
                console.error('❌ Failed to load dependencies after 5 seconds');
                console.log('Missing:', {
                    Card: !!window.Card,
                    ALL_CARDS: !!window.ALL_CARDS,
                    ABILITY_DESCRIPTIONS: !!window.ABILITY_DESCRIPTIONS,
                    Game: !!window.Game
                });
            }
        }, 100);
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMasterFix);
    } else {
        initializeMasterFix();
    }
})();

console.log('📜 Master Abilities Fix script loaded');
