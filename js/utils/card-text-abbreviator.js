// Card Text Abbreviator - v3.0
// Shortens ability text for card display

console.log('🔄 card-text-abbreviator.js loading...');

class CardTextAbbreviator {
    constructor() {
        // Define all keywords that should be displayed
        this.keywords = [
            'Quick', 'Burn', 'Splash 2', 'Splash', 'Taunt', 'Rush', 'Flying', 'Stealth',
            'Charge', 'Haste', 'Vigilance', 'Lifelink', 'Lifesteal', 'Regenerate',
            'Trample', 'Deathtouch', 'Poison', 'First Strike', 'Double Strike',
            'Windfury', 'Divine Shield', 'Spell Shield', 'Enrage', 'Reach',
            'Spell Power +1', 'Spell Power +2', 'Spell Power +3',
            "Can't attack"
            // NOTE: NOT including "Attack Trigger" - it's a prefix, not a keyword
            // NOTE: NOT including "Deathrattle" or "Battlecry" - handled separately
        ];
    }

    // Get abbreviated text for card display
    getAbbreviatedText(ability, cardType = 'creature') {
        if (!ability || ability.trim() === '') {
            return ''; // No ability
        }
        
        // Attack Trigger abilities are too complex - show "See Text"
        if (cardType === 'creature' && ability.includes('Attack Trigger:')) {
            return 'See Text';
        }

        // SPELLS: Show up to 21 characters
        if (cardType === 'spell') {
            if (ability.length <= 21) {
                return ability;
            }
            // Truncate at 21 characters, add "..."
            return ability.substring(0, 21).trim() + '...';
        }

        // CREATURES: Extract keywords (max 2)
        const foundKeywords = this.extractKeywords(ability);

        if (foundKeywords.length === 0) {
            // No keywords found - show "See Text"
            return 'See Text';
        }

        if (foundKeywords.length <= 2) {
            // 2 or fewer keywords - show them all
            return foundKeywords.join('. ');
        }

        // More than 2 keywords - show first 2 with "+"
        return foundKeywords.slice(0, 2).join('. ') + ' +';
    }

    // Extract keywords from ability text
    extractKeywords(ability) {
        const keywords = [];

        // Check for Deathrattle (should be shown as just "Deathrattle")
        if (ability.includes('Deathrattle:')) {
            keywords.push('Deathrattle');
        }

        // Check for Battlecry (should be shown as just "Battlecry")
        if (ability.includes('Battlecry:')) {
            keywords.push('Battlecry');
        }
        
        // Attack Trigger is a PREFIX, not a keyword - skip it entirely
        // The actual ability after "Attack Trigger:" is too complex to show

        // Check for other keywords (exact matches)
        // IMPORTANT: Check longer keywords FIRST to avoid substring matches
        const otherKeywords = this.keywords.filter(kw => 
            !['Deathrattle', 'Battlecry'].includes(kw)
        ).sort((a, b) => b.length - a.length); // Sort by length descending

        for (let keyword of otherKeywords) {
            // Check if ability contains this keyword
            if (this.containsKeyword(ability, keyword)) {
                // CRITICAL FIX: Check if we already found a keyword that CONTAINS this one
                // (e.g., if we found "Bypass Taunt", don't add "Taunt")
                let isDuplicate = false;
                for (let existing of keywords) {
                    if (existing !== keyword && existing.includes(keyword)) {
                        // Existing keyword contains this one - skip it
                        isDuplicate = true;
                        break;
                    }
                }
                
                if (!isDuplicate) {
                    keywords.push(keyword);
                }
            }
        }

        return keywords;
    }

    // Check if ability contains a keyword
    containsKeyword(ability, keyword) {
        // Special handling for multi-word keywords
        if (keyword.includes(' ')) {
            return ability.includes(keyword);
        }

        // For single-word keywords, check word boundaries
        const regex = new RegExp('\\b' + keyword + '\\b', 'i');
        return regex.test(ability);
    }
}

// Create global instance
window.cardTextAbbreviator = new CardTextAbbreviator();

console.log('✅ Card text abbreviator loaded');
