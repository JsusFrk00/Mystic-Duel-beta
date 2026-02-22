// ========================================================================
// DEBUG MODE ABILITY INITIALIZATION FIX
// ========================================================================
// Makes debug mode properly initialize keyword flags from ability text
// Without this, creatures in debug mode have ability text but no flags set

console.log('🔧 Loading Debug Ability Initialization Fix...');

// Helper function to initialize keyword flags from ability text
function initializeCardAbilities(card) {
    const ability = card.ability || '';
    
    // Initialize all keyword flags based on ability text
    if (ability === 'Taunt' || ability.includes('Taunt')) {
        card.taunt = true;
    }
    if (ability === 'Flying' || ability.includes('Flying')) {
        card.flying = true;
    }
    if (ability === 'Stealth' || ability.includes('Stealth')) {
        card.stealth = true;
    }
    if (ability === 'Charge' || ability === 'Haste' || ability === 'Quick') {
        card.tapped = false; // Can attack immediately
    }
    if (ability === 'Rush') {
        card.tapped = false;
        card.justPlayed = true;
        card.canOnlyAttackCreatures = true;
    }
    if (ability === 'Vigilance' || ability.includes('Vigilance')) {
        card.vigilance = true;
    }
    if (ability === 'Divine Shield' || ability.includes('Divine Shield')) {
        card.divineShield = true;
    }
    if (ability === 'Spell Shield' || ability.includes('Spell Shield')) {
        card.spellShield = true;
    }
    if (ability.includes('Lifesteal') || ability.includes('Lifelink')) {
        card.lifesteal = true;
    }
    if (ability === 'Deathtouch' || ability.includes('Deathtouch')) {
        card.deathtouch = true;
    }
    if (ability === 'Poison' || ability.includes('Poison')) {
        card.poison = true;
    }
    if (ability === 'First Strike' || ability.includes('First Strike')) {
        card.firstStrike = true;
    }
    if (ability === 'Trample' || ability.includes('Trample')) {
        card.trample = true;
    }
    if (ability.includes("Can't attack") || ability.includes("Cannot attack")) {
        card.cantAttack = true;
    }
    
    console.log(`[DEBUG INIT] ${card.name}: taunt=${card.taunt}, flying=${card.flying}, deathrattle=${ability.includes('Deathrattle')}`);
}

// Patch debug mode's addCard function
if (window.debugMode && window.debugMode.addCard) {
    const _originalDebugAddCard = window.debugMode.addCard;
    
    window.debugMode.addCard = function(location) {
        // Call original
        _originalDebugAddCard.call(this, location);
        
        // Initialize abilities on the last card added
        const setup = window.debugMode.debugSetup || debugSetup;
        
        if (location === 'field' && setup.playerField.length > 0) {
            const card = setup.playerField[setup.playerField.length - 1];
            initializeCardAbilities(card);
        } else if (location === 'aiField' && setup.aiField.length > 0) {
            const card = setup.aiField[setup.aiField.length - 1];
            initializeCardAbilities(card);
        }
    };
    
    console.log('✅ Debug mode addCard patched to initialize abilities!');
}

// Also patch DebugGame constructor if it exists
if (window.DebugGame) {
    const _originalDebugGameInit = window.DebugGame;
    
    window.DebugGame = function(deck, setup) {
        // Call original constructor
        const game = new _originalDebugGameInit(deck, setup);
        
        // Initialize all cards already on field
        [...game.playerField, ...game.aiField].forEach(card => {
            initializeCardAbilities(card);
        });
        
        console.log('[DEBUG GAME] Initialized abilities for all field cards');
        
        return game;
    };
    
    // Preserve prototype
    window.DebugGame.prototype = _originalDebugGameInit.prototype;
}

console.log('✅ Debug Ability Initialization Fix loaded!');
console.log('   🔧 Keyword flags now set properly in debug mode');
console.log('   🐀 Rat, Taunt, Flying, etc. will work correctly');
