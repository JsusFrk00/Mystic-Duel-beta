// Simple fix for abilities not showing on cards
// This ensures abilities are properly preserved when cards are created

(function() {
    console.log('🔧 Applying simple abilities fix...');
    
    // Wait for dependencies
    const checkReady = setInterval(() => {
        if (window.Card && window.ALL_CARDS) {
            clearInterval(checkReady);
            applyFix();
        }
    }, 50);
    
    function applyFix() {
        // Store the original Card constructor
        const OriginalCard = window.Card;
        
        // Override the Card constructor to ensure abilities are preserved
        window.Card = function(template) {
            // Use the original constructor
            OriginalCard.call(this, template);
            
            // CRITICAL FIX: Double-check ability is set correctly
            // Sometimes Object.assign doesn't properly copy the ability
            if (template && template.hasOwnProperty('ability')) {
                this.ability = template.ability;
            }
            
            // Ensure ability is never undefined (should be empty string if no ability)
            if (this.ability === undefined || this.ability === null) {
                this.ability = '';
            }
        };
        
        // Preserve the prototype chain
        window.Card.prototype = OriginalCard.prototype;
        
        // Copy any static properties
        for (let prop in OriginalCard) {
            if (OriginalCard.hasOwnProperty(prop)) {
                window.Card[prop] = OriginalCard[prop];
            }
        }
        
        console.log('✅ Simple abilities fix applied');
        
        // Test to verify abilities are working
        const testCard = window.ALL_CARDS.find(c => c.name === "Goblin Scout");
        if (testCard) {
            const instance = new window.Card(testCard);
            console.log(`🧪 Test: ${instance.name} ability = "${instance.ability}" (expected: "${testCard.ability}")`);
        }
        
        // Count cards with abilities
        let withAbilities = window.ALL_CARDS.filter(c => c.ability && c.ability !== '').length;
        console.log(`📊 ${withAbilities} of ${window.ALL_CARDS.length} cards have abilities defined`);
    }
})();