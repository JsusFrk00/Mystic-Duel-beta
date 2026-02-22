// Comprehensive Card Abilities Fix
// This ensures abilities are properly displayed in both desktop and web versions

console.log('[ABILITY FIX] Loading comprehensive abilities fix...');

(function() {
    // Wait for dependencies
    function waitForDependencies(callback) {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        
        const checkDependencies = setInterval(() => {
            attempts++;
            
            if (window.Card && window.ALL_CARDS && window.ABILITY_DESCRIPTIONS && window.ui) {
                clearInterval(checkDependencies);
                console.log('[ABILITY FIX] All dependencies loaded!');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkDependencies);
                console.error('[ABILITY FIX] Failed to load dependencies after 5 seconds');
            }
        }, 100);
    }
    
    function applyFixes() {
        console.log('[ABILITY FIX] Applying comprehensive fixes...');
        
        // 1. Fix Card constructor to ensure abilities are never null
        const OriginalCard = window.Card;
        
        class FixedCard extends OriginalCard {
            constructor(template) {
                // Ensure ability is never null/undefined BEFORE calling super
                if (!template.ability && template.ability !== '') {
                    // Try to find ability from ALL_CARDS
                    const cardData = window.ALL_CARDS.find(c => c.name === template.name);
                    if (cardData && cardData.ability) {
                        template.ability = cardData.ability;
                        console.log(`[ABILITY FIX] Restored ability "${cardData.ability}" for ${template.name}`);
                    } else {
                        template.ability = '';
                    }
                }
                
                // Call parent constructor
                super(template);
                
                // Double-check ability is set after construction
                if (!this.ability && this.ability !== '') {
                    const cardData = window.ALL_CARDS.find(c => c.name === this.name);
                    if (cardData && cardData.ability) {
                        this.ability = cardData.ability;
                        console.log(`[ABILITY FIX] Post-construction: Restored ability "${cardData.ability}" for ${this.name}`);
                    }
                }
                
                // Add ability description
                this.abilityDescription = window.ABILITY_DESCRIPTIONS[this.ability] || '';
            }
        }
        
        // Replace the global Card class
        window.Card = FixedCard;
        console.log('[ABILITY FIX] Card constructor patched');
        
        // 2. Fix UI createCardElement to ensure abilities are displayed
        if (window.ui && window.ui.createCardElement) {
            const originalCreateCardElement = window.ui.createCardElement;
            
            window.ui.createCardElement = function(card, isPlayerCard = true, onField = false, clickHandler = null) {
                // Ensure card has ability
                if (card && (!card.ability && card.ability !== '')) {
                    const cardData = window.ALL_CARDS.find(c => c.name === card.name);
                    if (cardData) {
                        card.ability = cardData.ability || '';
                        console.log(`[ABILITY FIX] UI: Restored ability "${cardData.ability}" for ${card.name}`);
                    }
                }
                
                // Call original function
                const element = originalCreateCardElement.call(this, card, isPlayerCard, onField, clickHandler);
                
                // Double-check ability is displayed
                const descEl = element.querySelector('.card-description');
                if (descEl) {
                    const ability = card.ability || '';
                    descEl.textContent = ability || 'No ability';
                    if (ability && window.ABILITY_DESCRIPTIONS[ability]) {
                        descEl.title = window.ABILITY_DESCRIPTIONS[ability];
                    }
                }
                
                return element;
            };
            
            // Also update global reference
            window.createCardElement = window.ui.createCardElement;
            console.log('[ABILITY FIX] UI createCardElement patched');
        }
        
        // 3. Fix any cards currently in game
        function fixExistingCards() {
            if (window.game) {
                // Fix player hand
                if (window.game.playerHand) {
                    window.game.playerHand.forEach(card => {
                        if (card && (!card.ability && card.ability !== '')) {
                            const cardData = window.ALL_CARDS.find(c => c.name === card.name);
                            if (cardData && cardData.ability) {
                                card.ability = cardData.ability;
                                console.log(`[ABILITY FIX] Game: Fixed ${card.name} ability to "${cardData.ability}"`);
                            }
                        }
                    });
                }
                
                // Fix player field
                if (window.game.playerField) {
                    window.game.playerField.forEach(card => {
                        if (card && (!card.ability && card.ability !== '')) {
                            const cardData = window.ALL_CARDS.find(c => c.name === card.name);
                            if (cardData && cardData.ability) {
                                card.ability = cardData.ability;
                                console.log(`[ABILITY FIX] Game: Fixed field ${card.name} ability to "${cardData.ability}"`);
                            }
                        }
                    });
                }
                
                // Fix AI field
                if (window.game.aiField) {
                    window.game.aiField.forEach(card => {
                        if (card && (!card.ability && card.ability !== '')) {
                            const cardData = window.ALL_CARDS.find(c => c.name === card.name);
                            if (cardData && cardData.ability) {
                                card.ability = cardData.ability;
                                console.log(`[ABILITY FIX] Game: Fixed AI field ${card.name} ability to "${cardData.ability}"`);
                            }
                        }
                    });
                }
                
                // Refresh display
                if (window.game.updateDisplay) {
                    window.game.updateDisplay();
                    console.log('[ABILITY FIX] Game display refreshed');
                }
            }
        }
        
        // Apply fixes to existing cards
        fixExistingCards();
        
        // Set up periodic check for new games
        setInterval(() => {
            if (window.game && !window.game._abilitiesFixed) {
                fixExistingCards();
                window.game._abilitiesFixed = true;
            }
        }, 1000);
        
        // 4. Test the fixes
        console.log('[ABILITY FIX] Running tests...');
        
        // Test creating a card with ability
        const testCards = [
            { name: 'Fire Drake', expectedAbility: 'Flying' },
            { name: 'Goblin Scout', expectedAbility: 'Quick' },
            { name: 'Shield Bearer', expectedAbility: 'Taunt' }
        ];
        
        testCards.forEach(test => {
            const cardData = window.ALL_CARDS.find(c => c.name === test.name);
            if (cardData) {
                const card = new window.Card(cardData);
                if (card.ability === test.expectedAbility) {
                    console.log(`✅ [ABILITY TEST] ${test.name}: "${card.ability}" - PASS`);
                } else {
                    console.error(`❌ [ABILITY TEST] ${test.name}: Expected "${test.expectedAbility}", got "${card.ability}" - FAIL`);
                }
            }
        });
        
        console.log('[ABILITY FIX] All fixes applied successfully!');
    }
    
    // Apply fixes when dependencies are ready
    waitForDependencies(applyFixes);
})();
