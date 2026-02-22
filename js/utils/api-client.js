// API Client for v3.0.0 Secure Server
// Handles all server communication for authentication and game actions

class APIClient {
    constructor() {
        // Use configured server URL or fallback to localhost
        const serverURL = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080';
        this.baseURL = `${serverURL}/api`;
        console.log('[API Client] Connecting to:', this.baseURL);
    }

    // Get auth token
    getToken() {
        return localStorage.getItem('authToken');
    }

    // Get auth headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    // Make API request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('[API] Error:', error);
            
            // Check if it's a connection error (server offline)
            if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                // Show custom HTML modal instead of letting Electron show native dialog
                this.showConnectionError();
                throw new Error('Server offline');
            }
            
            // If unauthorized, clear token and redirect to login
            if (error.message.includes('token') || error.message.includes('Unauthorized')) {
                localStorage.removeItem('authToken');
                if (window.showLoginRequired) {
                    window.showLoginRequired();
                }
            }
            
            throw error;
        }
    }
    
    showConnectionError() {
        // Only show one error modal at a time
        if (document.getElementById('serverConnectionError')) return;
        
        const modal = document.createElement('div');
        modal.id = 'serverConnectionError';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 10001;';
        
        modal.innerHTML = '<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 450px; width: 90%; color: #333; text-align: center;">' +
            '<div style="font-size: 60px; margin-bottom: 20px;">❌</div>' +
            '<h2 style="color: #f44336; margin-bottom: 20px;">Could Not Connect to Server</h2>' +
            '<p style="margin-bottom: 15px; line-height: 1.6; font-weight: bold;">Please make sure the server is running:</p>' +
            '<p style="margin-bottom: 25px; font-size: 0.9em; color: #666; line-height: 1.6;">Click <strong>Multiplayer menu → Start Server</strong><br>or run <code>node backend\\\\secure-server.js</code></p>' +
            '<button id="connectionErrorBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button>' +
        '</div>';
        
        document.body.appendChild(modal);
        
        document.getElementById('connectionErrorBtn').onclick = () => {
            modal.remove();
        };
    }

    // ============ PLAYER DATA ============
    
    async getPlayerData() {
        return this.request('/player/data');
    }

    async claimDailyReward() {
        return this.request('/player/daily-reward', {
            method: 'POST'
        });
    }

    // ============ STORE ============
    
    async buyPack(packType) {
        return this.request('/store/buy-pack', {
            method: 'POST',
            body: JSON.stringify({ packType })
        });
    }

    async buyCard(cardName, price) {
        return this.request('/store/buy-card', {
            method: 'POST',
            body: JSON.stringify({ cardName, price })
        });
    }

    async buyStarterBundle() {
        return this.request('/store/buy-starter-bundle', {
            method: 'POST'
        });
    }

    // ============ GAME ============
    
    async completeGame(won, gameData) {
        return this.request('/game/complete', {
            method: 'POST',
            body: JSON.stringify({ won, gameData })
        });
    }

    async validateDeck(deck) {
        return this.request('/game/validate-deck', {
            method: 'POST',
            body: JSON.stringify({ deck })
        });
    }

    // ============ MIGRATION ============
    
    async migrateData(oldData) {
        return this.request('/migrate', {
            method: 'POST',
            body: JSON.stringify({ oldData })
        });
    }

    // ============ TRADES ============
    
    async getListings() {
        return this.request('/trades/listings');
    }

    async getMyListings() {
        return this.request('/trades/my-listings');
    }

    async getMyOffers() {
        return this.request('/trades/my-offers');
    }

    async createListing(offeredCardIds, requestedCards) {
        return this.request('/trades/create-listing', {
            method: 'POST',
            body: JSON.stringify({ offeredCardIds, requestedCards })
        });
    }

    async acceptListing(listingId, cardInstanceIds) {
        return this.request(`/trades/accept-listing/${listingId}`, {
            method: 'POST',
            body: JSON.stringify({ cardInstanceIds })
        });
    }

    async createCounterOffer(listingId, cardInstanceIds) {
        return this.request(`/trades/counter-offer/${listingId}`, {
            method: 'POST',
            body: JSON.stringify({ cardInstanceIds })
        });
    }

    async acceptCounter(responseId) {
        return this.request(`/trades/accept-counter/${responseId}`, {
            method: 'POST'
        });
    }

    async rejectCounter(responseId) {
        return this.request(`/trades/reject-counter/${responseId}`, {
            method: 'POST'
        });
    }

    async cancelListing(listingId) {
        return this.request(`/trades/cancel-listing/${listingId}`, {
            method: 'DELETE'
        });
    }

    async getTradeHistory() {
        return this.request('/trades/history');
    }

    async getMarketValues() {
        return this.request('/trades/market-values');
    }

    async sellCard(cardInstanceId) {
        return this.request('/trades/sell-card', {
            method: 'POST',
            body: JSON.stringify({ cardInstanceId })
        });
    }

    async getNotifications() {
        return this.request('/trades/notifications');
    }

    async markNotificationRead(notificationId) {
        return this.request(`/trades/notifications/${notificationId}/read`, {
            method: 'POST'
        });
    }

    // ============ STORE - USED CARDS ============
    
    async getUsedCards() {
        return this.request('/store/used-cards');
    }

    async buyUsedCard(cardName, artVariant) {
        return this.request('/store/buy-used-card', {
            method: 'POST',
            body: JSON.stringify({ cardName, artVariant: artVariant || 'standard' })
        });
    }

    // ============ GAME STATS ============
    
    async resetStats() {
        return this.request('/game/reset-stats', {
            method: 'POST'
        });
    }
}

// Create global instance after config loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiClient = new APIClient();
        console.log('[API Client] Initialized after DOM ready');
    });
} else {
    window.apiClient = new APIClient();
    console.log('[API Client] Initialized immediately');
}

console.log('✅ API Client loaded');
