// Fix for card abilities not displaying
console.log('[FIX] Card Abilities Fix Loading...');

// Wait for all dependencies to load
function fixCardAbilities() {
    // Ensure ABILITY_DESCRIPTIONS is available globally
    if (!window.ABILITY_DESCRIPTIONS) {
        console.error('[FIX] ABILITY_DESCRIPTIONS not loaded!');
        return;
    }
    
    // Override the Card constructor to ensure abilities are preserved
    const OriginalCard = window.Card;
    
    window.Card = class Card extends OriginalCard {
        constructor(template) {
            // Call parent constructor
            super(template);
            
            // Double-check ability is set
            if (template.ability && !this.ability) {
                this.ability = template.ability;
                console.log(`[FIX] Restored ability "${template.ability}" to ${this.name}`);
            }
            
            // Ensure ability description is accessible
            this.abilityDescription = window.ABILITY_DESCRIPTIONS[this.ability] || '';
        }
    };
    
    // Fix createCardElement to properly display abilities
    const originalCreateCardElement = window.ui ? window.ui.createCardElement : null;
    
    if (window.ui && window.ui.createCardElement) {
        window.ui.createCardElement = function(card, isPlayerCard = true, onField = false, clickHandler = null) {
            // Ensure card has ability property
            if (card && !card.ability && window.ALL_CARDS) {
                // Try to find the card in ALL_CARDS and get its ability
                const cardData = window.ALL_CARDS.find(c => c.name === card.name);
                if (cardData && cardData.ability) {
                    card.ability = cardData.ability;
                    console.log(`[FIX] Restored ability "${cardData.ability}" for display of ${card.name}`);
                }
            }
            
            // Call original function
            const element = originalCreateCardElement.call(this, card, isPlayerCard, onField, clickHandler);
            
            // Ensure ability is displayed
            const descEl = element.querySelector('.card-description');
            if (descEl && card.ability) {
                descEl.textContent = card.ability;
                descEl.title = window.ABILITY_DESCRIPTIONS[card.ability] || 'Special ability';
            }
            
            return element;
        };
    }
    
    // Also expose createCardElement globally for older code
    window.createCardElement = window.ui.createCardElement;
    
    console.log('[FIX] Card Abilities Fix Applied!');
    
    // Verify fix with a test card
    if (window.ALL_CARDS && window.ALL_CARDS.length > 0) {
        const testCard = window.ALL_CARDS.find(c => c.name === 'Fire Drake');
        if (testCard) {
            console.log(`[FIX TEST] Fire Drake ability: "${testCard.ability}"`);
            const testCardObj = new window.Card(testCard);
            console.log(`[FIX TEST] Fire Drake Card object ability: "${testCardObj.ability}"`);
        }
    }
}

// Apply fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixCardAbilities);
} else {
    // DOM already loaded, apply fix after a short delay to ensure all scripts are loaded
    setTimeout(fixCardAbilities, 100);
}

// Also try to apply fix immediately in case everything is already loaded
try {
    fixCardAbilities();
} catch (e) {
    console.log('[FIX] Will retry ability fix after page loads:', e.message);
}
