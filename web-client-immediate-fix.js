// IMMEDIATE WEB CLIENT FIX
// Forces card display in web browser multiplayer

console.log('🌐 WEB CLIENT IMMEDIATE FIX LOADING...');

// Diagnostic function to check what's wrong
function diagnoseMissingCards() {
    console.log('\n=== CARD DISPLAY DIAGNOSTIC ===');
    
    if (window.game) {
        console.log('Game exists: ✅');
        console.log('Player hand length:', window.game.playerHand?.length || 0);
        console.log('Player hand contents:', window.game.playerHand);
        console.log('Is multiplayer:', window.game.isMultiplayer);
        console.log('Player index:', window.game.playerIndex);
        
        // Check DOM
        const handEl = document.getElementById('playerHand');
        if (handEl) {
            console.log('Hand element exists: ✅');
            console.log('Hand element children:', handEl.children.length);
            console.log('Hand element HTML:', handEl.innerHTML.substring(0, 100));
        } else {
            console.log('Hand element exists: ❌');
        }
        
        // Try to force render
        if (window.game.playerHand && window.game.playerHand.length > 0) {
            console.log('Attempting force render...');
            forceRenderCards();
        }
    } else {
        console.log('Game exists: ❌');
    }
    
    console.log('=== END DIAGNOSTIC ===\n');
}

// Force render cards in hand
function forceRenderCards() {
    if (!window.game || !window.game.playerHand) {
        console.error('Cannot force render - no game or hand');
        return;
    }
    
    const handEl = document.getElementById('playerHand');
    if (!handEl) {
        console.error('Cannot force render - no hand element');
        return;
    }
    
    console.log(`🎨 Force rendering ${window.game.playerHand.length} cards`);
    
    // Clear hand
    handEl.innerHTML = '';
    
    // Render each card
    window.game.playerHand.forEach((card, index) => {
        console.log(`  Rendering: ${card.name || 'Unknown'}`);
        
        // Create card element manually if createCardElement fails
        let cardEl;
        
        if (window.game.createCardElement) {
            try {
                cardEl = window.game.createCardElement(card, true);
            } catch (e) {
                console.error('createCardElement failed:', e);
                cardEl = createEmergencyCardElement(card);
            }
        } else {
            cardEl = createEmergencyCardElement(card);
        }
        
        handEl.appendChild(cardEl);
    });
    
    console.log('✅ Force render complete');
}

// Emergency card element creation
function createEmergencyCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = `card ${card.type || 'creature'} ${card.rarity || 'common'}`;
    
    cardEl.innerHTML = `
        <div class="card-cost">${card.cost || 0}</div>
        <div class="card-name">${card.name || 'Unknown'}</div>
        <div class="card-image">${card.emoji || '❓'}</div>
        <div class="card-description">${card.ability || 'No ability'}</div>
        ${card.type === 'creature' ? `
            <div class="card-stats">
                <span class="attack-stat">⚔️ ${card.attack || 0}</span>
                <span class="health-stat">❤️ ${card.health || 1}</span>
            </div>
        ` : ''}
    `;
    
    cardEl.onclick = () => {
        if (window.game && window.game.handleCardClick) {
            window.game.handleCardClick(card, true);
        }
    };
    
    return cardEl;
}

// Hook into socket messages
function hookSocketMessages() {
    // Find the socket
    let socket = window.socket || 
                 (window.multiplayer && window.multiplayer.socket) ||
                 (window.networkManager && window.networkManager.socket) ||
                 (window.game && window.game.networkManager && window.game.networkManager.socket);
    
    if (!socket) {
        console.log('⚠️ No socket found to hook');
        return;
    }
    
    console.log('🔌 Hooking socket messages');
    
    // Hook gameStateUpdate
    socket.on('gameStateUpdate', (data) => {
        console.log('📨 gameStateUpdate received (hooked)');
        
        setTimeout(() => {
            diagnoseMissingCards();
            if (window.game && window.game.playerHand && window.game.playerHand.length > 0) {
                forceRenderCards();
            }
        }, 100);
    });
    
    // Hook gameStart
    socket.on('gameStart', (data) => {
        console.log('🎮 gameStart received (hooked)');
        
        setTimeout(() => {
            diagnoseMissingCards();
            if (window.game && window.game.playerHand && window.game.playerHand.length > 0) {
                forceRenderCards();
            }
        }, 500);
    });
}

// Periodic check and fix
function startPeriodicFix() {
    let lastCheckTime = 0;
    let lastHandSize = -1;
    
    setInterval(() => {
        if (window.game && window.game.isMultiplayer) {
            const currentHandSize = window.game.playerHand?.length || 0;
            
            // Check if hand size changed or no cards are displayed
            const handEl = document.getElementById('playerHand');
            const displayedCards = handEl ? handEl.children.length : 0;
            
            if (currentHandSize > 0 && displayedCards === 0) {
                console.log(`⚠️ Cards in hand (${currentHandSize}) but none displayed!`);
                forceRenderCards();
            } else if (currentHandSize !== lastHandSize) {
                console.log(`👁️ Hand size changed: ${lastHandSize} -> ${currentHandSize}`);
                lastHandSize = currentHandSize;
                if (currentHandSize > 0) {
                    forceRenderCards();
                }
            }
        }
    }, 500); // Check every 500ms
}

// Initialize the fix
function initializeWebClientFix() {
    console.log('🚀 Initializing Web Client Fix...');
    
    // Hook socket messages
    hookSocketMessages();
    
    // Start periodic check
    startPeriodicFix();
    
    // Run immediate diagnostic
    setTimeout(() => {
        diagnoseMissingCards();
    }, 1000);
    
    console.log('✅ Web Client Fix initialized');
}

// Start when ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWebClientFix);
} else {
    initializeWebClientFix();
}

// Global functions for manual fixing
window.diagnoseMissingCards = diagnoseMissingCards;
window.forceRenderCards = forceRenderCards;

console.log('🌐 Web Client Fix loaded. Use diagnoseMissingCards() to check status.');
