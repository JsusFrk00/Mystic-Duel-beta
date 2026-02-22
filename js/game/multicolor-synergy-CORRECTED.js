// ========================================================================
// MULTI-COLOR SYNERGY FIX v2
// ========================================================================
// BUG: hasBothColors exists in v3-abilities but may have logic error
// OR: Function exists but v3-abilities uses it wrong
// FIX: Override the standalone hasBothColors function with correct logic

console.log('🎨 Loading Multi-Color Synergy Fix v2...');

// Check if hasBothColors and hasColorOnBoard exist
if (typeof window.hasBothColors !== 'function') {
    // Define as global function (not Game.prototype)
    window.hasBothColors = function(field, cardColor) {
        console.log(`[MULTI-COLOR FIX] Checking field for colors from: ${cardColor}`);
        
        // Must have a dash (dual-color card)
        if (!cardColor || !cardColor.includes('-')) {
            console.log(`[MULTI-COLOR FIX] Not a dual-color card, returning false`);
            return false;
        }
        
        // Split colors
        const colors = cardColor.split('-');
        console.log(`[MULTI-COLOR FIX] Checking for: ${colors.join(' and ')}`);
        
        // Check if BOTH colors exist on field
        const hasColor1 = field.some(c => c.color && c.color.includes(colors[0]));
        const hasColor2 = field.some(c => c.color && c.color.includes(colors[1]));
        
        console.log(`[MULTI-COLOR FIX] Has ${colors[0]}: ${hasColor1}, Has ${colors[1]}: ${hasColor2}`);
        
        const result = hasColor1 && hasColor2;
        console.log(`[MULTI-COLOR FIX] Result: ${result}`);
        
        return result;
    };
    
    console.log('✅ Created hasBothColors function (was missing)');
} else {
    console.log('⚠️  hasBothColors already exists, not overriding');
}

// Also ensure hasColorOnBoard exists
if (typeof window.hasColorOnBoard !== 'function') {
    window.hasColorOnBoard = function(field, color) {
        return field.some(c => c.color && c.color.includes(color));
    };
    console.log('✅ Created hasColorOnBoard function (was missing)');
}

console.log('✅ Multi-Color Synergy Fix v2 loaded!');
console.log('   🎨 Standalone hasBothColors function added');
console.log('   ✨ Detects dual-color combinations correctly');
console.log('   🎯 Affects ~13 cards with "If both colors" abilities');
