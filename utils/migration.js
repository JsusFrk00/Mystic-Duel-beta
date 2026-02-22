// Migration system for v3.0.0
// Detects localStorage data and migrates to server

class MigrationManager {
    constructor() {
        this.hasCheckedMigration = false;
    }

    // Check if player has old data that needs migrating
    async checkForMigration() {
        if (this.hasCheckedMigration) return;
        this.hasCheckedMigration = true;

        // Check for migration flags
        const alreadyMigrated = localStorage.getItem('v3_migrated');
        const declined = localStorage.getItem('v3_migration_declined');
        
        if (alreadyMigrated || declined) {
            console.log('[MIGRATION] Already processed');
            return;
        }

        // Check for old data
        const oldPlayerData = localStorage.getItem('playerData');
        if (!oldPlayerData) {
            console.log('[MIGRATION] No old data found');
            localStorage.setItem('v3_migrated', 'no_data');
            return;
        }

        try {
            const data = JSON.parse(oldPlayerData);
            
            // Check if this is actually meaningful data (not just starter)
            const totalCards = Object.keys(data.ownedCards || {}).length;
            const gold = data.gold || 500;
            const gems = data.gems || 5;
            const gamesPlayed = data.gameStats?.totalGames || 0;

            // If it's just starter data, no need to migrate
            if (totalCards <= 15 && gold === 500 && gems === 5 && gamesPlayed === 0) {
                console.log('[MIGRATION] Only starter data, skipping migration');
                localStorage.setItem('v3_migrated', 'starter_only');
                return;
            }

            // Has meaningful progress! Show migration screen
            await this.showMigrationPrompt(data);
            
        } catch (error) {
            console.error('[MIGRATION] Error checking old data:', error);
        }
    }

