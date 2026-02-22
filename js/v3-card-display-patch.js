// v3.0 Card Display Patch
// Patches all card rendering to use new display utilities

console.log('🔄 v3-card-display-patch.js loading...');

// Wait for game to load
setTimeout(function() {
    // Patch any card elements that were created without utilities
    function patchCardElements() {
        // Find all card-name elements without data-name-length attribute
        const cardNames = document.querySelectorAll('.card-name:not([data-name-length])');
        
        cardNames.forEach(function(nameEl) {
            const name = nameEl.textContent;
            if (name && window.cardDisplayUtils) {
                const lengthCategory = window.cardDisplayUtils.getNameLengthCategory(name);
                nameEl.setAttribute('data-name-length', lengthCategory);
            }
        });
        
        // Find all cards without color/rarity data attributes
        const cards = document.querySelectorAll('.card:not([data-color])');
        
        cards.forEach(function(cardEl) {
            // Try to determine card from name
            const nameEl = cardEl.querySelector('.card-name');
            if (nameEl && window.ALL_CARDS) {
                const cardName = nameEl.textContent;
                const cardData = window.ALL_CARDS.find(function(c) { return c.name === cardName; });
                
                if (cardData) {
                    // Add color class
                    const color = cardData.color || 'colorless';
                    cardEl.classList.add(color);
                    cardEl.setAttribute('data-color', color);
                    cardEl.setAttribute('data-rarity', cardData.rarity);
                    
                    // Add splash-friendly class if applicable
                    if (cardData.splashFriendly) {
                        cardEl.classList.add('splash-friendly');
                    }
                }
            }
        });
    }
    
    // Run patch immediately
    patchCardElements();
    
    // Re-run patch whenever DOM changes (for dynamically created cards)
    const observer = new MutationObserver(function() {
        patchCardElements();
    });
    
    // Observe hand and field areas for card additions
    const handAreas = document.querySelectorAll('.hand-area, .field-area');
    handAreas.forEach(function(area) {
        observer.observe(area, { childList: true, subtree: true });
    });
    
    console.log('✅ v3 card display patch active');
}, 1000);
