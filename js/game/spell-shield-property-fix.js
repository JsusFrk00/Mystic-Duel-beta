// ========================================================================
// SPELL SHIELD PROPERTY FIX - FORCE ASSIGNMENT
// ========================================================================
// Ensures spellShield property is ALWAYS set when ability text includes it
// MUST load after Game.js but BEFORE any patches

console.log('🛡️ Loading Spell Shield Property Fix...');

// Override playCreature to FORCE spell shield assignment
const _basePlayCreature = Game.prototype.playCreature;
Game.prototype.playCreature = function(card, player, field) {
    // Call original
    if (_basePlayCreature) {
        _basePlayCreature.call(this, card, player, field);
    }
    
    // FORCE spell shield assignment if ability text contains it
    if (card.ability && card.ability.includes('Spell Shield')) {
        card.spellShield = true;
        console.log(`🛡️ [FORCE ASSIGN] ${card.name} now has spellShield = true`);
    }
    
    // FORCE taunt assignment
    if (card.ability && (card.ability === 'Taunt' || card.ability.includes('Taunt'))) {
        card.taunt = true;
    }
    
    // FORCE divine shield assignment
    if (card.ability && (card.ability === 'Divine Shield' || card.ability.includes('Divine Shield'))) {
        card.divineShield = true;
    }
    
    // FORCE stealth assignment
    if (card.ability && (card.ability === 'Stealth' || card.ability.includes('Stealth'))) {
        card.stealth = true;
    }
};

console.log('✅ Spell Shield Property Fix loaded!');
console.log('   🛡️ Forces spellShield = true when ability contains "Spell Shield"');
console.log('   🛡️ Also forces taunt, divineShield, stealth properties');
