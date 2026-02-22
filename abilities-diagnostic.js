// FINAL ABILITIES DIAGNOSTIC
console.log('🔍 RUNNING FINAL ABILITIES DIAGNOSTIC...');

// Diagnostic function to check everything
function runAbilitiesDiagnostic() {
    console.log('\n=== ABILITIES DIAGNOSTIC REPORT ===');
    
    // 1. Check if data is loaded
    console.log('\n📚 DATA CHECK:');
    console.log('  ALL_CARDS loaded:', window.ALL_CARDS ? `✅ ${window.ALL_CARDS.length} cards` : '❌ Not loaded');
    console.log('  ABILITY_DESCRIPTIONS loaded:', window.ABILITY_DESCRIPTIONS ? `✅ ${Object.keys(window.ABILITY_DESCRIPTIONS).length} abilities` : '❌ Not loaded');
    console.log('  Card class available:', window.Card ? '✅' : '❌');
    console.log('  Game class available:', window.Game ? '✅' : '❌');
    
    // 2. Test card creation
    console.log('\n🃏 CARD CREATION TEST:');
    if (window.Card && window.ALL_CARDS) {
        const testCards = ['Fire Drake', 'Goblin Scout', 'Shield Bearer', 'Lightning Bolt'];
        testCards.forEach(name => {
            const template = window.ALL_CARDS.find(c => c.name === name);
            if (template) {
                const card = new window.Card(template);
                const hasAbility = card.ability && card.ability.length > 0;
                console.log(`  ${name}:`, hasAbility ? `✅ "${card.ability}"` : '❌ No ability');
            }
        });
    }
    
    // 3. Check active game
    console.log('\n🎮 ACTIVE GAME CHECK:');
    if (window.game) {
        console.log('  Game active: ✅');
        
        // Check player hand
        const handAbilities = window.game.playerHand.map(c => ({
            name: c.name,
            ability: c.ability || 'MISSING'
        }));
        console.log('  Player hand abilities:', handAbilities);
        
        // Check if abilities are displayed
        const cardElements = document.querySelectorAll('.card-description');
        console.log(`  Card description elements: ${cardElements.length} found`);
        
        if (cardElements.length > 0) {
            const firstCard = cardElements[0];
            console.log(`  First card description text: "${firstCard.textContent}"`);
            console.log(`  First card description visible:`, 
                window.getComputedStyle(firstCard).display !== 'none' ? '✅' : '❌');
        }
    } else {
        console.log('  No active game');
    }
    
    // 4. Check CSS loading
    console.log('\n🎨 CSS CHECK:');
    const cssFiles = Array.from(document.styleSheets).map(s => s.href ? s.href.split('/').pop() : 'inline');
    console.log('  Loaded CSS files:', cssFiles);
    console.log('  ability-display.css loaded:', cssFiles.includes('ability-display.css') ? '✅' : '❌');
    
    // 5. Check for script errors
    console.log('\n⚠️ SCRIPT ERRORS CHECK:');
    const scripts = Array.from(document.scripts)
        .filter(s => s.src)
        .map(s => s.src.split('/').pop());
    
    // Check for the corrupted file
    if (scripts.includes('browser-card-fix.js')) {
        console.log('  ❌ CORRUPTED browser-card-fix.js is still being loaded!');
    } else if (scripts.includes('browser-card-fix-clean.js')) {
        console.log('  ✅ Clean browser-card-fix-clean.js is loaded');
    }
    
    // 6. Fixes available
    console.log('\n🛠️ AVAILABLE FIXES:');
    console.log('  masterAbilityFix:', window.masterAbilityFix ? '✅ Available' : '❌ Not loaded');
    console.log('  checkCardData:', typeof window.checkCardData === 'function' ? '✅' : '❌');
    console.log('  fixCurrentGameAbilities:', typeof window.fixCurrentGameAbilities === 'function' ? '✅' : '❌');
    
    console.log('\n=== END DIAGNOSTIC REPORT ===\n');
    
    // Auto-fix if needed
    if (window.game && window.masterAbilityFix) {
        console.log('🔧 Applying automatic fixes...');
        window.masterAbilityFix.fixAll();
    }
}

// Run diagnostic after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAbilitiesDiagnostic, 2000);
    });
} else {
    setTimeout(runAbilitiesDiagnostic, 1000);
}

// Make diagnostic available globally
window.runAbilitiesDiagnostic = runAbilitiesDiagnostic;

console.log('📋 Diagnostic ready. Use runAbilitiesDiagnostic() to check status.');
