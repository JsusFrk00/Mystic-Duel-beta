// Trading Block Manager - FIXED VERSION
// Handles the public marketplace for card trading

console.log('[TRADING-BLOCK.JS] Script file is loading...');

class TradingBlock {
    constructor() {
        this.currentListings = [];
        this.myListings = [];
        this.myOffers = [];
        this.marketValues = {};
        this.selectedOfferCards = [];
        this.selectedRequestCards = [];
        this.requestedCardQuantities = {};
        this.currentCounterListingId = null;
        this.notificationCheckInterval = null;
    }

    async show() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('tradingBlockContainer').style.display = 'block';
        
        this.updateCurrencyDisplay();
        
        try {
            await this.loadAllData();
            this.startNotificationPolling();
        } catch (error) {
            // Server connection error - show HTML modal instead of native dialog
            console.error('Failed to load trading block:', error);
            
            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
            
            modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%; color: #333; text-align: center;">' +
                '<div style="font-size: 60px; margin-bottom: 20px;">❌</div>' +
                '<h2 style="color: #f44336; margin-bottom: 20px;">Server Connection Failed</h2>' +
                '<p style="margin-bottom: 15px; line-height: 1.6;">Could not connect to server.</p>' +
                '<p style="margin-bottom: 25px; font-size: 0.9em; color: #666;">Please make sure the server is running and try again.</p>' +
                '<button id="serverErrorBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button>' +
            '</div>';
            
            document.body.appendChild(modal);
            
            document.getElementById('serverErrorBtn').onclick = () => {
                modal.remove();
                this.hide(); // Go back to main menu
            };
        }
    }

    hide() {
        document.getElementById('tradingBlockContainer').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        this.stopNotificationPolling();
    }

    async loadAllData() {
        try {
            const marketData = await window.apiClient.getMarketValues();
            this.marketValues = {};
            marketData.market_values.forEach(card => {
                this.marketValues[card.card_name] = card.current_market_value;
            });

            await this.loadListings();
            await this.loadMyListings();
            await this.loadMyOffers();

            this.renderTabs();
        } catch (error) {
            console.error('Error loading trading data:', error);
            // Re-throw so the show() method can handle it with HTML modal
            throw error;
        }
    }

    async loadListings() {
        const data = await window.apiClient.getListings();
        this.currentListings = data.listings;
    }

    async loadMyListings() {
        const data = await window.apiClient.getMyListings();
        this.myListings = data.listings;
    }

    async loadMyOffers() {
        const data = await window.apiClient.getMyOffers();
        this.myOffers = data.offers;
    }

    renderTabs() {
        this.showTab('browse');
    }

    showTab(tab) {
        document.querySelectorAll('.trading-tab').forEach(btn => btn.classList.remove('active'));
        const tabBtn = document.querySelector(`[data-tab="${tab}"]`);
        if (tabBtn) tabBtn.classList.add('active');

        switch(tab) {
            case 'browse': this.renderBrowseListings(); break;
            case 'myListings': this.renderMyListings(); break;
            case 'myOffers': this.renderMyOffers(); break;
            case 'create': this.renderCreateListing(); break;
            case 'history': this.renderTradeHistory(); break;
        }
    }

    renderBrowseListings() {
        const content = document.getElementById('tradingContent');
        
        if (this.currentListings.length === 0) {
            content.innerHTML = '<div class="empty-state" style="text-align: center; padding: 60px 20px; color: white;">' +
                '<h3 style="font-size: 32px; margin-bottom: 20px;">📭 No Active Listings</h3>' +
                '<p style="margin-bottom: 20px;">Be the first to post a trade!</p>' +
                '<button onclick="tradingBlock.showTab(\'create\')" style="padding: 15px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-size: 16px; font-weight: bold; cursor: pointer;">Create Listing</button>' +
            '</div>';
            return;
        }

        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; padding: 20px;">';
        
        this.currentListings.forEach(listing => {
            const offeredCards = listing.offered_cards || [];
            const requestedCards = listing.requested_cards || [];
            
            const offeredText = offeredCards.map(c => c.card_name + ' x' + c.quantity).join(', ');
            const requestedText = requestedCards.join(', ');
            
            html += '<div style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">';
            html += '<div style="display: flex; justify-content: space-between; margin-bottom: 15px; color: #666; font-size: 0.9em;">';
            html += '<span>Posted ' + this.getTimeAgo(listing.created_at) + '</span>';
            html += '</div>';
            
            html += '<div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin-bottom: 10px;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #333;">🎁 Offering:</h4>';
            html += '<p style="margin: 0; color: #333;">' + (offeredText || 'Nothing') + '</p>';
            html += '</div>';
            
            html += '<div style="text-align: center; font-size: 24px; color: #666; margin: 10px 0;">⇄</div>';
            
            html += '<div style="background: #fff3e0; padding: 15px; border-radius: 10px; margin-bottom: 15px;">';
            html += '<h4 style="margin: 0 0 10px 0; color: #333;">🎯 Wants:</h4>';
            html += '<p style="margin: 0; color: #333;">' + (requestedText || 'Nothing') + '</p>';
            html += '</div>';
            
            html += '<button onclick="tradingBlock.viewListingDetails(' + listing.id + ')" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: bold; cursor: pointer;">View Details</button>';
            html += '</div>';
        });

        html += '</div>';
        content.innerHTML = html;
    }
    
    viewListingDetails(listingId) {
        const listing = this.currentListings.find(l => l.id === listingId);
        if (!listing) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        const offeredCards = listing.offered_cards || [];
        const requestedCards = listing.requested_cards || [];
        
        let offeredHTML = '';
        offeredCards.forEach(c => {
            const marketValue = this.marketValues[c.card_name] || 0;
            offeredHTML += '<div style="display: flex; justify-content: space-between; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px; margin-bottom: 10px;">';
            offeredHTML += '<span style="color: #333;">' + c.card_name + ' x' + c.quantity + '</span>';
            offeredHTML += '<span style="color: #f59e0b; font-weight: bold;">≈' + marketValue + 'g ea.</span>';
            offeredHTML += '</div>';
        });
        
        let requestedHTML = '';
        requestedCards.forEach(cardName => {
            const marketValue = this.marketValues[cardName] || 0;
            const hasCard = (window.playerData?.ownedCards || {})[cardName] > 0;
            requestedHTML += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 8px; margin-bottom: 10px;">';
            requestedHTML += '<span style="color: #333;">' + cardName + '</span>';
            requestedHTML += '<span style="color: #f59e0b; font-weight: bold;">≈' + marketValue + 'g</span>';
            requestedHTML += '<span style="padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold; ' + (hasCard ? 'background: #4caf50; color: white;">✓ Have' : 'background: #f44336; color: white;">✗ Need') + '</span>';
            requestedHTML += '</div>';
        });
        
        modal.innerHTML = '<div style="background: white; padding: 30px; border-radius: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto;">' +
            '<h2 style="color: #333; margin-bottom: 20px;">Trade Listing Details</h2>' +
            '<div style="margin-bottom: 20px;">' +
                '<h3 style="color: #333; margin-bottom: 10px;">🎁 They\'re Offering:</h3>' +
                offeredHTML +
            '</div>' +
            '<div style="margin-bottom: 20px;">' +
                '<h3 style="color: #333; margin-bottom: 10px;">🎯 They Want:</h3>' +
                requestedHTML +
            '</div>' +
            '<div style="display: flex; gap: 10px;">' +
                '<button onclick="tradingBlock.acceptTrade(' + listing.id + ')" style="flex: 1; padding: 12px; background: #4CAF50; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">✅ Accept Trade</button>' +
                '<button onclick="tradingBlock.counterOffer(' + listing.id + ')" style="flex: 1; padding: 12px; background: #2196F3; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">💬 Counter-Offer</button>' +
                '<button id="closeListingDetailsBtn" style="padding: 12px 24px; background: #6c757d; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Add click handler for cancel button
        document.getElementById('closeListingDetailsBtn').onclick = () => {
            modal.remove();
        };
        
        // Allow clicking outside to close
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    renderMyListings() {
        const content = document.getElementById('tradingContent');

        if (this.myListings.length === 0) {
            content.innerHTML = '<div class="empty-state" style="text-align: center; padding: 60px 20px; color: white;">' +
                '<h3 style="font-size: 32px; margin-bottom: 20px;">📋 No Active Listings</h3>' +
                '<p style="margin-bottom: 20px;">Create a listing to start trading!</p>' +
                '<button onclick="tradingBlock.showTab(\'create\')" style="padding: 15px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-size: 16px; font-weight: bold; cursor: pointer;">Create Listing</button>' +
            '</div>';
            return;
        }

        let html = '<div style="padding: 20px;">';

        this.myListings.forEach(listing => {
            const status = listing.status.toUpperCase();
            const counterOfferCount = (listing.counter_offers || []).length;
            const offeredCards = listing.offered_cards || [];
            const requestedCards = listing.requested_cards || [];

            html += '<div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">';
            
            // Header
            html += '<div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">';
            html += '<span style="padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold; background: ' + (status === 'OPEN' ? '#4caf50' : '#9e9e9e') + '; color: white;">' + status + '</span>';
            html += '<span style="color: #666;">' + this.getTimeAgo(listing.created_at) + '</span>';
            html += '</div>';

            // Body
            html += '<p style="margin: 8px 0; color: #333;"><strong>Offering:</strong> ' + offeredCards.map(c => c.card_name).join(', ') + '</p>';
            html += '<p style="margin: 8px 0; color: #333;"><strong>Requesting:</strong> ' + requestedCards.map(r => r.card_name).join(', ') + '</p>';

            // Counter offers section
            if (counterOfferCount > 0) {
                html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-top: 15px;">';
                html += '<h4 style="margin: 0 0 10px 0; color: #333;">💬 Counter-Offers (' + counterOfferCount + ')</h4>';
                
                listing.counter_offers.forEach(offer => {
                    html += '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px;">';
                    html += '<p style="margin: 0 0 8px 0; color: #333;"><strong>From:</strong> ' + offer.responder_username + '</p>';
                    html += '<p style="margin: 0 0 10px 0; color: #333;"><strong>Offering:</strong> ' + offer.offered_cards.map(c => c.card_name + ' x' + c.quantity).join(', ') + '</p>';
                    html += '<div style="display: flex; gap: 10px;">';
                    html += '<button onclick="tradingBlock.acceptCounterOfferAction(' + offer.id + ')" style="flex: 1; padding: 8px; background: #4CAF50; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer;">✅ Accept</button>';
                    html += '<button onclick="tradingBlock.rejectCounterOfferAction(' + offer.id + ')" style="flex: 1; padding: 8px; background: #f44336; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer;">❌ Reject</button>';
                    html += '</div></div>';
                });
                
                html += '</div>';
            }

            // Actions
            if (listing.status === 'open') {
                html += '<button onclick="tradingBlock.cancelListingAction(' + listing.id + ')" style="width: 100%; padding: 10px; margin-top: 15px; background: #f44336; border: none; border-radius: 8px; color: white; font-weight: bold; cursor: pointer;">Cancel Listing</button>';
            }
            
            html += '</div>';
        });

        html += '</div>';
        content.innerHTML = html;
    }

    renderMyOffers() {
        const content = document.getElementById('tradingContent');

        if (this.myOffers.length === 0) {
            content.innerHTML = '<div class="empty-state" style="text-align: center; padding: 60px 20px; color: white;">' +
                '<h3 style="font-size: 32px; margin-bottom: 20px;">💬 No Pending Offers</h3>' +
                '<p>Your counter-offers will appear here.</p>' +
            '</div>';
            return;
        }

        let html = '<div style="padding: 20px;">';

        this.myOffers.forEach(offer => {
            const offeredCards = offer.offered_cards || [];
            const originalRequest = offer.original_request || [];
            
            html += '<div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">';
            
            // Header
            html += '<div style="display: flex; justify-content: space-between; margin-bottom: 15px;">';
            html += '<span style="padding: 4px 12px; border-radius: 12px; font-size: 0.85em; font-weight: bold; background: ' + (offer.status === 'pending' ? '#ff9800' : offer.status === 'accepted' ? '#4caf50' : '#f44336') + '; color: white;">' + offer.status.toUpperCase() + '</span>';
            html += '<span style="color: #666;">' + this.getTimeAgo(offer.created_at) + '</span>';
            html += '</div>';
            
            // Body
            html += '<p style="margin: 8px 0; color: #333;"><strong>You Offered:</strong> ' + offeredCards.map(c => c.card_name + ' x' + c.quantity).join(', ') + '</p>';
            html += '<p style="margin: 8px 0; color: #333;"><strong>They Want:</strong> ' + originalRequest.map(r => r.card_name).join(', ') + '</p>';
            
            if (offer.status === 'pending') {
                html += '<p style="margin-top: 15px; color: #666; font-style: italic;">⏳ Awaiting response...</p>';
            }
            
            html += '</div>';
        });

        html += '</div>';
        content.innerHTML = html;
    }

    renderCreateListing() {
        const content = document.getElementById('tradingContent');
        
        content.innerHTML = '<div class="create-listing-container" style="padding: 40px; color: white;">' +
            '<h2>📝 Create Trade Listing</h2>' +
            '<div class="create-step" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">' +
                '<h3>Step 1: Select cards you want to offer</h3>' +
                '<button onclick="tradingBlock.selectOfferCards()" style="padding: 12px 24px; background: #4CAF50; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; margin-top: 10px;">Choose Cards to Offer</button>' +
                '<div id="selectedOfferDisplay" style="margin-top: 15px; min-height: 20px;"></div>' +
            '</div>' +
            '<div class="create-step" style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">' +
                '<h3>Step 2: Select cards you want in return</h3>' +
                '<button onclick="tradingBlock.selectRequestCards()" style="padding: 12px 24px; background: #2196F3; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: bold; margin-top: 10px;">Choose Cards to Request</button>' +
                '<div id="selectedRequestDisplay" style="margin-top: 15px; min-height: 20px;"></div>' +
            '</div>' +
            '<div class="create-actions" style="margin-top: 30px; display: flex; gap: 15px;">' +
                '<button onclick="tradingBlock.submitListing()" id="submitListingBtn" disabled style="flex: 1; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; opacity: 0.5;">Create Listing</button>' +
                '<button onclick="tradingBlock.showTab(\'browse\')" style="padding: 15px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '</div>' +
        '</div>';
    }

    selectOfferCards() {
        // Check if user has cards
        const cardInstances = window.playerData?.cardInstances || {};
        
        if (Object.keys(cardInstances).length === 0) {
            this.showHTMLAlert('No Cards Available', 'You don\'t have any cards to offer yet. Visit the Card Store to get cards!', 'warning');
            return;
        }
        
        // Group card instances by card name
        const cardsByName = {};
        Object.entries(cardInstances).forEach(([instanceId, cardData]) => {
            // cardData is {name, variant} object, not string
            const cardName = typeof cardData === 'string' ? cardData : cardData.name;
            if (!cardsByName[cardName]) cardsByName[cardName] = [];
            cardsByName[cardName].push(instanceId);
        });
        
        // Build modal HTML using safe string concatenation
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        let cardsHTML = '';
        Object.entries(cardsByName).forEach(([cardName, instances]) => {
            const marketValue = this.marketValues[cardName] || 0;
            const cardData = (window.ALL_CARDS || []).find(c => c.name === cardName);
            const emoji = cardData?.emoji || '🃏';
            const rarity = cardData?.rarity || 'common';
            
            cardsHTML += '<div class="selectable-card" style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;">';
            cardsHTML += '<div style="font-size: 32px; margin-bottom: 8px;">' + emoji + '</div>';
            cardsHTML += '<h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95em;">' + cardName + '</h4>';
            cardsHTML += '<p style="color: #f59e0b; font-weight: bold; margin: 4px 0;">≈' + marketValue + 'g</p>';
            cardsHTML += '<p style="font-size: 0.85em; color: #666; margin: 8px 0;">You have: ' + instances.length + ' ' + rarity + '</p>';
            cardsHTML += '<div class="instance-selector">';
            
            instances.forEach((instanceId, index) => {
                const isChecked = this.selectedOfferCards.includes(instanceId);
                cardsHTML += '<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; background: #f8f9fa; border-radius: 6px; margin-bottom: 4px;">';
                cardsHTML += '<input type="checkbox" data-instance="' + instanceId + '" data-card="' + cardName + '" onchange="tradingBlock.updateSelectedOfferCards()" style="width: 18px; height: 18px; cursor: pointer;"' + (isChecked ? ' checked' : '') + '>';
                cardsHTML += '<span style="color: #333;">Copy ' + (index + 1) + '</span>';
                cardsHTML += '</label>';
            });
            
            cardsHTML += '</div></div>';
        });
        
        modal.innerHTML = '<div class="modal-content" style="background: white; padding: 30px; border-radius: 20px; max-width: 900px; max-height: 85vh; overflow-y: auto;">' +
            '<h2 style="color: #333; margin-bottom: 20px;">Select Cards to Offer</h2>' +
            '<div style="padding: 15px; background: #e8f5e9; border-radius: 10px; margin-bottom: 20px;">' +
                '<p style="margin: 0; color: #333;">Selected: <span id="selectedOfferCount">' + this.selectedOfferCards.length + '</span> cards</p>' +
            '</div>' +
            '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; max-height: 500px; overflow-y: auto; padding: 15px;">' +
                cardsHTML +
            '</div>' +
            '<div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">' +
                '<button id="submitOfferBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Submit</button>' +
                '<button id="cancelOfferBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Add event listeners AFTER appending to DOM
        const submitBtn = document.getElementById('submitOfferBtn');
        const cancelBtn = document.getElementById('cancelOfferBtn');
        
        if (submitBtn) {
            submitBtn.onclick = () => this.submitOfferCards();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeModal();
        }
    }
    
    updateSelectedOfferCards() {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        const count = checkboxes.length;
        const countSpan = document.getElementById('selectedOfferCount');
        if (countSpan) countSpan.textContent = count;
    }
    
    submitOfferCards() {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        this.selectedOfferCards = Array.from(checkboxes).map(cb => cb.getAttribute('data-instance'));
        
        if (this.selectedOfferCards.length === 0) {
            this.showHTMLAlert('No Cards Selected', 'Please select at least one card to offer', 'warning');
            return;
        }
        
        this.closeModal();
        
        // Update display
        const display = document.getElementById('selectedOfferDisplay');
        if (display) {
            display.innerHTML = '<p style="color: #4CAF50; font-weight: bold;">Selected ' + this.selectedOfferCards.length + ' cards</p>';
        }
        
        this.checkCreateListingReady();
    }

    selectRequestCards() {
        const ALL_CARDS = window.ALL_CARDS || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        let cardsHTML = '';
        ALL_CARDS.forEach((card, cardIndex) => {
            const safeId = card.name.replace(/[^a-zA-Z0-9]/g, '_');
            const marketValue = this.marketValues[card.name] || 0;
            
            cardsHTML += '<div class="selectable-card request-card" data-card="' + card.name + '" style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;">';
            cardsHTML += '<div style="font-size: 32px; margin-bottom: 8px;">' + (card.emoji || '🃏') + '</div>';
            cardsHTML += '<h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95em;">' + card.name + '</h4>';
            cardsHTML += '<p style="color: #f59e0b; font-weight: bold; margin: 4px 0;">≈' + marketValue + 'g</p>';
            cardsHTML += '<p style="font-size: 0.85em; color: #666; margin: 4px 0; text-transform: capitalize;">' + card.rarity + '</p>';
            cardsHTML += '<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px;">';
            cardsHTML += '<button onclick="tradingBlock.adjustRequestQty(' + cardIndex + ', -1)" style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #f44336; color: white; cursor: pointer; font-weight: bold; font-size: 16px;">−</button>';
            cardsHTML += '<span id="qty-' + safeId + '" data-card-index="' + cardIndex + '" style="min-width: 30px; text-align: center; font-weight: bold; color: #333; font-size: 16px;">0</span>';
            cardsHTML += '<button onclick="tradingBlock.adjustRequestQty(' + cardIndex + ', 1)" style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #4CAF50; color: white; cursor: pointer; font-weight: bold; font-size: 16px;">+</button>';
            cardsHTML += '</div></div>';
        });
        
        modal.innerHTML = '<div class="modal-content" style="background: white; padding: 30px; border-radius: 20px; max-width: 900px; max-height: 85vh; overflow-y: auto;">' +
            '<h2 style="color: #333; margin-bottom: 20px;">Select Cards to Request</h2>' +
            '<div style="padding: 15px; background: #e8f5e9; border-radius: 10px; margin-bottom: 20px;">' +
                '<p style="margin: 0; color: #333;">Selected: <span id="selectedRequestCount">0</span> cards</p>' +
            '</div>' +
            '<div style="margin-bottom: 15px;">' +
                '<input type="text" id="cardSearchInput" placeholder="Search cards..." onkeyup="tradingBlock.filterRequestCards(this.value)" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">' +
            '</div>' +
            '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; max-height: 400px; overflow-y: auto; padding: 15px;">' +
                cardsHTML +
            '</div>' +
            '<div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">' +
                '<button id="confirmRequestBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Confirm</button>' +
                '<button id="cancelRequestBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Add event listeners AFTER appending to DOM
        const confirmBtn = document.getElementById('confirmRequestBtn');
        const cancelBtn = document.getElementById('cancelRequestBtn');
        
        if (confirmBtn) {
            confirmBtn.onclick = () => this.submitRequestCards();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeModal();
        }
    }
    
    adjustRequestQty(cardIndex, delta) {
        const ALL_CARDS = window.ALL_CARDS || [];
        const card = ALL_CARDS[cardIndex];
        if (!card) return;
        
        const safeId = card.name.replace(/[^a-zA-Z0-9]/g, '_');
        const qtySpan = document.getElementById('qty-' + safeId);
        if (!qtySpan) return;
        
        let currentQty = parseInt(qtySpan.textContent) || 0;
        currentQty = Math.max(0, currentQty + delta); // Removed upper limit!
        
        qtySpan.textContent = currentQty;
        
        if (currentQty > 0) {
            this.requestedCardQuantities[card.name] = currentQty;
        } else {
            delete this.requestedCardQuantities[card.name];
        }
        
        this.updateRequestCardsDisplay();
    }
    
    updateRequestCardsDisplay() {
        const count = Object.values(this.requestedCardQuantities).reduce((sum, qty) => sum + qty, 0);
        const countSpan = document.getElementById('selectedRequestCount');
        if (countSpan) countSpan.textContent = count;
    }
    
    filterRequestCards(searchTerm) {
        const cards = document.querySelectorAll('.request-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const cardName = card.getAttribute('data-card').toLowerCase();
            if (cardName.includes(term)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    submitRequestCards() {
        this.selectedRequestCards = [];
        
        Object.entries(this.requestedCardQuantities).forEach(([cardName, quantity]) => {
            for (let i = 0; i < quantity; i++) {
                this.selectedRequestCards.push(cardName);
            }
        });
        
        if (this.selectedRequestCards.length === 0) {
            this.showHTMLAlert('No Cards Selected', 'Please select at least one card to request', 'warning');
            return;
        }
        
        this.closeModal();
        
        // Display formatted request
        const summary = {};
        this.selectedRequestCards.forEach(card => {
            summary[card] = (summary[card] || 0) + 1;
        });
        
        const displayText = Object.entries(summary).map(([card, qty]) => card + ' x' + qty).join(', ');
        
        const display = document.getElementById('selectedRequestDisplay');
        if (display) {
            display.innerHTML = '<p style="color: #2196F3; font-weight: bold;">Requesting: ' + displayText + '</p>';
        }
        
        // Reset quantities for next time
        this.requestedCardQuantities = {};
        
        this.checkCreateListingReady();
    }

    async submitListing() {
        if (this.selectedOfferCards.length === 0 || this.selectedRequestCards.length === 0) {
            this.showHTMLAlert('Incomplete Listing', 'Please select both cards to offer and cards to request', 'warning');
            return;
        }
        
        try {
            const result = await window.apiClient.createListing(
                this.selectedOfferCards,
                this.selectedRequestCards
            );

            if (result.success) {
                this.showHTMLAlert('Success', 'Listing created successfully!', 'success');
                this.selectedOfferCards = [];
                this.selectedRequestCards = [];
                await this.loadAllData();
                this.showTab('myListings');
            }
        } catch (error) {
            this.showHTMLAlert('Failed', 'Failed to create listing: ' + error.message, 'error');
        }
    }
    
    showHTMLAlert(title, message, type) {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const colors = { success: '#4CAF50', error: '#f44336', warning: '#ff9800', info: '#2196F3' };
        
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%; color: #333; text-align: center;">' +
            '<div style="font-size: 60px; margin-bottom: 20px;">' + icons[type] + '</div>' +
            '<h2 style="color: ' + colors[type] + '; margin-bottom: 20px;">' + title + '</h2>' +
            '<p style="margin-bottom: 25px; line-height: 1.6;">' + message + '</p>' +
            '<button id="htmlAlertBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        document.getElementById('htmlAlertBtn').onclick = function() {
            modal.remove();
        };
    }

    checkCreateListingReady() {
        const btn = document.getElementById('submitListingBtn');
        if (!btn) return;
        
        const ready = this.selectedOfferCards.length > 0 && this.selectedRequestCards.length > 0;
        btn.disabled = !ready;
        btn.style.opacity = ready ? '1' : '0.5';
    }

    async renderTradeHistory() {
        const content = document.getElementById('tradingContent');
        
        try {
            const data = await window.apiClient.getTradeHistory();
            const trades = data.trades || [];

            if (trades.length === 0) {
                content.innerHTML = '<div class="empty-state" style="text-align: center; padding: 60px 20px; color: white;">' +
                    '<h3 style="font-size: 32px; margin-bottom: 20px;">📜 No Trade History</h3>' +
                    '<p>Your completed trades will appear here.</p>' +
                '</div>';
                return;
            }

            let html = '<div style="padding: 20px;">';

            trades.forEach(trade => {
                const isUser1 = window.playerData?.userId === trade.user1_id;
                const otherUserName = isUser1 ? trade.user2_name : trade.user1_name;
                
                const itemsSent = trade.items_sent || [];
                const itemsReceived = trade.items_received || [];

                html += '<div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 15px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">';
                
                // Header
                html += '<div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0;">';
                html += '<span style="color: #333; font-weight: bold;">Traded with: ' + otherUserName + '</span>';
                html += '<span style="color: #666;">' + this.getTimeAgo(trade.completed_at) + '</span>';
                html += '</div>';
                
                // Trade details
                html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
                
                // Sent
                html += '<div style="padding: 15px; border-radius: 8px; background: #ffebee;">';
                html += '<h4 style="margin: 0 0 10px 0; color: #333;">📤 You Gave:</h4>';
                html += '<ul style="margin: 0; padding-left: 20px; color: #333;">';
                itemsSent.forEach(item => {
                    html += '<li>' + item.card_name + '</li>';
                });
                html += '</ul></div>';
                
                // Received
                html += '<div style="padding: 15px; border-radius: 8px; background: #e8f5e9;">';
                html += '<h4 style="margin: 0 0 10px 0; color: #333;">📥 You Got:</h4>';
                html += '<ul style="margin: 0; padding-left: 20px; color: #333;">';
                itemsReceived.forEach(item => {
                    html += '<li>' + item.card_name + '</li>';
                });
                html += '</ul></div>';
                
                html += '</div></div>';
            });

            html += '</div>';
            content.innerHTML = html;

        } catch (error) {
            console.error('Error loading trade history:', error);
            content.innerHTML = '<div style="text-align: center; padding: 40px; color: white;"><p>Error loading trade history</p></div>';
        }
    }

    async refreshPlayerData() {
        const data = await window.apiClient.getPlayerData();
        window.storage.setPlayerDataFromServer(data);
        window.ui.updateCurrencyDisplay();
        this.updateCurrencyDisplay();
    }

    startNotificationPolling() {
        // Placeholder
    }

    stopNotificationPolling() {
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
        }
    }

    updateCurrencyDisplay() {
        const gold = window.playerData?.gold || 0;
        const gems = window.playerData?.gems || 0;
        
        const tradingGold = document.getElementById('tradingGoldAmount');
        const tradingGems = document.getElementById('tradingGemAmount');
        
        if (tradingGold) tradingGold.textContent = gold;
        if (tradingGems) tradingGems.textContent = gems;
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }
    
    acceptTrade(listingId) {
        const listing = this.currentListings.find(l => l.id === listingId);
        if (!listing) return;
        
        this.closeModal(); // Close the listing details modal first
        
        // Build card instance selector
        const cardInstancesNeeded = {};
        const requestedCards = listing.requested_cards || [];
        
        requestedCards.forEach(cardName => {
            cardInstancesNeeded[cardName] = (cardInstancesNeeded[cardName] || 0) + 1;
        });

        // Get user's instances of needed cards
        const availableInstances = {};
        const cardInstances = window.playerData?.cardInstances || {};
        
        Object.entries(cardInstances).forEach(([instanceId, cardData]) => {
            const cardName = typeof cardData === 'string' ? cardData : cardData.name;
            if (cardInstancesNeeded[cardName]) {
                if (!availableInstances[cardName]) availableInstances[cardName] = [];
                availableInstances[cardName].push(instanceId);
            }
        });

        // Check if user has all required cards
        const canAccept = Object.keys(cardInstancesNeeded).every(cardName => {
            const needed = cardInstancesNeeded[cardName];
            const available = (availableInstances[cardName] || []).length;
            return available >= needed;
        });

        if (!canAccept) {
            this.showHTMLAlert('Missing Cards', 'You don\'t have all the required cards for this trade.', 'warning');
            return;
        }

        // Auto-select required instances
        const selectedInstances = [];
        Object.entries(cardInstancesNeeded).forEach(([cardName, needed]) => {
            const instances = availableInstances[cardName];
            for (let i = 0; i < needed; i++) {
                selectedInstances.push(instances[i]);
            }
        });

        // Confirm trade
        const offeredText = (listing.offered_cards || []).map(c => c.card_name + ' x' + c.quantity).join(', ');
        const requestedText = requestedCards.join(', ');
        
        this.showHTMLConfirm(
            'Accept Trade?',
            'You will give: ' + requestedText + '\n\nYou will receive: ' + offeredText,
            () => this.executeAcceptTrade(listingId, selectedInstances)
        );
    }
    
    async executeAcceptTrade(listingId, cardInstanceIds) {
        try {
            const result = await window.apiClient.acceptListing(listingId, cardInstanceIds);
            
            if (result.success) {
                this.showHTMLAlert('Success', 'Trade completed successfully!', 'success');
                await this.refreshPlayerData();
                await this.loadAllData();
                this.showTab('browse');
            }
        } catch (error) {
            this.showHTMLAlert('Trade Failed', error.message, 'error');
        }
    }
    
    counterOffer(listingId) {
        this.closeModal(); // Close the listing details modal
        this.currentCounterListingId = listingId;
        
        // Open card selector for counter-offer
        this.selectCounterOfferCards(listingId);
    }
    
    selectCounterOfferCards(listingId) {
        const cardInstances = window.playerData?.cardInstances || {};
        
        if (Object.keys(cardInstances).length === 0) {
            this.showHTMLAlert('No Cards Available', 'You don\'t have any cards to offer. Visit the Card Store to get cards!', 'warning');
            return;
        }
        
        // Group card instances by card name
        const cardsByName = {};
        Object.entries(cardInstances).forEach(([instanceId, cardData]) => {
            const cardName = typeof cardData === 'string' ? cardData : cardData.name;
            if (!cardsByName[cardName]) cardsByName[cardName] = [];
            cardsByName[cardName].push(instanceId);
        });
        
        // Build modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        let cardsHTML = '';
        Object.entries(cardsByName).forEach(([cardName, instances]) => {
            const marketValue = this.marketValues[cardName] || 0;
            const cardData = (window.ALL_CARDS || []).find(c => c.name === cardName);
            const emoji = cardData?.emoji || '🃏';
            const rarity = cardData?.rarity || 'common';
            
            cardsHTML += '<div class="selectable-card" style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;">';
            cardsHTML += '<div style="font-size: 32px; margin-bottom: 8px;">' + emoji + '</div>';
            cardsHTML += '<h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95em;">' + cardName + '</h4>';
            cardsHTML += '<p style="color: #f59e0b; font-weight: bold; margin: 4px 0;">≈' + marketValue + 'g</p>';
            cardsHTML += '<p style="font-size: 0.85em; color: #666; margin: 8px 0;">You have: ' + instances.length + ' ' + rarity + '</p>';
            cardsHTML += '<div class="instance-selector">';
            
            instances.forEach((instanceId, index) => {
                cardsHTML += '<label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; background: #f8f9fa; border-radius: 6px; margin-bottom: 4px;">';
                cardsHTML += '<input type="checkbox" data-instance="' + instanceId + '" data-card="' + cardName + '" onchange="tradingBlock.updateSelectedCounterCards()" style="width: 18px; height: 18px; cursor: pointer;">';
                cardsHTML += '<span style="color: #333;">Copy ' + (index + 1) + '</span>';
                cardsHTML += '</label>';
            });
            
            cardsHTML += '</div></div>';
        });
        
        modal.innerHTML = '<div class="modal-content" style="background: white; padding: 30px; border-radius: 20px; max-width: 900px; max-height: 85vh; overflow-y: auto;">' +
            '<h2 style="color: #333; margin-bottom: 20px;">Select Cards for Counter-Offer</h2>' +
            '<div style="padding: 15px; background: #e8f5e9; border-radius: 10px; margin-bottom: 20px;">' +
                '<p style="margin: 0; color: #333;">Selected: <span id="selectedCounterCount">0</span> cards</p>' +
            '</div>' +
            '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; max-height: 500px; overflow-y: auto; padding: 15px;">' +
                cardsHTML +
            '</div>' +
            '<div style="margin-top: 20px; display: flex; gap: 15px; justify-content: center;">' +
                '<button id="submitCounterBtn" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Submit Counter-Offer</button>' +
                '<button id="cancelCounterBtn" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer;">Cancel</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        // Add event listeners AFTER appending to DOM
        const submitBtn = document.getElementById('submitCounterBtn');
        const cancelBtn = document.getElementById('cancelCounterBtn');
        
        if (submitBtn) {
            submitBtn.onclick = () => this.submitCounterOffer();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeModal();
        }
    }
    
    updateSelectedCounterCards() {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        const count = checkboxes.length;
        const countSpan = document.getElementById('selectedCounterCount');
        if (countSpan) countSpan.textContent = count;
    }
    
    async submitCounterOffer() {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        const selectedInstances = Array.from(checkboxes).map(cb => cb.getAttribute('data-instance'));
        
        if (selectedInstances.length === 0) {
            this.showHTMLAlert('No Cards Selected', 'Please select at least one card for your counter-offer', 'warning');
            return;
        }
        
        this.closeModal();
        
        try {
            const result = await window.apiClient.createCounterOffer(this.currentCounterListingId, selectedInstances);
            
            if (result.success) {
                this.showHTMLAlert('Success', 'Counter-offer sent successfully!', 'success');
                await this.loadAllData();
                this.showTab('myOffers');
            }
        } catch (error) {
            this.showHTMLAlert('Failed', 'Failed to create counter-offer: ' + error.message, 'error');
        }
    }
    
    showHTMLConfirm(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;';
        
        const modalId = 'confirm-' + Date.now();
        
        modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%; color: #333; text-align: center;">' +
            '<h2 style="color: #667eea; margin-bottom: 20px;">' + title + '</h2>' +
            '<p style="margin-bottom: 25px; line-height: 1.6; white-space: pre-line;">' + message + '</p>' +
            '<div style="display: flex; gap: 15px; justify-content: center;">' +
                '<button id="' + modalId + '-cancel" style="padding: 12px 30px; background: #6c757d; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em;">Cancel</button>' +
                '<button id="' + modalId + '-confirm" style="padding: 12px 30px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Confirm</button>' +
            '</div>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        document.getElementById(modalId + '-confirm').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        
        document.getElementById(modalId + '-cancel').onclick = () => {
            modal.remove();
        };
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);
        if (seconds < 60) return seconds + 's ago';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
        return Math.floor(seconds / 86400) + 'd ago';
    }
    
    async acceptCounterOfferAction(responseId) {
        this.showHTMLConfirm(
            'Accept Counter-Offer?',
            'Are you sure you want to accept this counter-offer?',
            async () => {
                try {
                    const result = await window.apiClient.acceptCounter(responseId);
                    if (result.success) {
                        this.showHTMLAlert('Success', 'Counter-offer accepted! Trade completed.', 'success');
                        await this.refreshPlayerData();
                        await this.loadAllData();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showHTMLAlert('Failed', error.message, 'error');
                }
            }
        );
    }
    
    async rejectCounterOfferAction(responseId) {
        this.showHTMLConfirm(
            'Reject Counter-Offer?',
            'Are you sure you want to reject this counter-offer?',
            async () => {
                try {
                    const result = await window.apiClient.rejectCounter(responseId);
                    if (result.success) {
                        this.showHTMLAlert('Rejected', 'Counter-offer rejected.', 'info');
                        await this.loadMyListings();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showHTMLAlert('Failed', error.message, 'error');
                }
            }
        );
    }
    
    async cancelListingAction(listingId) {
        this.showHTMLConfirm(
            'Cancel Listing?',
            'Are you sure you want to cancel this listing?',
            async () => {
                try {
                    const result = await window.apiClient.cancelListing(listingId);
                    if (result.success) {
                        this.showHTMLAlert('Cancelled', 'Listing cancelled successfully.', 'info');
                        await this.loadAllData();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showHTMLAlert('Failed', error.message, 'error');
                }
            }
        );
    }
}

// Create global instance
window.tradingBlock = new TradingBlock();
console.log('✅ Trading Block loaded successfully - MINIMAL VERSION');
