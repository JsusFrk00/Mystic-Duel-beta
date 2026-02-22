// Diagnostic script to check what's loaded and working
console.log('=== MYSTIC DUEL DIAGNOSTICS ===');

// Check if all required globals exist
const checks = {
    'window.ALL_CARDS': !!window.ALL_CARDS,
    'window.Card': !!window.Card,
    'window.storage': !!window.storage,
    'window.storage.playerData': !!(window.storage && window.storage.playerData),
    'window.storage.playerData.ownedCards': !!(window.storage && window.storage.playerData && window.storage.playerData.ownedCards),
    'window.deckbuilder': !!window.deckbuilder,
    'window.deckbuilder.show': !!(window.deckbuilder && window.deckbuilder.show),
    'window.gameManager': !!window.gameManager,
    'window.NetworkManager': !!window.NetworkManager,
    'window.ui': !!window.ui,
    'window.store': !!window.store,
    'window.collection': !!window.collection
};

console.log('\n📊 System Check:');
for (const [item, exists] of Object.entries(checks)) {
    console.log(`${exists ? '✅' : '❌'} ${item}`);
}

// Check owned cards
if (window.storage && window.storage.playerData && window.storage.playerData.ownedCards) {
    const ownedCards = window.storage.playerData.ownedCards;
    const totalCards = Object.values(ownedCards).reduce((sum, count) => sum + count, 0);
    console.log(`\n📦 Owned Cards: ${totalCards} total`);
    console.log('Card list:', ownedCards);
} else {
    console.log('\n❌ No owned cards data found!');
}

// Check localStorage
const playerData = localStorage.getItem('playerData');
if (playerData) {
    try {
        const data = JSON.parse(playerData);
        console.log('\n💾 localStorage has playerData');
        console.log('Gold:', data.gold);
        console.log('Gems:', data.gems);
        console.log('Owned cards:', Object.keys(data.ownedCards || {}).length, 'types');
    } catch (e) {
        console.log('\n❌ localStorage playerData is corrupted');
    }
} else {
    console.log('\n❌ No playerData in localStorage');
}

// Fix deckbuilder if broken
if (!window.deckbuilder || typeof window.deckbuilder.show !== 'function') {
    console.log('\n🔧 Deckbuilder broken - fixing now...');
    
    // Load the fixed deckbuilder
    const script = document.createElement('script');
    script.src = 'js/deckbuilder/deckbuilder-fixed.js?t=' + Date.now();
    script.onload = () => {
        console.log('✅ Deckbuilder fixed and loaded!');
    };
    document.head.appendChild(script);
}

// Check Socket.io
if (typeof io !== 'undefined') {
    console.log('\n✅ Socket.io client library is loaded');
} else {
    console.log('\n❌ Socket.io client library NOT loaded');
    console.log('   Multiplayer will not work until Socket.io loads');
}

console.log('\n=== END DIAGNOSTICS ===');
console.log('\n📝 To fix issues:');
console.log('1. Run FINAL_FIX.bat');
console.log('2. Or in console type: localStorage.clear() and refresh');
console.log('3. Or manually click Build Deck again (should work now)');