// Card Display Utilities - v3.0
// Helper functions for rendering cards consistently

console.log('🔄 card-display-utils.js loading...');

window.cardDisplayUtils = {
    // Get name length category for dynamic font sizing
    getNameLengthCategory(name) {
        const length = name.length;
        if (length <= 12) return 'short';
        if (length <= 15) return 'medium';
        if (length <= 18) return 'long';
        return 'very-long';
    },

    // Get abbreviated ability text
    getDisplayAbility(card) {
        if (!window.cardTextAbbreviator) {
            return card.ability || '';
        }
        
        let displayText = window.cardTextAbbreviator.getAbbreviatedText(card.ability, card.type);
        
        // v3.0: Add splash indicator for splash-friendly cards
        if (card.splashFriendly && card.splashBonus) {
            displayText = displayText || 'See Text';
            // Add splash indicator
            if (card.type === 'spell' && displayText.length < 15) {
                displayText += ' [Splash]';
            } else if (card.type === 'creature' && displayText !== 'See Text') {
                displayText += ' [S]';
            }
        }
        
        return displayText;
    },

    // Build card name HTML with dynamic sizing
    buildCardNameHTML(name) {
        const lengthCategory = this.getNameLengthCategory(name);
        return `<div class="card-name" data-name-length="${lengthCategory}">${name}</div>`;
    }
};

console.log('✅ Card display utilities loaded');
