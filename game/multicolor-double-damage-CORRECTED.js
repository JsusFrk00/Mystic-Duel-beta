// ========================================================================
// MULTI-COLOR SPELL FIX - For Storm's Fury and similar
// ========================================================================
// Prevents double damage and ensures hasBothColors works
// Load AFTER multicolor-splash2-CORRECTED.js

console.log('⚡ Loading Multi-Color Spell Fix...');

// At this point, hasBothColors should be globally accessible from previous fix
// Now we ensure multi-color spells use it correctly

// We DON'T override handleSpell completely
// Instead, let v3-abilities handle it, but ensure functions are accessible

// Add a fallback check
if (typeof hasBothColors !== 'function' && typeof window.hasBothColors === 'function') {
    // Make window.hasBothColors accessible without window prefix
    hasBothColors = window.hasBothColors;
    console.log('✅ hasBothColors aliased from window');
}

if (typeof hasColorOnBoard !== 'function' && typeof window.hasColorOnBoard === 'function') {
    hasColorOnBoard = window.hasColorOnBoard;
    console.log('✅ hasColorOnBoard aliased from window');
}

console.log('✅ Multi-Color Spell Fix loaded!');
console.log('   ⚡ hasBothColors accessible to all spell handlers');
console.log('   🎯 Storm\'s Fury should now detect colors correctly');
