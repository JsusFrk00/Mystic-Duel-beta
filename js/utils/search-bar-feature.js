// ========================================================================
// SEARCH BAR FEATURE - WITH ERROR HANDLING
// ========================================================================
// Adds search functionality with proper error handling for special characters

console.log('🔍 Loading Search Bar Feature (With Error Handling)...');

// Store search state
let collectionSearchText = '';
let deckbuilderSearchText = '';

// ============================================================================
// COLLECTION SEARCH
// ============================================================================

function setupCollectionSearch() {
    if (!window.collection) return;
    
    console.log('[SEARCH] Setting up collection search...');
    
    window.collection.filter = function(filterType) {
        currentFilter = filterType;
        
        document.querySelectorAll('.collection-container .filter-btn').forEach(btn => btn.classList.remove('active'));
        if (event && event.target) event.target.classList.add('active');
        
        const grid = document.getElementById('collectionGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        let cards = window.ALL_CARDS || [];
        
        // Type/rarity/color filter
        if (filterType === 'owned') {
            cards = cards.filter(c => window.storage.getOwnedCount(c.name) > 0);
        } else if (filterType === 'creature' || filterType === 'spell') {
            cards = cards.filter(c => c.type === filterType);
        } else if (['common', 'rare', 'epic', 'legendary'].includes(filterType)) {
            cards = cards.filter(c => c.rarity === filterType);
        } else if (['crimson', 'azure', 'verdant', 'umbral', 'colorless'].includes(filterType)) {
            cards = cards.filter(c => c.color && c.color.includes(filterType));
        } else if (filterType === 'splash') {
            cards = cards.filter(c => c.splashFriendly === true);
        }
        
        // Search filter with error handling
        if (collectionSearchText) {
            try {
                const s = collectionSearchText.toLowerCase();
                cards = cards.filter(c => {
                    try {
                        const nameMatch = c.name.toLowerCase().includes(s);
                        const abilityMatch = (c.ability || '').toLowerCase().includes(s);
                        return nameMatch || abilityMatch;
                    } catch (err) {
                        console.error('[COLLECTION SEARCH] Error filtering card:', c.name, err);
                        return false;
                    }
                });
                console.log(`[COLLECTION SEARCH] Found ${cards.length} cards matching "${collectionSearchText}"`);
            } catch (err) {
                console.error('[COLLECTION SEARCH] Search error:', err);
            }
        }
        
        // Render cards with error handling
        let successCount = 0;
        let errorCount = 0;
        
        cards.forEach(card => {
            try {
                const owned = window.storage.getOwnedCount(card.name, card.variant || 'standard');
                const cardEl = createCollectionCard(card, owned);
                grid.appendChild(cardEl);
                successCount++;
            } catch (err) {
                console.error('[COLLECTION SEARCH] Error creating card element for:', card.name, err);
                errorCount++;
            }
        });
        
        console.log(`[COLLECTION SEARCH] Rendered ${successCount} cards (${errorCount} errors)`);
    };
    
    window.collection.handleSearch = function(text) {
        console.log(`[COLLECTION SEARCH] handleSearch called with: "${text}"`);
        collectionSearchText = text;
        this.filter(currentFilter || 'all');
    };
}

// ============================================================================
// DECK BUILDER SEARCH
// ============================================================================

function setupDeckbuilderSearch() {
    if (!window.deckbuilder) return;
    
    console.log('[SEARCH] Setting up deckbuilder search...');
    
    // Add handleSearch to deckbuilder
    window.deckbuilder.handleSearch = function(text) {
        console.log(`[DECKBUILDER SEARCH] handleSearch called with: "${text}"`);
        deckbuilderSearchText = text;
        
        const grid = document.getElementById('cardCollection');
        if (!grid) {
            console.log('[DECKBUILDER SEARCH] ERROR: Grid not found!');
            return;
        }
        
        // Get all card elements
        const allCardElements = grid.querySelectorAll('.card');
        console.log(`[DECKBUILDER SEARCH] Found ${allCardElements.length} card elements to filter`);
        
        if (!text || text.trim() === '') {
            // No search - show all cards
            allCardElements.forEach(el => el.style.display = '');
            console.log('[DECKBUILDER SEARCH] Cleared search, showing all cards');
            return;
        }
        
        const searchLower = text.toLowerCase();
        let visibleCount = 0;
        let hiddenCount = 0;
        
        // Filter cards
        allCardElements.forEach(cardEl => {
            try {
                // Get card name and description from DOM
                const nameEl = cardEl.querySelector('.card-name');
                const descEl = cardEl.querySelector('.card-description');
                
                if (!nameEl) {
                    cardEl.style.display = 'none';
                    hiddenCount++;
                    return;
                }
                
                const cardName = nameEl.textContent.toLowerCase();
                const cardDesc = descEl ? descEl.textContent.toLowerCase() : '';
                
                // Check if matches
                if (cardName.includes(searchLower) || cardDesc.includes(searchLower)) {
                    cardEl.style.display = '';
                    visibleCount++;
                } else {
                    cardEl.style.display = 'none';
                    hiddenCount++;
                }
            } catch (err) {
                console.error('[DECKBUILDER SEARCH] Error processing card element:', err);
                cardEl.style.display = 'none';
                hiddenCount++;
            }
        });
        
        console.log(`[DECKBUILDER SEARCH] Results: ${visibleCount} visible, ${hiddenCount} hidden`);
    };
}

// Initialize
setTimeout(() => {
    setupCollectionSearch();
    setupDeckbuilderSearch();
    console.log('[SEARCH] Initial setup complete');
}, 100);

setTimeout(() => {
    setupCollectionSearch();
    setupDeckbuilderSearch();
    console.log('[SEARCH] Delayed setup complete');
}, 1000);

setTimeout(() => {
    setupCollectionSearch();
    setupDeckbuilderSearch();
    console.log('[SEARCH] Final setup complete');
}, 3000);

console.log('✅ Search Bar Feature loaded!');
console.log('   🔍 Real-time search by card name');
console.log('   ✨ Search by ability text (searches displayed text)');
console.log('   🎯 Works with all filters');
console.log('   🛡️ Error handling for special characters');
