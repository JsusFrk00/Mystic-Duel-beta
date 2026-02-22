// Debug Module - Handles debug mode functionality
// Access global variables instead of imports

let debugClickCount = 0;
let debugClickTimer = null;
let debugSetup = {
    playerHealth: 30,
    aiHealth: 30,
    playerMana: 10,
    aiMana: 10,
    playerHand: [],
    playerField: [],
    aiField: []
};

// Setup debug trigger
function setupTrigger() {
    // Create invisible trigger area
    const trigger = document.createElement('div');
    trigger.className = 'debug-trigger';
    document.querySelector('.main-menu').appendChild(trigger);
    
    trigger.addEventListener('click', function() {
        debugClickCount++;
        
        if (debugClickTimer) {
            clearTimeout(debugClickTimer);
        }
        
        if (debugClickCount === 3) {
            open();
            debugClickCount = 0;
        } else {
            debugClickTimer = setTimeout(() => {
                debugClickCount = 0;
            }, 500);
        }
    });
    
    // Also add keyboard shortcut: Ctrl+Shift+D
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            open();
        }
    });
}

// Open debug mode
function open() {
    document.getElementById('debugMode').style.display = 'flex';
    
    // Populate card select
    const select = document.getElementById('debugCardSelect');
    select.innerHTML = '<option value="">Select a card...</option>';
    
    // Sort cards by cost then name
    const sortedCards = [...window.ALL_CARDS].sort((a, b) => {
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
    });
    
    sortedCards.forEach(card => {
        const option = document.createElement('option');
        option.value = JSON.stringify(card);
        option.textContent = `(${card.cost}) ${card.name} - ${card.rarity}`;
        option.style.color = {
            'common': '#888',
            'rare': '#00c9ff',
            'epic': '#8e2de2',
            'legendary': '#ffd700'
        }[card.rarity];
        select.appendChild(option);
    });
    
    updateDisplay();
}

// Close debug mode
function close() {
    document.getElementById('debugMode').style.display = 'none';
}

// Add card to debug setup
function addCard(location) {
    const select = document.getElementById('debugCardSelect');
    if (!select.value) {
        alert('Please select a card first!');
        return;
    }
    
    const cardData = JSON.parse(select.value);
    const card = new window.Card(cardData);
    
    if (location === 'hand' && debugSetup.playerHand.length < 10) {
        debugSetup.playerHand.push(card);
    } else if (location === 'field' && debugSetup.playerField.length < 7) {
        card.tapped = false; // Start untapped in debug mode
        debugSetup.playerField.push(card);
    } else if (location === 'aiField' && debugSetup.aiField.length < 7) {
        card.tapped = false;
        debugSetup.aiField.push(card);
    } else {
        alert('That area is full!');
    }
    
    updateDisplay();
}

// Update debug display
function updateDisplay() {
    document.getElementById('debugPlayerHandList').textContent = 
        debugSetup.playerHand.length > 0 ? 
        debugSetup.playerHand.map(c => c.name).join(', ') : 'Empty';
    
    document.getElementById('debugPlayerFieldList').textContent = 
        debugSetup.playerField.length > 0 ? 
        debugSetup.playerField.map(c => c.name).join(', ') : 'Empty';
    
    document.getElementById('debugAiFieldList').textContent = 
        debugSetup.aiField.length > 0 ? 
        debugSetup.aiField.map(c => c.name).join(', ') : 'Empty';
}

// Clear debug setup
function clear() {
    debugSetup = {
        playerHealth: 30,
        aiHealth: 30,
        playerMana: 10,
        aiMana: 10,
        playerHand: [],
        playerField: [],
        aiField: []
    };
    
    document.getElementById('debugPlayerHealth').value = 30;
    document.getElementById('debugAiHealth').value = 30;
    document.getElementById('debugPlayerMana').value = 10;
    document.getElementById('debugAiMana').value = 10;
    
    updateDisplay();
}

// Start debug game
function startGame() {
    // Get values from inputs
    debugSetup.playerHealth = parseInt(document.getElementById('debugPlayerHealth').value);
    debugSetup.aiHealth = parseInt(document.getElementById('debugAiHealth').value);
    debugSetup.playerMana = parseInt(document.getElementById('debugPlayerMana').value);
    debugSetup.aiMana = parseInt(document.getElementById('debugAiMana').value);
    
    // Create a minimal deck with random cards (needed for game to work)
    const debugDeck = [];
    for (let i = 0; i < 30; i++) {
        const randomCard = window.ALL_CARDS[Math.floor(Math.random() * window.ALL_CARDS.length)];
        debugDeck.push(new window.Card(randomCard));
    }
    
    // Close debug panel and start game
    close();
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    document.getElementById('gameLog').style.display = 'block';
    document.getElementById('gameLog').innerHTML = '';
    
    // Create debug game instance using DebugGame class
    if (window.DebugGame) {
        console.log('[DEBUG] Starting DebugGame with setup:', debugSetup);
        window.game = new window.DebugGame(debugDeck, debugSetup);
        console.log('[DEBUG] Game created. Player mana:', window.game.playerMana, '/', window.game.playerMaxMana);
        console.log('[DEBUG] Player hand size:', window.game.playerHand.length);
    } else if (window.Game) {
        console.warn('[DEBUG] DebugGame class not available, using regular Game');
        // Fallback to regular game with manual override
        window.game = new window.Game(debugDeck);
        
        // CRITICAL: Set both current AND max mana
        window.game.playerHealth = debugSetup.playerHealth;
        window.game.aiHealth = debugSetup.aiHealth;
        window.game.playerMana = debugSetup.playerMana;
        window.game.playerMaxMana = debugSetup.playerMana; // CRITICAL FIX
        window.game.aiMana = debugSetup.aiMana;
        window.game.aiMaxMana = debugSetup.aiMana; // CRITICAL FIX
        
        // Replace hand and field AFTER initial setup
        window.game.playerHand = [...debugSetup.playerHand];
        window.game.playerField = [...debugSetup.playerField];
        window.game.aiField = [...debugSetup.aiField];
        
        window.game.updateDisplay();
        console.log('[DEBUG] Game state applied. Player mana:', window.game.playerMana, '/', window.game.playerMaxMana);
    } else {
        alert('Game class not available. Please try again.');
    }
}

// Make debug functions globally available
window.debugMode = {
    setupTrigger,
    open,
    close,
    addCard,
    updateDisplay,
    clear,
    startGame
};

// Auto-initialize debug mode when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupTrigger();
        console.log('✅ Debug module loaded - Ctrl+Shift+D to open');
    });
} else {
    // DOM already loaded
    setupTrigger();
    console.log('✅ Debug module loaded - Ctrl+Shift+D to open');
}
