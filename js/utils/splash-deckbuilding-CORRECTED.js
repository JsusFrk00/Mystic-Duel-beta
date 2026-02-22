// ========================================================================
// SPLASH CARD DECK BUILDING FIX
// ========================================================================
// BUG: splashFriendly cards forced to splash pool, can't be used in main colors
// FIX: Allow splash cards to count as main color if they match
//
// Load AFTER deckbuilder.js

console.log('✨ Loading Splash Card Deck Building Fix...');

// Override validateDeckColors
const _origValidateDeckColors = validateDeckColors;

validateDeckColors = function(deck) {
    let mainColors = new Set();
    let splashCards = [];
    let colorlessCards = [];
    
    // FIRST PASS: Count main colors from non-splash cards only
    deck.forEach(card => {
        if (card.color === 'colorless') {
            colorlessCards.push(card);
            return;
        }
        
        // Only count colors from NON-splashFriendly cards for main colors
        if (!card.splashFriendly) {
            const colors = card.color.split('-');
            colors.forEach(c => mainColors.add(c));
        }
    });
    
    // SECOND PASS: Check splashFriendly cards
    // If their color is NOT in main colors, they're splash (3rd color)
    // If their color IS in main colors, they're regular cards
    deck.forEach(card => {
        if (card.splashFriendly && card.color !== 'colorless') {
            const cardColors = card.color.split('-');
            const isThirdColor = !cardColors.some(c => mainColors.has(c));
            
            if (isThirdColor) {
                // This is a 3rd color - counts as splash
                splashCards.push(card);
                console.log(`[SPLASH FIX] ${card.name} is 3rd color splash`);
            } else {
                // This matches main colors - treat as regular card, add to main colors
                cardColors.forEach(c => mainColors.add(c));
                console.log(`[SPLASH FIX] ${card.name} used as main color`);
            }
        }
    });
    
    console.log(`[SPLASH FIX] Final main colors: ${Array.from(mainColors).join(', ')}`);
    console.log(`[SPLASH FIX] Splash cards (3rd color): ${splashCards.length}`);
    
    // RULE 1: Max 2 main colors
    if (mainColors.size > 2) {
        return { 
            valid: false, 
            error: `Too many main colors! You have ${mainColors.size} colors (${Array.from(mainColors).join(', ')}). Max 2 allowed.` 
        };
    }
    
    // RULE 2: Max 3 splash cards
    if (splashCards.length > 3) {
        return { 
            valid: false, 
            error: `Too many splash cards! You have ${splashCards.length} splash cards. Max 3 allowed.` 
        };
    }
    
    return { valid: true };
};

console.log('✅ Splash Card Deck Building Fix loaded!');
console.log('   ✨ Splash cards can be used in matching color decks');
console.log('   🎨 Example: Cauterize (Crimson) allowed in Crimson decks');
console.log('   🎯 Splash bonuses still work when used as 3rd color');
console.log('   ⚡ Affects all 15 splashFriendly cards');
