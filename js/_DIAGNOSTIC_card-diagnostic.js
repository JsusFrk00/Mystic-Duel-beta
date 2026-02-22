// Simple diagnostic to check why cards aren't showing
(function() {
    console.log('🔍 DIAGNOSTIC: Checking card system...');
    
    // Wait a moment for everything to load
    setTimeout(() => {
        console.log('\n=== CHECKING GLOBAL OBJECTS ===');
        console.log('window.ALL_CARDS exists:', !!window.ALL_CARDS);
        if (window.ALL_CARDS) {
            console.log('  - Number of cards:', window.ALL_CARDS.length);
            console.log('  - First card:', window.ALL_CARDS[0]);
        }
        
        console.log('window.Card exists:', !!window.Card);
        if (window.Card) {
            console.log('  - Card is a function:', typeof window.Card === 'function');
        }
        
        console.log('window.Game exists:', !!window.Game);
        console.log('window.storage exists:', !!window.storage);
        if (window.storage && window.storage.playerData) {
            console.log('  - Player gold:', window.storage.playerData.gold);
            console.log('  - Owned cards:', Object.keys(window.storage.playerData.ownedCards).length);
        }
        
        console.log('window.gameManager exists:', !!window.gameManager);
        
        // Test creating a card
        if (window.Card && window.ALL_CARDS && window.ALL_CARDS.length > 0) {
            console.log('\n=== TESTING CARD CREATION ===');
            const testTemplate = window.ALL_CARDS[0];
            console.log('Test template:', testTemplate);
            
            try {
                const testCard = new window.Card(testTemplate);
                console.log('Created card:', testCard);
                console.log('  - name:', testCard.name);
                console.log('  - cost:', testCard.cost);
                console.log('  - ability:', testCard.ability);
                console.log('  - attack:', testCard.attack);
                console.log('  - health:', testCard.health);
            } catch (error) {
                console.error('ERROR creating card:', error);
            }
        }
        
        // Check if game is actually running
        if (window.game) {
            console.log('\n=== GAME STATE ===');
            console.log('Game exists:', !!window.game);
            console.log('Player hand:', window.game.playerHand?.length || 0);
            console.log('Player deck:', window.game.playerDeck?.length || 0);
            console.log('AI hand:', window.game.aiHand?.length || 0);
            console.log('AI deck:', window.game.aiDeck?.length || 0);
        }
        
    }, 2000);
    
    // Also add a button to manually trigger diagnostics
    window.runDiagnostic = function() {
        console.log('=== MANUAL DIAGNOSTIC ===');
        
        if (!window.gameManager || !window.gameManager.startQuickGame) {
            console.error('gameManager.startQuickGame not found!');
            return;
        }
        
        // Try to trace through startQuickGame
        console.log('Attempting to trace startQuickGame...');
        
        // Check owned cards
        if (window.storage && window.storage.playerData) {
            const ownedCards = window.storage.playerData.ownedCards;
            console.log('Owned cards:', ownedCards);
            
            let totalCards = 0;
            for (const [cardName, count] of Object.entries(ownedCards)) {
                totalCards += count;
            }
            console.log('Total card count:', totalCards);
            
            if (totalCards < 30) {
                console.error('Not enough cards! Need 30, have', totalCards);
            }
        }
    };
    
    console.log('💡 TIP: Run window.runDiagnostic() in console for more info');
})();