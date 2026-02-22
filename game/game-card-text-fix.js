// In-Game Card Text Abbreviation Fix
// Applies the same text abbreviation rules as Collection to cards during gameplay

console.log('🔧 Applying in-game card text abbreviation fix...');

if (typeof window.Game !== 'undefined') {
    console.log('✅ Game class found, patching createCardElement...');
    
    // Helper: Abbreviate ability text (same logic as Collection)
    function abbreviateAbility(ability, cardType) {
        if (!ability || ability.trim() === '') {
            return '';
        }

        // SPELLS: Show up to 21 characters
        if (cardType === 'spell') {
            if (ability.length <= 21) {
                return ability;
            }
            return ability.substring(0, 21).trim() + '...';
        }

        // CREATURES: Extract keywords (max 2)
        const keywords = extractKeywords(ability);

        if (keywords.length === 0) {
            return 'See Text';
        }

        if (keywords.length <= 2) {
            return keywords.join('. ');
        }

        return keywords.slice(0, 2).join('. ') + ' +';
    }

    // Helper: Extract keywords from ability text
    function extractKeywords(ability) {
        const keywords = [];
        const keywordList = [
            'Quick', 'Burn', 'Splash 2', 'Splash', 'Taunt', 'Rush', 'Flying', 'Stealth',
            'Charge', 'Haste', 'Vigilance', 'Lifelink', 'Lifesteal', 'Regenerate',
            'Trample', 'Deathtouch', 'Poison', 'First Strike', 'Double Strike',
            'Windfury', 'Divine Shield', 'Spell Shield', 'Enrage', 'Reach',
            'Spell Power +1', 'Spell Power +2', 'Spell Power +3'
        ];

        // Check for Deathrattle
        if (ability.includes('Deathrattle:')) {
            keywords.push('Deathrattle');
        }

        // Check for Battlecry
        if (ability.includes('Battlecry:')) {
            keywords.push('Battlecry');
        }

        // Check for Attack Trigger
        if (ability.includes('Attack Trigger:')) {
            keywords.push('Attack Trigger');
        }

        // Check other keywords (longest first to avoid substring issues)
        const sortedKeywords = keywordList.sort(function(a, b) { return b.length - a.length; });
        
        for (var i = 0; i < sortedKeywords.length; i++) {
            var keyword = sortedKeywords[i];
            if (ability.includes(keyword)) {
                // Check for duplicates
                var isDuplicate = false;
                for (var j = 0; j < keywords.length; j++) {
                    if (keywords[j] !== keyword && keywords[j].includes(keyword)) {
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

    // Helper: Get name length category
    function getNameLengthCategory(name) {
        var length = name.length;
        if (length <= 12) return 'short';
        if (length <= 15) return 'medium';
        if (length <= 18) return 'long';
        return 'very-long';
    }

    // Override createCardElement with fixed version
    window.Game.prototype.createCardElement = function(card, isPlayerCard, onField) {
        onField = onField || false;
        
        var cardEl = document.createElement('div');
        var classes = 'card ' + card.type + ' ' + card.rarity + ' ' + (card.color || 'colorless');
        if (card.fullArt) classes += ' full-art';
        if (card.splashFriendly) classes += ' splash-friendly';
        cardEl.className = classes;
        cardEl.setAttribute('data-color', card.color || 'colorless');
        cardEl.setAttribute('data-rarity', card.rarity);
        
        if (onField) {
            cardEl.style.position = 'relative';
            cardEl.style.zIndex = '10';
            cardEl.style.pointerEvents = 'auto';
        }
        
        // ABBREVIATE TEXT (same as Collection)
        var displayText = abbreviateAbility(card.ability || '', card.type);
        
        // Add splash indicator
        if (card.splashFriendly && card.splashBonus) {
            if (card.type === 'spell' && displayText.length < 15) {
                displayText = displayText + ' [Splash]';
            } else if (card.type === 'creature' && displayText !== 'See Text') {
                displayText = displayText + ' [S]';
            }
        }
        
        // Check if we should hide stat emojis
        var hasLongText = card.type === 'creature' && (
            (card.ability && card.ability.length > 10) || 
            (card.name && card.name.length > 12)
        );
        
        // Build HTML
        var html = '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
        
        // FIX: Display actual cost (with reductions) for cards in hand
        var displayCost = (!onField && isPlayerCard) ? this.calculateActualCost(card, 'player') : card.cost;
        html += '<div class="card-cost">' + displayCost + '</div>';
        
        // Dynamic name sizing
        var nameLength = getNameLengthCategory(card.name);
        html += '<div class="card-name" data-name-length="' + nameLength + '">' + card.name + '</div>';
        
        html += '<div class="card-image">' + card.emoji + '</div>';
        
        if (card.type === 'creature') {
            html += '<div class="card-description">' + displayText + '</div>';
            html += '<div class="card-stats">';
            html += '<span class="attack-stat">' + (hasLongText ? '' : '⚔️ ') + card.attack + '</span>';
            html += '<span class="health-stat">' + (hasLongText ? '' : '❤️ ') + card.health + '</span>';
            html += '</div>';
        } else {
            html += '<div class="card-description">' + displayText + '</div>';
        }
        
        cardEl.innerHTML = html;
        
        var self = this;
        cardEl.onclick = function(e) {
            e.stopPropagation();
            if (!e.target.classList.contains('card-info-btn')) {
                self.handleCardClick(card, isPlayerCard);
            }
        };
        
        return cardEl;
    };
    
    console.log('✅ In-game card text abbreviation applied!');
    console.log('   - Creatures: Show first 2 keywords + "+" if more');
    console.log('   - Spells: Show first 21 characters');
    console.log('   - Long names: Dynamic font sizing');
    console.log('   - Text no longer overflows!');
} else {
    console.warn('⚠️ Game class not found. Load this after Game.js');
}
