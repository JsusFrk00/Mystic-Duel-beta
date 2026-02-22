// Trading Block Manager
// Handles the public marketplace for card trading

console.log('[TRADING-BLOCK.JS] Script file is loading...');
console.log('[TRADING-BLOCK.JS] Current timestamp:', new Date().toISOString());

class TradingBlock {
    constructor() {
        this.currentListings = [];
        this.myListings = [];
        this.myOffers = [];
        this.marketValues = {};
        this.selectedOfferCards = [];
        this.selectedRequestCards = [];
        this.requestedCardQuantities = {};
        this.notificationCheckInterval = null;
    }

    // ============ MODAL HELPERS ============
    
    showAlert(title, message, type = 'info') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 450px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">${icons[type]}</div>
                <h2 style="color: ${colors[type]}; margin-bottom: 20px;">${title}</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">${message}</p>
                <button onclick="this.closest('.modal-overlay').remove()" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                ">OK</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }

    showConfirm(title, message, onConfirm, onCancel = null) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        const modalId = 'confirm-' + Date.now();
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 450px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <h2 style="color: #667eea; margin-bottom: 20px;">${title}</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">${message}</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button id="${modalId}-cancel" style="
                        padding: 12px 30px;
                        background: #6c757d;
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                    ">Cancel</button>
                    <button id="${modalId}-confirm" style="
                        padding: 12px 30px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border: none;
                        border-radius: 10px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        font-size: 1em;
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    ">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById(`${modalId}-confirm`).onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
        
