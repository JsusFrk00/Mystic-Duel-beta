// v3.0 Initialization - Ensures all systems load properly
console.log('🔄 v3-init.js loading...');

// Global flag to track v3 initialization
window.v3Initialized = false;

// Initialize v3 systems
function initializeV3Systems() {
    console.log('[v3 Init] Starting v3.0 initialization...');
    
    // Check if required dependencies are loaded
    if (!window.ALL_CARDS) {
        console.log('[v3 Init] Waiting for cards to load...');
        setTimeout(initializeV3Systems, 100);
        return;
    }
    
    if (!window.cardTextAbbreviator) {
        console.log('[v3 Init] Waiting for abbreviator to load...');
        setTimeout(initializeV3Systems, 100);
        return;
    }
    
    if (!window.cardDisplayUtils) {
        console.log('[v3 Init] Waiting for display utils to load...');
        setTimeout(initializeV3Systems, 100);
        return;
    }
    
    console.log('[v3 Init] ✅ All dependencies loaded!');
    console.log('[v3 Init] Cards: ' + window.ALL_CARDS.length);
    console.log('[v3 Init] Abbreviator: ' + typeof window.cardTextAbbreviator);
    console.log('[v3 Init] Display Utils: ' + typeof window.cardDisplayUtils);
    console.log('[v3 Init] Splash Handler: ' + typeof window.splashHandler);
    
    // Verify card data has color fields
    const sampleCard = window.ALL_CARDS[0];
    console.log('[v3 Init] Sample card color field: ' + sampleCard.color);
    
    // Count cards by color
    const colorCounts = {};
    window.ALL_CARDS.forEach(card => {
        const color = card.color || 'unknown';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
    });
    console.log('[v3 Init] Cards by color:', colorCounts);
    
    window.v3Initialized = true;
    console.log('[v3 Init] 🎉 v3.0 initialization complete!');
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeV3Systems);
} else {
    initializeV3Systems();
}
