// Card Class
class Card {
    constructor(template) {
        // Version check (only log once)
        if (!Card.versionLogged) {
            console.log('[VERSION] Card.js loaded - Version with ability preservation fix 1.3');
            Card.versionLogged = true;
        }
        
        // CRITICAL: If template is missing properties, look them up from ALL_CARDS
        if (window.ALL_CARDS && (!template.color || template.splashFriendly === undefined || template.splashBonus === undefined)) {
            const cardData = window.ALL_CARDS.find(c => c.name === template.name);
            if (cardData) {
                template = { ...cardData, ...template }; // Merge with full data, template overrides
            }
        }
        
        // CRITICAL: Preserve properties BEFORE Object.assign
        const preservedAbility = template.ability;
        const preservedSplashBonus = template.splashBonus;
        const preservedSplashFriendly = template.splashFriendly;
        const preservedColor = template.color;
        const preservedVariant = template.variant;
        const preservedFullArt = template.fullArt;
        
        // First assign all properties
        Object.assign(this, template);
        
        // CRITICAL FIX: Force values to be preserved
        this.ability = preservedAbility || '';
        this.splashBonus = preservedSplashBonus || '';
        this.splashFriendly = preservedSplashFriendly || false;
        this.color = preservedColor || 'colorless';
        this.variant = preservedVariant || 'standard';
        this.fullArt = preservedFullArt || false;
        
        // Debug ability preservation for key cards
        if (this.name === 'Fire Drake' || this.name === 'Goblin Scout' || this.name === 'Shield Bearer') {
            console.log(`[CARD] ${this.name} created with ability: "${this.ability}"`);
        }
        this.maxHealth = this.health;
        
        // Store base stats for aura calculations
        this.baseAttack = this.attack;
        this.baseHealth = this.health;
        
        // CRITICAL FIX: Only set defaults if not already provided by template
        // This preserves server state during sync (especially tapped status)
        if (this.tapped === undefined) this.tapped = false;
        if (this.hasAttackedThisTurn === undefined) this.hasAttackedThisTurn = false;
        if (this.frozen === undefined) this.frozen = false;
        if (this.justPlayed === undefined) this.justPlayed = false;
        
        // Always generate new ID and reset these
        this.id = Math.random().toString(36).substr(2, 9);
        this.doubleStrikeUsed = false;
        this.windfuryUsed = false;
        this.canOnlyAttackCreatures = false;
        this.stealth = false;
        this.divineShield = false;
        this.spellShield = false;
        this.vigilance = false;
        this.immune = false;
        this.tempImmune = false;
        this.taunt = false;
        this.instantKill = false;
        this.enraged = false; // Track if Enrage has triggered
        
        // Initialize aura bonuses
        this.auraAttackBonus = 0;
        this.auraHealthBonus = 0;
        this.auraCharge = false;
        
        // Initialize keyword properties from ability text
        if (this.ability && this.ability.includes('Taunt')) {
            this.taunt = true;
        }
        if (this.ability && this.ability.includes('Vigilance')) {
            this.vigilance = true;
        }
        if (this.ability && this.ability.includes('Stealth')) {
            this.stealth = true;
        }
        if (this.ability && this.ability.includes('Divine Shield')) {
            this.divineShield = true;
        }
        if (this.ability && this.ability.includes('Spell Shield')) {
            this.spellShield = true;
        }
        if (this.ability && this.ability.includes('Flying')) {
            this.flying = true;
        }
        if (this.ability && this.ability.includes('Lifesteal')) {
            this.lifesteal = true;
        }
    }

    clone() {
        return new Card({
            name: this.name,
            cost: this.cost,
            type: this.type,
            attack: this.attack,
            health: this.maxHealth,
            ability: this.ability,
            splashBonus: this.splashBonus,
            splashFriendly: this.splashFriendly,
            color: this.color,
            variant: this.variant,
            fullArt: this.fullArt,
            emoji: this.emoji,
            rarity: this.rarity
        });
    }

    // Reset creature for new turn
    resetForTurn() {
        if (this.frozen) {
            this.frozen = false;
        } else {
            this.tapped = false;
        }
        this.hasAttackedThisTurn = false;
        this.doubleStrikeUsed = false;
        this.windfuryUsed = false;
        this.canOnlyAttackCreatures = false;
        this.tempImmune = false;
        
        // Handle regenerate
        if (this.ability === 'Regenerate') {
            this.health = this.maxHealth;
        }
    }

    // Apply damage to creature
    takeDamage(amount, source = null) {
        if (amount <= 0) return 0;
        
        if (this.immune || this.tempImmune) {
            return 0;
        }

        if (this.divineShield) {
            this.divineShield = false;
            return 0;
        }

        const actualDamage = Math.min(amount, this.health);
        this.health -= actualDamage;
        
        // Handle enrage - triggers only once, the first time creature takes damage
        if (this.ability === 'Enrage' && actualDamage > 0 && this.health > 0 && !this.enraged) {
            console.log(`[ENRAGE DEBUG] ${this.name} triggering Enrage!`);
            console.log(`[ENRAGE DEBUG] Attack before: ${this.attack}`);
            this.attack += 2;
            console.log(`[ENRAGE DEBUG] Attack after: ${this.attack}`);
            this.enraged = true; // Track that enrage has triggered
        } else if (this.ability === 'Enrage') {
            console.log(`[ENRAGE DEBUG] ${this.name} has Enrage but conditions not met:`);
            console.log(`[ENRAGE DEBUG] - actualDamage: ${actualDamage}`);
            console.log(`[ENRAGE DEBUG] - health: ${this.health}`);
            console.log(`[ENRAGE DEBUG] - already enraged: ${this.enraged}`);
        }

        return actualDamage;
    }

    // Check if creature can attack
    canAttack() {
        return !this.tapped && !this.frozen && !this.hasAttackedThisTurn;
    }

    // Mark as having attacked
    markAttacked() {
        // All creatures can only attack once per turn (except Windfury/Double Strike)
        this.hasAttackedThisTurn = true;
        
        // Vigilance creatures stay untapped but still marked as having attacked
        if (!this.vigilance) {
            this.tapped = true;
        }

        // Handle special attack abilities
        if (this.ability === 'Windfury') {
            if (!this.windfuryUsed) {
                // First attack with Windfury
                this.tapped = false; // Can attack again
                this.hasAttackedThisTurn = false; // Reset for second attack
                this.windfuryUsed = true;
            } else {
                // Second attack - now it's done
                this.hasAttackedThisTurn = true;
                if (!this.vigilance) {
                    this.tapped = true;
                }
            }
        } else if (this.ability === 'Double Strike' && !this.doubleStrikeUsed) {
            this.doubleStrikeUsed = true;
            this.hasAttackedThisTurn = false; // Can attack once more
            this.tapped = false;
        } else if (this.ability === 'Double Strike' && this.doubleStrikeUsed) {
            // Second strike done
            this.hasAttackedThisTurn = true;
            if (!this.vigilance) {
                this.tapped = true;
            }
        }
    }

    // Get display cost (for cards with cost reduction)
    getDisplayCost(spellsCount = 0) {
        if (this.ability === 'Costs less per spell') {
            return Math.max(0, this.cost - spellsCount);
        }
        return this.cost;
    }
}

// Make Card class globally available
window.Card = Card;

console.log('✅ Card class loaded');
