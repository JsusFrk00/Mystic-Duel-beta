// Debug script to check why abilities aren't showing
(function() {
    console.log('🔍 ABILITY DEBUG: Checking why abilities are not showing...');
    
    // Wait for game to be ready
    setTimeout(() => {
        if (window.ALL_CARDS) {
            // Check specific cards that should have abilities
            const testCards = ['Fire Drake', 'Shield Bearer', 'Heal', 'Goblin Scout', 'Rising Phoenix'];
            
            console.log('\n=== CHECKING CARD DATA ===');
            testCards.forEach(cardName => {
                const cardData = window.ALL_CARDS.find(c => c.name === cardName);
                if (cardData) {
                    console.log(`${cardName}:`);
                    console.log(`  - ability in data: "${cardData.ability}"`);
                    console.log(`  - full card data:`, cardData);
                    
                    // Try creating a card instance
                    if (window.Card) {
                        const instance = new window.Card(cardData);
                        console.log(`  - ability after creation: "${instance.ability}"`);
                    }
                }
            });
        }
        
        // Check cards in the player's hand if game is running
        if (window.game && window.game.playerHand) {
            console.log('\n=== CARDS IN PLAYER HAND ===');
            window.game.playerHand.forEach((card, index) => {
                console.log(`Card ${index + 1}: ${card.name}`);
                console.log(`  - ability: "${card.ability}"`);
                console.log(`  - full card:`, card);
            });
        }
        
        // Check how createCardElement displays abilities
        if (window.game && window.game.createCardElement) {
            console.log('\n=== CHECKING createCardElement ===');
            const testCard = window.ALL_CARDS.find(c => c.name === 'Shield Bearer');
            if (testCard) {
                const cardInstance = new window.Card(testCard);
                console.log('Test card instance:', cardInstance);
                console.log('Ability should be:', testCard.ability);
                console.log('Ability actually is:', cardInstance.ability);
            }
        }
        
    }, 3000);
})();