        document.getElementById(`${modalId}-cancel`).onclick = () => {
            modal.remove();
            if (onCancel) onCancel();
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        };
    }

    // ============ MAIN METHODS ============

    async show() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('tradingBlockContainer').style.display = 'block';
        
        // Update currency display in trading block header
        this.updateCurrencyDisplay();
        
        await this.loadAllData();
        this.startNotificationPolling();
    }

    hide() {
        document.getElementById('tradingBlockContainer').style.display = 'none';
        document.getElementById('mainMenu').style.display = 'flex';
        this.stopNotificationPolling();
    }

    async loadAllData() {
        try {
            // Load market values
            const marketData = await window.apiClient.getMarketValues();
            this.marketValues = {};
            marketData.market_values.forEach(card => {
                this.marketValues[card.card_name] = card.current_market_value;
            });

            // Load listings
            await this.loadListings();
            await this.loadMyListings();
            await this.loadMyOffers();

            this.renderTabs();
        } catch (error) {
            console.error('Error loading trading data:', error);
            this.showAlert('Error', 'Failed to load trading block: ' + error.message, 'error');
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
        // Render browse tab by default
        this.showTab('browse');
    }

    showTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.trading-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Render appropriate content
        switch(tab) {
            case 'browse':
                this.renderBrowseListings();
                break;
            case 'myListings':
                this.renderMyListings();
                break;
            case 'myOffers':
                this.renderMyOffers();
                break;
            case 'create':
                this.renderCreateListing();
                break;
            case 'history':
                this.renderTradeHistory();
                break;
        }
    }

    renderBrowseListings() {
        const content = document.getElementById('tradingContent');
        
        if (this.currentListings.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>📭 No Active Listings</h3>
                    <p>Be the first to post a trade!</p>
                    <button onclick="tradingBlock.showTab('create')">Create Listing</button>
                </div>
            `;
            return;
        }

        let html = '<div class="listings-grid">';
        
        this.currentListings.forEach(listing => {
            const offeredText = listing.offered_cards.map(c => 
                `${c.card_name} x${c.quantity}`
            ).join(', ');

            const requestedText = listing.requested_cards.join(', ');

            html += `
                <div class="listing-card">
                    <div class="listing-header">
                        <span class="listing-age">${this.getTimeAgo(listing.created_at)}</span>
                    </div>
                    <div class="listing-body">
                        <div class="offering">
                            <h4>🎁 Offering:</h4>
                            <p>${offeredText}</p>
                        </div>
                        <div class="arrow">⇄</div>
                        <div class="requesting">
                            <h4>🎯 Wants:</h4>
                            <p>${requestedText}</p>
                        </div>
                    </div>
                    <div class="listing-actions">
                        <button onclick="tradingBlock.viewListing(${listing.id})">View Details</button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;
    }

    async viewListing(listingId) {
        const listing = this.currentListings.find(l => l.id === listingId);
        if (!listing) return;

        // Show modal with full details
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content listing-modal">
                <h2>Trade Listing</h2>
                
                <div class="listing-details">
                    <div class="offering-section">
                        <h3>🎁 They're Offering:</h3>
                        ${listing.offered_cards.map(c => {
                            const marketValue = this.marketValues[c.card_name] || 0;
                            return `
                                <div class="card-item">
                                    <span>${c.card_name} x${c.quantity}</span>
                                    <span class="market-value">≈${marketValue}g ea.</span>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="requesting-section">
                        <h3>🎯 They Want:</h3>
                        ${listing.requested_cards.map(cardName => {
                            const marketValue = this.marketValues[cardName] || 0;
                            const hasCard = window.playerData.ownedCards[cardName] > 0;
                            return `
                                <div class="card-item ${hasCard ? 'have' : 'need'}">
                                    <span>${cardName}</span>
                                    <span class="market-value">≈${marketValue}g</span>
                                    ${hasCard ? '<span class="badge">✓ You have</span>' : '<span class="badge">✗ Missing</span>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="modal-actions">
                    <button onclick="tradingBlock.acceptListingDialog(${listingId})">✅ Accept Trade</button>
                    <button onclick="tradingBlock.counterOfferDialog(${listingId})">💬 Counter-Offer</button>
                    <button onclick="tradingBlock.closeModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal();
        };
    }

    acceptListingDialog(listingId) {
        const listing = this.currentListings.find(l => l.id === listingId);
        if (!listing) return;

        // Build card instance selector
        const cardInstancesNeeded = {};
        listing.requested_cards.forEach(cardName => {
            cardInstancesNeeded[cardName] = (cardInstancesNeeded[cardName] || 0) + 1;
        });

        // Get user's instances of needed cards
        const availableInstances = {};
        const cardInstances = window.playerData.cardInstances || {};
        
        Object.entries(cardInstances).forEach(([instanceId, cardName]) => {
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
            this.showAlert('Missing Cards', 'You don\'t have all the required cards for this trade.', 'warning');
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

        // Confirm
        this.closeModal();
        setTimeout(() => {
            this.showConfirm(
                'Accept Trade?',
                `You will give: ${listing.requested_cards.join(', ')}\n\nYou will receive: ${listing.offered_cards.map(c => c.card_name + ' x' + c.quantity).join(', ')}`,
                () => this.acceptListing(listingId, selectedInstances)
            );
        }, 100);
    }

    async acceptListing(listingId, cardInstanceIds) {
        try {
            const result = await window.apiClient.acceptListing(listingId, cardInstanceIds);
            
            if (result.success) {
                this.showAlert('Success', 'Trade completed successfully!', 'success');
                await this.refreshPlayerData();
                await this.loadAllData();
                this.showTab('browse');
            }
        } catch (error) {
            this.showAlert('Trade Failed', error.message, 'error');
        }
    }

    counterOfferDialog(listingId) {
        // Show card selector modal
        this.closeModal();
        
        setTimeout(() => {
            this.showCardSelectorModal(listingId, 'counter');
        }, 100);
    }

    showCardSelectorModal(listingId, mode) {
        // mode: 'counter' or 'create'
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        
        const playerCards = window.playerData?.cardInstances || {};
        const cardsByName = {};
        
        // Group card instances by card name
        Object.entries(playerCards).forEach(([instanceId, cardName]) => {
            if (!cardsByName[cardName]) cardsByName[cardName] = [];
            cardsByName[cardName].push(instanceId);
        });
        
        // Check if user has any cards
        if (Object.keys(cardsByName).length === 0) {
            this.closeModal();
            this.showAlert('No Cards Available', 'You don\'t have any cards to offer yet. Visit the Card Store to get cards!', 'warning');
            return;
        }

        modal.innerHTML = `
            <div class="modal-content card-selector-modal">
                <h2>Select Cards to ${mode === 'counter' ? 'Counter-Offer' : 'Offer'}</h2>
                
                <div class="selected-cards" id="selectedCardsDisplay">
                    <p>Selected: <span id="selectedCount">0</span> cards</p>
                </div>

                <div class="card-grid" style="max-height: 500px; overflow-y: auto;">
                    ${Object.entries(cardsByName).map(([cardName, instances]) => {
                        const marketValue = this.marketValues[cardName] || 0;
                        const cardData = (window.ALL_CARDS || []).find(c => c.name === cardName);
                        const emoji = cardData?.emoji || '🃏';
                        const rarity = cardData?.rarity || 'common';
                        return `
                            <div class="selectable-card" style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 8px;">${emoji}</div>
                                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95em;">${cardName}</h4>
                                <p class="market-value" style="color: #f59e0b; font-weight: bold; margin: 4px 0;">≈${marketValue}g</p>
                                <p style="font-size: 0.85em; color: #666; margin: 8px 0; text-transform: capitalize;">You have: ${instances.length} ${rarity}</p>
                                <div class="instance-selector">
                                    ${instances.map((instanceId, index) => `
                                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; background: #f8f9fa; border-radius: 6px; margin-bottom: 4px;">
                                            <input type="checkbox" 
                                                   data-instance="${instanceId}" 
                                                   data-card="${cardName}"
                                                   onchange="tradingBlock.updateSelectedCards()"
                                                   style="width: 18px; height: 18px; cursor: pointer;">
                                            <span style="color: #333;">Copy ${index + 1}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="modal-actions">
                    <button onclick="tradingBlock.submitCardSelection(${listingId}, '${mode}')">Submit</button>
                    <button onclick="tradingBlock.closeModal()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    updateSelectedCards() {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        document.getElementById('selectedCount').textContent = checkboxes.length;
    }

    async submitCardSelection(listingId, mode) {
        const checkboxes = document.querySelectorAll('input[data-instance]:checked');
        const selectedInstances = Array.from(checkboxes).map(cb => cb.dataset.instance);

        if (selectedInstances.length === 0) {
            this.showAlert('No Cards Selected', 'Please select at least one card', 'warning');
            return;
        }

        this.closeModal();

        try {
            if (mode === 'counter') {
                const result = await window.apiClient.createCounterOffer(listingId, selectedInstances);
                if (result.success) {
                    this.showAlert('Success', 'Counter-offer sent!', 'success');
                    await this.loadMyOffers();
                    this.showTab('myOffers');
                }
            } else if (mode === 'create') {
                // Mode create is handled separately in create listing flow
                this.selectedOfferCards = selectedInstances;
                this.continueCreateListing();
            }
        } catch (error) {
            this.showAlert('Failed', error.message, 'error');
        }
    }

    renderMyListings() {
        const content = document.getElementById('tradingContent');

        if (this.myListings.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>📋 No Active Listings</h3>
                    <p>Create a listing to start trading!</p>
                    <button onclick="tradingBlock.showTab('create')">Create Listing</button>
                </div>
            `;
            return;
        }

        let html = '<div class="my-listings">';

        this.myListings.forEach(listing => {
            const status = listing.status.toUpperCase();
            const counterOfferCount = listing.counter_offers?.length || 0;

            html += `
                <div class="my-listing-card ${listing.status}">
                    <div class="listing-header">
                        <span class="status-badge">${status}</span>
                        <span>${this.getTimeAgo(listing.created_at)}</span>
                    </div>

                    <div class="listing-body">
                        <p><strong>Offering:</strong> ${listing.offered_cards.map(c => c.card_name).join(', ')}</p>
                        <p><strong>Requesting:</strong> ${listing.requested_cards.map(r => r.card_name).join(', ')}</p>
                    </div>

                    ${counterOfferCount > 0 ? `
                        <div class="counter-offers-section">
                            <h4>💬 Counter-Offers (${counterOfferCount})</h4>
                            ${listing.counter_offers.map(offer => `
                                <div class="counter-offer">
                                    <p>From: ${offer.responder_username}</p>
                                    <p>Offering: ${offer.offered_cards.map(c => c.card_name + ' x' + c.quantity).join(', ')}</p>
                                    <div class="actions">
                                        <button onclick="tradingBlock.acceptCounterOffer(${offer.id})">✅ Accept</button>
                                        <button onclick="tradingBlock.rejectCounterOffer(${offer.id})">❌ Reject</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${listing.status === 'open' ? `
                        <button onclick="tradingBlock.cancelListing(${listing.id})">Cancel Listing</button>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;
    }

    async acceptCounterOffer(responseId) {
        this.showConfirm(
            'Accept Counter-Offer?',
            'Are you sure you want to accept this counter-offer?',
            async () => {
                try {
                    const result = await window.apiClient.acceptCounter(responseId);
                    if (result.success) {
                        this.showAlert('Success', 'Counter-offer accepted! Trade completed.', 'success');
                        await this.refreshPlayerData();
                        await this.loadAllData();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showAlert('Failed', error.message, 'error');
                }
            }
        );
    }

    async rejectCounterOffer(responseId) {
        this.showConfirm(
            'Reject Counter-Offer?',
            'Are you sure you want to reject this counter-offer?',
            async () => {
                try {
                    const result = await window.apiClient.rejectCounter(responseId);
                    if (result.success) {
                        this.showAlert('Rejected', 'Counter-offer rejected.', 'info');
                        await this.loadMyListings();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showAlert('Failed', error.message, 'error');
                }
            }
        );
    }

    async cancelListing(listingId) {
        this.showConfirm(
            'Cancel Listing?',
            'Are you sure you want to cancel this listing?',
            async () => {
                try {
                    const result = await window.apiClient.cancelListing(listingId);
                    if (result.success) {
                        this.showAlert('Cancelled', 'Listing cancelled.', 'info');
                        await this.loadAllData();
                        this.showTab('myListings');
                    }
                } catch (error) {
                    this.showAlert('Failed', error.message, 'error');
                }
            }
        );
    }

    renderCreateListing() {
        const content = document.getElementById('tradingContent');
        
        content.innerHTML = `
            <div class="create-listing-container">
                <h2>📝 Create Trade Listing</h2>

                <div class="create-step">
                    <h3>Step 1: Select cards you want to offer</h3>
                    <button onclick="tradingBlock.selectOfferCards()">Choose Cards to Offer</button>
                    <div id="selectedOfferDisplay"></div>
                </div>

                <div class="create-step">
                    <h3>Step 2: Select cards you want in return</h3>
                    <button onclick="tradingBlock.selectRequestCards()">Choose Cards to Request</button>
                    <div id="selectedRequestDisplay"></div>
                </div>

                <div class="create-actions">
                    <button onclick="tradingBlock.submitListing()" id="submitListingBtn" disabled>Create Listing</button>
                    <button onclick="tradingBlock.showTab('browse')">Cancel</button>
                </div>
            </div>
        `;
    }

    selectOfferCards() {
        this.showCardSelectorModal(0, 'create');
    }

    continueCreateListing() {
        // After selecting offer cards
        document.getElementById('selectedOfferDisplay').innerHTML = 
            `<p>Selected ${this.selectedOfferCards.length} cards</p>`;
        
        this.checkCreateListingReady();
    }

    selectRequestCards() {
        // Show modal to select card names with quantities
        const ALL_CARDS = window.ALL_CARDS || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content card-selector-modal" style="max-height: 85vh; overflow-y: auto;">
                <h2>Select Cards to Request</h2>
                
                <div class="selected-cards" id="selectedRequestDisplay">
                    <p>Selected: <span id="selectedRequestCount">0</span> cards</p>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <input type="text" 
                           id="cardSearchInput" 
                           placeholder="Search cards..." 
                           onkeyup="tradingBlock.filterRequestCards(this.value)"
                           style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #ddd;">
                </div>

                <div class="card-grid" id="requestCardGrid" style="max-height: 400px; overflow-y: auto;">
                    ${ALL_CARDS.map(card => `
                        <div class="selectable-card request-card" data-card="${card.name}" style="background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">${card.emoji || '🃏'}</div>
                            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 0.95em;">${card.name}</h4>
                            <p class="market-value" style="color: #f59e0b; font-weight: bold; margin: 4px 0;">≈${this.marketValues[card.name] || 0}g</p>
                            <p style="font-size: 0.85em; color: #666; margin: 4px 0; text-transform: capitalize;">${card.rarity}</p>
                            <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px;">
                                <button onclick="tradingBlock.adjustRequestQuantity('${card.name.replace(/'/g, "\\'"))}', -1)" 
                                        style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #f44336; color: white; cursor: pointer; font-weight: bold; font-size: 16px;">−</button>
                                <span id="qty-${card.name.replace(/[^a-zA-Z0-9]/g, '_')}" style="min-width: 30px; text-align: center; font-weight: bold; color: #333; font-size: 16px;">0</span>
                                <button onclick="tradingBlock.adjustRequestQuantity('${card.name.replace(/'/g, "\\'"))}', 1)" 
                                        style="width: 30px; height: 30px; border-radius: 50%; border: none; background: #4CAF50; color: white; cursor: pointer; font-weight: bold; font-size: 16px;">+</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="modal-actions" style="margin-top: 20px;">
                    <button onclick="tradingBlock.confirmRequestCards()">Confirm</button>
                    <button onclick="tradingBlock.closeModal()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    adjustRequestQuantity(cardName, delta) {
        const safeId = cardName.replace(/[^a-zA-Z0-9]/g, '_');
        const qtySpan = document.getElementById(`qty-${safeId}`);
        if (!qtySpan) return;
        
        let currentQty = parseInt(qtySpan.textContent) || 0;
        currentQty = Math.max(0, Math.min(10, currentQty + delta)); // 0-10 range
        
        qtySpan.textContent = currentQty;
        
        if (currentQty > 0) {
            this.requestedCardQuantities[cardName] = currentQty;
        } else {
            delete this.requestedCardQuantities[cardName];
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
            const cardName = card.dataset.card.toLowerCase();
            if (cardName.includes(term)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    confirmRequestCards() {
        // Build array with card names repeated by quantity
        this.selectedRequestCards = [];
        
        Object.entries(this.requestedCardQuantities).forEach(([cardName, quantity]) => {
            for (let i = 0; i < quantity; i++) {
                this.selectedRequestCards.push(cardName);
            }
        });
        
        if (this.selectedRequestCards.length === 0) {
            this.showAlert('No Cards Selected', 'Please select at least one card to request', 'warning');
            return;
        }
        
        this.closeModal();
        
        // Display formatted request
        const summary = {};
        this.selectedRequestCards.forEach(card => {
            summary[card] = (summary[card] || 0) + 1;
        });
        
        const displayText = Object.entries(summary)
            .map(([card, qty]) => `${card} x${qty}`)
            .join(', ');
        
        document.getElementById('selectedRequestDisplay').innerHTML = 
            `<p>Requesting: ${displayText}</p>`;
        
        // Reset quantities for next time
        this.requestedCardQuantities = {};
        
        this.checkCreateListingReady();
    }

    checkCreateListingReady() {
        const ready = this.selectedOfferCards.length > 0 && this.selectedRequestCards.length > 0;
        document.getElementById('submitListingBtn').disabled = !ready;
    }

    async submitListing() {
        try {
            const result = await window.apiClient.createListing(
                this.selectedOfferCards,
                this.selectedRequestCards
            );

            if (result.success) {
                this.showAlert('Success', 'Listing created!', 'success');
                this.selectedOfferCards = [];
                this.selectedRequestCards = [];
                await this.loadAllData();
                this.showTab('myListings');
            }
        } catch (error) {
            this.showAlert('Failed', 'Failed to create listing: ' + error.message, 'error');
        }
    }

    async renderTradeHistory() {
        const content = document.getElementById('tradingContent');
        
        try {
            const data = await window.apiClient.getTradeHistory();
            const trades = data.trades;

            if (trades.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <h3>📜 No Trade History</h3>
                        <p>Your completed trades will appear here.</p>
                    </div>
                `;
                return;
            }

            let html = '<div class="trade-history">';

            trades.forEach(trade => {
                const otherUserId = trade.user1_id === window.playerData.userId ? 
                    trade.user2_id : trade.user1_id;
                const otherUserName = trade.user1_id === window.playerData.userId ? 
                    trade.user2_name : trade.user1_name;

                html += `
                    <div class="trade-history-item">
                        <div class="trade-header">
                            <span>Traded with: ${otherUserName}</span>
                            <span>${this.getTimeAgo(trade.completed_at)}</span>
                        </div>
                        <div class="trade-details">
                            <div class="sent">
                                <h4>📤 You Gave:</h4>
                                <ul>
                                    ${trade.items_sent.map(item => `<li>${item.card_name}</li>`).join('')}
                                </ul>
                            </div>
                            <div class="received">
                                <h4>📥 You Got:</h4>
                                <ul>
                                    ${trade.items_received.map(item => `<li>${item.card_name}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            content.innerHTML = html;

        } catch (error) {
            content.innerHTML = '<p>Error loading trade history</p>';
        }
    }

    async refreshPlayerData() {
        // Reload player data from server
        const data = await window.apiClient.getPlayerData();
        window.storage.setPlayerDataFromServer(data);
        window.ui.updateCurrencyDisplay();
        this.updateCurrencyDisplay(); // Also update trading block currency
    }

    startNotificationPolling() {
        // Check for new notifications every 30 seconds
        this.notificationCheckInterval = setInterval(async () => {
            try {
                const data = await window.apiClient.getNotifications();
                const unread = data.notifications.filter(n => !n.is_read);
                
                if (unread.length > 0) {
                    this.showNotificationBadge(unread.length);
                }
            } catch (error) {
                console.error('Error checking notifications:', error);
            }
        }, 30000); // 30 seconds
    }

    stopNotificationPolling() {
        if (this.notificationCheckInterval) {
            clearInterval(this.notificationCheckInterval);
            this.notificationCheckInterval = null;
        }
    }

    updateCurrencyDisplay() {
        // Update currency display in trading block header
        const gold = window.playerData?.gold || 0;
        const gems = window.playerData?.gems || 0;
        
        const tradingGold = document.getElementById('tradingGoldAmount');
        const tradingGems = document.getElementById('tradingGemAmount');
        
        if (tradingGold) tradingGold.textContent = gold;
        if (tradingGems) tradingGems.textContent = gems;
    }

    showNotificationBadge(count) {
        // Show badge on trading block button
        const tradingBtn = document.querySelector('[onclick*="tradingBlock.show"]');
        if (tradingBtn) {
            let badge = tradingBtn.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                tradingBtn.appendChild(badge);
            }
            badge.textContent = count;
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) modal.remove();
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }

    renderMyOffers() {
        const content = document.getElementById('tradingContent');

        if (this.myOffers.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <h3>💬 No Pending Offers</h3>
                    <p>Your counter-offers will appear here.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="my-offers">';

        this.myOffers.forEach(offer => {
            html += `
                <div class="offer-card ${offer.status}">
                    <div class="offer-header">
                        <span class="status-badge">${offer.status.toUpperCase()}</span>
                        <span>${this.getTimeAgo(offer.created_at)}</span>
                    </div>
                    <div class="offer-body">
                        <p><strong>You Offered:</strong> ${offer.offered_cards.map(c => c.card_name + ' x' + c.quantity).join(', ')}</p>
                        <p><strong>They Want:</strong> ${offer.original_request.map(r => r.card_name).join(', ')}</p>
                    </div>
                    ${offer.status === 'pending' ? '<p>⏳ Awaiting response...</p>' : ''}
                </div>
            `;
        });

        html += '</div>';
        content.innerHTML = html;
    }
}

// Create global instance
try {
    console.log('[TRADING] Attempting to create TradingBlock instance...');
    console.log('[TRADING] window.apiClient exists?', !!window.apiClient);
    console.log('[TRADING] window.playerData exists?', !!window.playerData);
    console.log('[TRADING] window.ALL_CARDS exists?', !!window.ALL_CARDS);
    
    window.tradingBlock = new TradingBlock();
    
    console.log('✅ Trading Block loaded successfully');
    console.log('[TRADING] tradingBlock.show exists?', typeof window.tradingBlock.show);
} catch (error) {
    console.error('❌ Failed to initialize Trading Block:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    window.tradingBlock = null;
}