    // Show migration prompt with progress preview
    async showMigrationPrompt(oldData) {
        const totalCards = Object.keys(oldData.ownedCards || {}).length;
        const uniqueCards = Object.keys(oldData.ownedCards || {}).length;
        const totalCardCount = Object.values(oldData.ownedCards || {}).reduce((a, b) => a + b, 0);
        const gold = oldData.gold || 0;
        const gems = oldData.gems || 0;
        const wins = oldData.gameStats?.wins || 0;
        const losses = oldData.gameStats?.losses || 0;
        const totalGames = wins + losses;

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'migrationModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px;
                border-radius: 20px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                color: white;
                text-align: center;
            ">
                <h1 style="font-size: 2em; margin-bottom: 10px;">🎴 Progress Detected!</h1>
                <h2 style="font-size: 1.2em; margin-bottom: 30px; opacity: 0.9;">Welcome to Mystic Duel v3.0.0</h2>
                
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 25px;
                    margin: 20px 0;
                    text-align: left;
                ">
                    <h3 style="margin-bottom: 15px; text-align: center;">📊 Your Current Progress:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 1.1em;">
                        <div><strong>💰 Gold:</strong></div>
                        <div style="text-align: right;">${gold.toLocaleString()}</div>
                        
                        <div><strong>💎 Gems:</strong></div>
                        <div style="text-align: right;">${gems}</div>
                        
                        <div><strong>🃏 Unique Cards:</strong></div>
                        <div style="text-align: right;">${uniqueCards}</div>
                        
                        <div><strong>📦 Total Cards:</strong></div>
                        <div style="text-align: right;">${totalCardCount}</div>
                        
                        <div><strong>🎮 Games Played:</strong></div>
                        <div style="text-align: right;">${totalGames}</div>
                        
                        <div><strong>🏆 Win Record:</strong></div>
                        <div style="text-align: right;">${wins}W - ${losses}L</div>
                    </div>
                </div>

                <div style="
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                    padding: 15px;
                    margin: 20px 0;
                    font-size: 0.95em;
                    line-height: 1.6;
                ">
                    <h3 style="margin-bottom: 10px;">🔒 What's New in v3.0.0?</h3>
                    <ul style="text-align: left; margin: 0; padding-left: 20px;">
                        <li>Secure server-side storage (can't be cheated!)</li>
                        <li>Login required (one-time setup)</li>
                        <li>Fair multiplayer (no more gold hackers)</li>
                        <li>Your progress is safely stored on the server</li>
                    </ul>
                </div>

                <div style="margin-top: 30px;">
                    <p style="font-size: 1.1em; margin-bottom: 20px;">
                        <strong>Would you like to transfer this progress to your new account?</strong>
                    </p>
                    
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <button id="migrateYes" style="
                            background: linear-gradient(135deg, #34d399 0%, #059669 100%);
                            color: white;
                            border: none;
                            padding: 15px 40px;
                            border-radius: 10px;
                            font-size: 1.1em;
                            font-weight: bold;
                            cursor: pointer;
                            box-shadow: 0 5px 15px rgba(52, 211, 153, 0.4);
                            transition: all 0.3s;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 7px 20px rgba(52, 211, 153, 0.6)';" 
                           onmouseout="this.style.transform=''; this.style.boxShadow='0 5px 15px rgba(52, 211, 153, 0.4)';">
                            ✅ Yes, Transfer My Progress
                        </button>
                        
                        <button id="migrateNo" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 2px solid rgba(255, 255, 255, 0.3);
                            padding: 15px 40px;
                            border-radius: 10px;
                            font-size: 1.1em;
                            cursor: pointer;
                            transition: all 0.3s;
                        " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)';" 
                           onmouseout="this.style.background='rgba(255, 255, 255, 0.2)';">
                            ❌ Start Fresh
                        </button>
                    </div>
                    
                    <p style="font-size: 0.85em; margin-top: 15px; opacity: 0.8;">
                        Note: If you start fresh, your old progress will be lost.
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle button clicks
        return new Promise((resolve) => {
            document.getElementById('migrateYes').onclick = async () => {
                document.body.removeChild(modal);
                await this.performMigration(oldData);
                resolve(true);
            };

            document.getElementById('migrateNo').onclick = () => {
                document.body.removeChild(modal);
                localStorage.setItem('v3_migration_declined', 'true');
                localStorage.setItem('v3_migrated', 'declined');
                alert('Starting fresh! Your old data will remain in localStorage if you change your mind.');
                resolve(false);
            };
        });
    }

    // Actually perform the migration
    async performMigration(oldData) {
        try {
            // Show loading
            this.showMigrationProgress('Transferring your progress to the server...');

            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Please login first before migrating');
            }

            // Send migration request
            const response = await fetch('http://localhost:8080/api/migrate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    oldData: {
                        gold: oldData.gold || 500,
                        gems: oldData.gems || 5,
                        ownedCards: oldData.ownedCards || {},
                        gameStats: oldData.gameStats || {}
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Migration failed');
            }

            // Success!
            localStorage.setItem('v3_migrated', 'success');
            
            // Remove old data
            localStorage.removeItem('playerData');
            
            this.showMigrationSuccess();

        } catch (error) {
            console.error('[MIGRATION] Failed:', error);
            
            alert(`Migration Failed: ${error.message}\n\nYour old data is still in localStorage. You can try again later or contact support.`);
            
            this.hideMigrationProgress();
        }
    }

    showMigrationProgress(message) {
        const progress = document.createElement('div');
        progress.id = 'migrationProgress';
        progress.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 50px;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 10001;
            text-align: center;
        `;
        progress.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 15px;">⏳</div>
            <div style="font-size: 1.2em; font-weight: bold;">${message}</div>
            <div style="margin-top: 15px; opacity: 0.8;">Please wait...</div>
        `;
        document.body.appendChild(progress);
    }

    hideMigrationProgress() {
        const progress = document.getElementById('migrationProgress');
        if (progress) {
            document.body.removeChild(progress);
        }
    }

    showMigrationSuccess() {
        this.hideMigrationProgress();

        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #34d399 0%, #059669 100%);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            z-index: 10001;
            text-align: center;
        `;
        success.innerHTML = `
            <div style="font-size: 4em; margin-bottom: 15px;">✅</div>
            <h2 style="font-size: 1.8em; margin-bottom: 10px;">Migration Successful!</h2>
            <p style="font-size: 1.1em; opacity: 0.9; margin-bottom: 25px;">
                Your progress has been transferred to your secure account!
            </p>
            <button onclick="location.reload()" style="
                background: white;
                color: #059669;
                border: none;
                padding: 15px 40px;
                border-radius: 10px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            ">
                Continue Playing →
            </button>
        `;
        document.body.appendChild(success);

        // Auto-reload after 3 seconds
        setTimeout(() => {
            location.reload();
        }, 3000);
    }
}

// Create global instance
window.migrationManager = new MigrationManager();

// Export for ES6 modules
export default window.migrationManager;
