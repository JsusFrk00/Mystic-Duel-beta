// ========================================================================
// DEBUG MODE FIX - Initialize Card Properties
// ========================================================================
// Ensures cards placed via debug mode have their properties set correctly

console.log('🔧 Loading Debug Mode Property Fix...');

// Helper function to initialize all card properties based on ability text
function initializeCardProperties(card) {
    const ability = card.ability;
    if (!ability) return card;
    
    console.log(`[DEBUG INIT] Initializing properties for ${card.name}: "${ability}"`);
    
    // Initialize all keyword abilities
    if (ability === 'Taunt' || ability.includes('Taunt')) {
        card.taunt = true;
        console.log(`  → taunt = true`);
    }
    
    if (ability === 'Spell Shield' || ability.includes('Spell Shield')) {
        card.spellShield = true;
        console.log(`  → spellShield = true`);
    }
    
    if (ability === 'Divine Shield' || ability.includes('Divine Shield')) {
        card.divineShield = true;
        console.log(`  → divineShield = true`);
    }
    
    if (ability === 'Stealth' || ability.includes('Stealth')) {
        card.stealth = true;
        console.log(`  → stealth = true`);
    }
    
    if (ability === 'Vigilance' || ability.includes('Vigilance')) {
        card.vigilance = true;
        console.log(`  → vigilance = true`);
    }
    
    if (ability === 'Regenerate' || ability.includes('Regenerate')) {
        card.regenerate = true;
        console.log(`  → regenerate = true`);
    }
    
    if (ability.includes('Immune')) {
        card.immune = true;
        console.log(`  → immune = true`);
    }
    
    if (ability === 'Instant kill' || ability.includes('Instant kill')) {
        card.instantKill = true;
        console.log(`  → instantKill = true`);
    }
    
    // Initialize base stats for aura system
    if (card.baseAttack === undefined) {
        card.baseAttack = card.attack;
    }
    if (card.baseHealth === undefined) {
        card.baseHealth = card.health;
    }
    
    // Set max health
    if (!card.maxHealth) {
        card.maxHealth = card.health;
    }
    
    return card;
}

// Make it globally available
window.initializeCardProperties = initializeCardProperties;

// Patch the debug mode's startGame function
if (window.debugMode && window.debugMode.startGame) {
    const _originalDebugStartGame = window.debugMode.startGame;
    
    window.debugMode.startGame = function() {
        console.log('[DEBUG PROPERTY FIX] Initializing card properties before game start...');
        
        // Initialize properties for all cards in debug setup BEFORE starting game
        debugSetup.playerHand.forEach(card => initializeCardProperties(card));
        debugSetup.playerField.forEach(card => initializeCardProperties(card));
        debugSetup.aiField.forEach(card => initializeCardProperties(card));
        
        console.log(`[DEBUG PROPERTY FIX] Initialized ${debugSetup.playerField.length} player field cards`);
        console.log(`[DEBUG PROPERTY FIX] Initialized ${debugSetup.aiField.length} AI field cards`);
        
        // Now call original startGame
        _originalDebugStartGame.call(this);
    };
    
    console.log('✅ Debug mode startGame patched to initialize properties');
}

// Also patch the DebugGame constructor if it exists
if (window.DebugGame) {
    const _originalDebugGameConstructor = window.DebugGame;
    
    window.DebugGame = class DebugGame extends _originalDebugGameConstructor {
        constructor(playerDeckCards, debugSetup) {
            super(playerDeckCards, debugSetup);
            
            // Initialize properties for all cards already on field
            console.log('[DEBUG PROPERTY FIX] Post-construction property initialization...');
            this.playerField.forEach(card => initializeCardProperties(card));
            this.aiField.forEach(card => initializeCardProperties(card));
            this.playerHand.forEach(card => initializeCardProperties(card));
            
            console.log('[DEBUG PROPERTY FIX] All debug cards initialized');
        }
    };
}

console.log('✅ Debug Mode Property Fix loaded!');
console.log('   🔧 Cards in debug mode now initialize properties correctly');
console.log('   🛡️ Spell Shield, Taunt, Divine Shield, etc. will work in debug mode');
