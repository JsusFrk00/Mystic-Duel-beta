// FORCE CARD TEXT ABBREVIATION - Runtime Override
// This runs LAST and forces text abbreviation for all in-game cards

console.log('🔧 [FORCE FIX] Loading card text abbreviation override...');

(function() {
    function applyFix() {
        if (!window.Game) {
            console.log('⏳ Waiting for Game class...');
            setTimeout(applyFix, 100);
            return;
        }
        
        console.log('✅ [FORCE FIX] Game class found, applying abbreviation...');
        
        // EXACT COPY of card-text-abbreviator.js logic
        const keywords = [
            'Quick', 'Burn', 'Splash 2', 'Splash', 'Taunt', 'Rush', 'Flying', 'Stealth',
            'Charge', 'Haste', 'Vigilance', 'Lifelink', 'Lifesteal', 'Regenerate',
            'Trample', 'Deathtouch', 'Poison', 'First Strike', 'Double Strike',
            'Windfury', 'Divine Shield', 'Spell Shield', 'Enrage', 'Reach',
            'Spell Power +1', 'Spell Power +2', 'Spell Power +3',
            "Can't attack"
        ];
        
        function getShortText(ability, cardType) {
            if (!ability || ability.trim() === '') {
                return '';
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
                return ability.substring(0, 21).trim() + '...';
            }

            // CREATURES: Extract keywords (max 2)
            const foundKeywords = [];

            // Check for Deathrattle
            if (ability.includes('Deathrattle:')) {
                foundKeywords.push('Deathrattle');
            }

            // Check for Battlecry
            if (ability.includes('Battlecry:')) {
                foundKeywords.push('Battlecry');
            }

            // Check for other keywords - longer first to avoid substring matches
            const otherKeywords = keywords.slice().sort((a, b) => b.length - a.length);

            for (let keyword of otherKeywords) {
                // Check if ability contains this keyword
                let hasKeyword = false;
                if (keyword.includes(' ')) {
                    hasKeyword = ability.includes(keyword);
                } else {
                    const regex = new RegExp('\\b' + keyword + '\\b', 'i');
                    hasKeyword = regex.test(ability);
                }
                
                if (hasKeyword) {
                    // Check if we already have a keyword that CONTAINS this one
                    let isDuplicate = false;
                    for (let existing of foundKeywords) {
                        if (existing !== keyword && existing.includes(keyword)) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    
                    if (!isDuplicate) {
                        foundKeywords.push(keyword);
                    }
                }
            }

            if (foundKeywords.length === 0) {
                return 'See Text';
            }

            if (foundKeywords.length <= 2) {
                return foundKeywords.join('. ');
            }

            return foundKeywords.slice(0, 2).join('. ') + ' +';
        }
        
        // OVERRIDE createCardElement
        window.Game.prototype.createCardElement = function(card, isPlayerCard, onField) {
            const cardEl = document.createElement('div');
            let cls = 'card ' + card.type + ' ' + card.rarity;
            if (card.fullArt) cls += ' full-art';
            if (card.splashFriendly) cls += ' splash-friendly';
            cardEl.className = cls;
            cardEl.setAttribute('data-color', card.color || 'colorless');
            
            if (onField) {
                cardEl.style.position = 'relative';
                cardEl.style.zIndex = '10';
                cardEl.style.pointerEvents = 'auto';
            }
            
            // GET ABBREVIATED TEXT
            const shortText = getShortText(card.ability, card.type);
            
            // Check long text
            const longText = card.type === 'creature' && ((card.ability && card.ability.length > 10) || card.name.length > 12);
            
            // Name size
            const nLen = card.name.length;
            const nSize = nLen <= 12 ? 'short' : nLen <= 15 ? 'medium' : nLen <= 18 ? 'long' : 'very-long';
            
            // BUILD HTML
            let h = '<div class="card-info-btn" onclick="showCardInfo(event, ' + JSON.stringify(card).replace(/"/g, '&quot;') + ')">i</div>';
            
            // ✅ FIX: Display actual cost (with reductions) for cards in hand
            const displayCost = (!onField && isPlayerCard && this.calculateActualCost) ? this.calculateActualCost(card, 'player') : card.cost;
            h += '<div class="card-cost">' + displayCost + '</div>';
            h += '<div class="card-name" data-name-length="' + nSize + '">' + card.name + '</div>';
            h += '<div class="card-image">' + card.emoji + '</div>';
            
            if (card.type === 'creature') {
                h += '<div class="card-description">' + shortText + '</div>';
                h += '<div class="card-stats">';
                h += '<span class="attack-stat">' + (longText ? '' : '⚔️ ') + card.attack + '</span>';
                h += '<span class="health-stat">' + (longText ? '' : '❤️ ') + card.health + '</span>';
                h += '</div>';
            } else {
                h += '<div class="card-description">' + shortText + '</div>';
            }
            
            cardEl.innerHTML = h;
            
            const game = this;
            cardEl.onclick = function(e) {
                e.stopPropagation();
                if (!e.target.classList.contains('card-info-btn')) {
                    game.handleCardClick(card, isPlayerCard);
                }
            };
            
            return cardEl;
        };
        
        console.log('✅ [FORCE FIX] createCardElement OVERRIDDEN with abbreviation!');
        console.log('   📝 Attack Trigger: Shows "See Text"');
        console.log('   📝 Keywords: Max 2, then "+"');
        console.log('   📝 Spells: 21 chars max');
        
        // Force refresh if game is active
        if (window.game && window.game.updateDisplay) {
            console.log('🔄 [FORCE FIX] Refreshing active game display...');
            window.game.updateDisplay();
        }
    }
    
    // Run immediately and also after short delay
    applyFix();
    setTimeout(applyFix, 1000);
    setTimeout(applyFix, 2000);
})();
