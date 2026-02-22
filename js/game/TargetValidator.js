// Target Validation Layer
// Checks if a card can target something BEFORE any game state changes
// This prevents issues like Spell Shield inconsistency

class TargetValidator {
    constructor(game) {
        this.game = game;
    }
    
    // Main validation entry point
    // Returns: { valid: true } or { valid: false, reason: "..." }
    validateTarget(card, target, player) {
        // No target needed
        if (!target) return { valid: true };
        
        // Check Spell Shield FIRST (highest priority)
        const spellShieldCheck = this.checkSpellShield(card, target);
        if (!spellShieldCheck.valid) return spellShieldCheck;
        
        // Check Taunt
        const tauntCheck = this.checkTaunt(card, target, player);
        if (!tauntCheck.valid) return tauntCheck;
        
        // Check Elusive
        const elusiveCheck = this.checkElusive(card, target);
        if (!elusiveCheck.valid) return elusiveCheck;
        
        // All checks passed
        return { valid: true };
    }
    
    // SPELL SHIELD: Can't be targeted by spells
    checkSpellShield(card, target) {
        // Only applies to spells targeting creatures
        if (card.type !== 'spell') return { valid: true };
        if (target === 'player' || target === 'ai') return { valid: true };
        if (!target.ability) return { valid: true };
        
        // Check if target has Spell Shield
        if (target.ability.includes('Spell Shield')) {
            this.game.addLog(`${target.name} has Spell Shield!`);
            return { valid: false, reason: "Spell Shield blocks spells" };
        }
        
        return { valid: true };
    }
    
    // TAUNT: Must attack taunt creatures first
    checkTaunt(card, target, player) {
        // Only applies to attacks
        if (card.type !== 'attack') return { valid: true };
        
        const enemyField = player === 'player' ? this.game.aiField : this.game.playerField;
        const taunts = enemyField.filter(c => c.ability === 'Taunt' || c.taunt);
        
        // If there are taunts and we're not attacking one, invalid
        if (taunts.length > 0 && !taunts.includes(target) && target !== target.taunt) {
            this.game.addLog("Must attack Taunt creatures first!");
            return { valid: false, reason: "Taunt creatures must be attacked first" };
        }
        
        return { valid: true };
    }
    
    // ELUSIVE: Can't be targeted by creature attacks
    checkElusive(card, target) {
        // Only applies to creature attacks
        if (card.type !== 'attack') return { valid: true };
        if (target === 'player' || target === 'ai') return { valid: true };
        
        if (target.ability && target.ability.includes('Elusive')) {
            this.game.addLog(`${target.name} is Elusive!`);
            return { valid: false, reason: "Elusive can't be attacked by creatures" };
        }
        
        return { valid: true };
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TargetValidator;
}
