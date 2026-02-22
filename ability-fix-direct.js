// Direct ability fix - run this after game starts
console.log('[ABILITY FIX] Starting direct ability restoration...');

// Function to check and log card data
function checkCardData() {
    console.log('=== CHECKING CARD DATA ===');
    
    // Check if ALL_CARDS is loaded
    if (!window.ALL_CARDS) {
        console.error('ALL_CARDS not loaded!');
        return false;
    }
    
    // Check sample cards
    const sampleCards = ['Goblin Scout', 'Fire Drake', 'Shield Bearer', 'Lightning Bolt'];
    sampleCards.forEach(name => {
        const card = window.ALL_CARDS.find(c => c.name === name);
        if (card) {
            console.log(`${name}: ability = "${card.ability}"`);
        } else {
            console.warn(`${name} not found in ALL_CARDS`);
        }
    });
    
    return true;
}

// Function to fix abilities in current game
function fixCurrentGameAbilities() {
    if (!window.game) {
        console.warn('No game active');
        return;
    }
    
    console.log('=== FIXING CURRENT GAME ===');
    
    // Fix player hand
    window.game.playerHand.forEach(card => {
        const sourceCard = window.ALL_CARDS.find(c => c.name === card.name);
        if (sourceCard && sourceCard.ability && !card.ability) {
            console.log(`Fixing ${card.name}: adding ability "${sourceCard.ability}"`);
            card.ability = sourceCard.ability;
        }
    });
    
    // Fix AI hand
    window.game.aiHand.forEach(card => {
        const sourceCard = window.ALL_CARDS.find(c => c.name === card.name);
        if (sourceCard && sourceCard.ability && !card.ability) {
            console.log(`Fixing AI ${card.name}: adding ability "${sourceCard.ability}"`);
            card.ability = sourceCard.ability;
        }
    });
    
    // Fix fields
    [...window.game.playerField, ...window.game.aiField].forEach(card => {
        const sourceCard = window.ALL_CARDS.find(c => c.name === card.name);
        if (sourceCard && sourceCard.ability && !card.ability) {
            console.log(`Fixing field ${card.name}: adding ability "${sourceCard.ability}"`);
            card.ability = sourceCard.ability;
        }
    });
    
    // Update display
    if (window.game.updateDisplay) {
        window.game.updateDisplay();
        console.log('Display updated');
    }
}

// Override Card constructor to ensure abilities are preserved
const OriginalCard = window.Card;
window.Card = class Card extends OriginalCard {
    constructor(template) {
        // Log what we're receiving
        if (template.name === 'Goblin Scout' || template.name === 'Fire Drake') {
            console.log(`[CARD CONSTRUCTOR] Creating ${template.name} with ability: "${template.ability}"`);
        }
        
        // Call original constructor
        super(template);
        
        // Force ability preservation
        if (template && template.ability !== undefined) {
            this.ability = template.ability;
        }
        
        // Ensure ability is never undefined
        if (this.ability === undefined || this.ability === null) {
            this.ability = '';
        }
    }
};

// Check and fix on load
setTimeout(() => {
    checkCardData();
    
    // If game exists, fix it
    if (window.game) {
        fixCurrentGameAbilities();
    }
}, 1000);

// Also make functions globally available
window.checkCardData = checkCardData;
window.fixCurrentGameAbilities = fixCurrentGameAbilities;

console.log('[ABILITY FIX] Fix loaded. Use checkCardData() and fixCurrentGameAbilities() to diagnose/fix');
