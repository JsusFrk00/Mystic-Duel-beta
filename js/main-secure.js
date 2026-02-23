// Main entry point for Mystic Duel v3.0.0 Secure Edition
// Uses localStorage flag to determine mode, NEVER deletes user data

console.log('🎴 Mystic Duel v3.0.0 - Secure Edition Loading...');

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    setTimeout(initializeGame, 100);
}

async function initializeGame() {
    console.log('🚀 Initializing Mystic Duel v3.1.2...');
    
    // CLOUD MODE: Always use server (v3.x)
    // Check if cloud server is configured
    const isCloudMode = window.MYSTIC_DUEL_CONFIG?.SERVER_URL && 
                       !window.MYSTIC_DUEL_CONFIG.SERVER_URL.includes('localhost');
    
    if (isCloudMode) {
        // Cloud deployment - always use server mode
        window.isV3Mode = true;
        console.log('☁️ Cloud mode - using SERVER');
        await initializeServerMode();
    } else {
        // Local deployment - check migration flag
        const hasMigrated = localStorage.getItem('v3_migrated') === 'true';
        
        if (hasMigrated) {
            window.isV3Mode = true;
            console.log('🔒 Migrated user - using SERVER mode');
            await initializeServerMode();
        } else {
            window.isV3Mode = false;
            console.log('📦 Not migrated - using LOCALSTORAGE mode');
            initializeLocalStorageMode();
            setTimeout(checkAndOfferMigration, 1000);
        }
    }
}

// Initialize in server mode (requires authentication)
async function initializeServerMode() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        console.log('❌ No auth token - showing login screen');
        showLoginRequired();
        return;
    }

    console.log('🔑 Validating auth token...');
    
    try {
        const playerData = await window.apiClient.getPlayerData();
        
        console.log('✅ Authentication valid!');
        console.log('📊 Player data from server:', playerData);

        // Load server data into memory
        window.storage.setPlayerDataFromServer(playerData);
        
        console.log('[SERVER MODE] Data loaded:');
        console.log('   💰 Gold:', window.playerData.gold);
        console.log('   💎 Gems:', window.playerData.gems);
        console.log('   🃏 Cards:', Object.keys(window.playerData.ownedCards).length);

        // Update UI
        if (window.ui) {
            window.ui.updateCurrencyDisplay();
        }

        // Show main menu
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) {
            mainMenu.style.display = 'flex';
        }
        
        // Hide warning banner (we're in server mode)
        const warningBanner = document.getElementById('localModeWarning');
        if (warningBanner) {
            warningBanner.style.display = 'none';
        }
        
        // Enable multiplayer button
        enableMultiplayerInServerMode();

        console.log('✅ Game initialized in SERVER mode!');

    } catch (error) {
        console.error('❌ Token validation failed:', error);
        localStorage.removeItem('authToken');
        showLoginRequired();
    }
}

// Initialize in localStorage mode (v2.1 behavior)
function initializeLocalStorageMode() {
    console.log('📦 Initializing in LOCALSTORAGE mode (v2.1 behavior)');
    
    // Use normal v2.1 initialization
    if (window.storage && typeof window.storage.initializePlayerData === 'function') {
        window.storage.initializePlayerData();
    }

    // Update UI
    if (window.ui) {
        window.ui.updateCurrencyDisplay();
    }

    // Show main menu
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.style.display = 'flex';
    }
    
    // Show warning banner for localStorage mode
    const warningBanner = document.getElementById('localModeWarning');
    if (warningBanner) {
        warningBanner.style.display = 'block';
    }
    
    // Disable multiplayer button
    disableMultiplayerInLocalMode();

    console.log('✅ Game initialized in LOCALSTORAGE mode!');
}

// Check if user has progress and offer migration
async function checkAndOfferMigration() {
    const oldData = localStorage.getItem('playerData');
    const declined = localStorage.getItem('v3_migration_declined');
    
    if (!oldData) {
        console.log('[MIGRATION] No localStorage data found');
        return;
    }
    
    if (declined === 'true') {
        console.log('[MIGRATION] User previously declined migration');
        return;
    }

    try {
        const data = JSON.parse(oldData);
        
        // Check if meaningful data (more permissive criteria)
        const totalCards = Object.keys(data.ownedCards || {}).length;
        const gold = data.gold || 500;
        const gems = data.gems || 5;
        const gamesPlayed = data.gameStats?.totalGames || 0;

        // Show migration if ANY progress exists (not just defaults)
        if (totalCards > 18 || gold !== 500 || gems !== 5 || gamesPlayed > 0) {
            console.log('[MIGRATION] Detected progress - offering migration');
            await showMigrationOffer(data);
        } else {
            console.log('[MIGRATION] Only starter data - not offering migration');
        }
    } catch (error) {
        console.error('[MIGRATION] Error checking data:', error);
    }
}

async function showMigrationOffer(oldData) {
    const totalCards = Object.keys(oldData.ownedCards || {}).length;
    const totalCardCount = Object.values(oldData.ownedCards || {}).reduce((a, b) => a + b, 0);
    const gold = oldData.gold || 0;
    const gems = oldData.gems || 0;
    const wins = oldData.gameStats?.wins || 0;
    const losses = oldData.gameStats?.losses || 0;

    // Create custom HTML modal instead of native confirm()
    const modal = document.createElement('div');
    modal.id = 'migrationModal';
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

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 500px;
            width: 90%;
            color: #333;
        ">
            <h2 style="text-align: center; color: #667eea; margin-bottom: 20px;">🔒 Upgrade to Secure Mode?</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333;">Your Current Progress:</h3>
                <p style="margin: 5px 0;">💰 Gold: ${gold.toLocaleString()}</p>
                <p style="margin: 5px 0;">💎 Gems: ${gems}</p>
                <p style="margin: 5px 0;">🃏 Unique Cards: ${totalCards}</p>
                <p style="margin: 5px 0;">📦 Total Cards: ${totalCardCount}</p>
                <p style="margin: 5px 0;">🏆 Record: ${wins}W - ${losses}L</p>
            </div>

            <p style="margin-bottom: 15px; font-weight: bold;">Upgrade to secure server-based storage?</p>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #2e7d32;">Benefits:</p>
                <p style="margin: 5px 0;">✓ Cannot be cheated</p>
                <p style="margin: 5px 0;">✓ Fair multiplayer</p>
                <p style="margin: 5px 0;">✓ Syncs across devices</p>
                <p style="margin: 5px 0;">✓ Your data backed up on server</p>
            </div>

            <p style="text-align: center; font-size: 0.9em; color: #666; margin-bottom: 20px;">
                Your localStorage will be kept as backup!
            </p>

            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="migrationDeclineBtn" style="
                    padding: 12px 30px;
                    background: #6c757d;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                ">Cancel</button>
                <button id="migrationAcceptBtn" style="
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                ">Upgrade Now</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Handle button clicks
    document.getElementById('migrationAcceptBtn').onclick = () => {
        document.body.removeChild(modal);
        localStorage.setItem('pendingMigration', 'true');
        showLoginRequired(true);
    };

    document.getElementById('migrationDeclineBtn').onclick = () => {
        document.body.removeChild(modal);
        localStorage.setItem('v3_migration_declined', 'true');
        
        // Show custom HTML notification instead of alert()
        const notification = document.createElement('div');
        notification.style.cssText = `
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
        
        notification.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <h2 style="color: #667eea; margin-bottom: 20px;">Continuing in Local Mode</h2>
                <p style="margin-bottom: 20px; line-height: 1.6;">
                    You can migrate later from the Account menu.
                </p>
                <button id="notificationOkBtn" style="
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
        
        document.body.appendChild(notification);
        
        document.getElementById('notificationOkBtn').onclick = () => {
            document.body.removeChild(notification);
        };
    };
}

async function performMigration(oldData) {
    try {
        console.log('[MIGRATION] Transferring progress to server...');
        
        const result = await window.apiClient.migrateData({
            gold: oldData.gold || 500,
            gems: oldData.gems || 5,
            ownedCards: oldData.ownedCards || {},
            gameStats: oldData.gameStats || {}
        });

        console.log('[MIGRATION] Server response:', result);

        // CRITICAL: Set migrated flag but KEEP localStorage data as backup
        localStorage.setItem('v3_migrated', 'true');
        localStorage.removeItem('pendingMigration');
        localStorage.removeItem('v3_migration_declined');

        console.log('[MIGRATION] Success! localStorage preserved as backup');
        console.log('[MIGRATION] v3_migrated flag set - will now use server mode');
        
        // Show custom HTML success modal instead of alert()
        const successModal = document.createElement('div');
        successModal.style.cssText = `
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
        
        successModal.innerHTML = `
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
                <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #4CAF50; margin-bottom: 20px;">Migration Successful!</h2>
                <p style="margin-bottom: 15px; line-height: 1.6;">
                    Your progress has been transferred to the secure server!
                </p>
                <p style="margin-bottom: 15px; line-height: 1.6; font-size: 0.9em; color: #666;">
                    Your localStorage data is kept as a backup.
                </p>
                <p style="margin-bottom: 25px; font-weight: bold; color: #667eea;">
                    Reloading in secure mode...
                </p>
                <button id="migrationSuccessBtn" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                ">Continue</button>
            </div>
        `;
        
        document.body.appendChild(successModal);
        
        // Auto-reload after 3 seconds, or immediately when button clicked
        let reloadTimer = setTimeout(() => {
            location.reload();
        }, 3000);
        
        document.getElementById('migrationSuccessBtn').onclick = () => {
            clearTimeout(reloadTimer);
            location.reload();
        };

    } catch (error) {
        console.error('[MIGRATION] Failed:', error);
        localStorage.removeItem('pendingMigration');
        
        // Show custom HTML error modal instead of alert()
        const errorModal = document.createElement('div');
        errorModal.style.cssText = `
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
        
        errorModal.innerHTML = `
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
                <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
                <h2 style="color: #f44336; margin-bottom: 20px;">Migration Failed</h2>
                <p style="margin-bottom: 15px; line-height: 1.6; color: #e74c3c; font-weight: bold;">
                    ${error.message}
                </p>
                <p style="margin-bottom: 20px; line-height: 1.6; color: #666;">
                    Don't worry - your localStorage data is still intact!
                </p>
                <p style="margin-bottom: 25px; line-height: 1.6; font-size: 0.9em; color: #666;">
                    You can continue playing with localStorage mode.
                </p>
                <button id="migrationErrorBtn" style="
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
        
        document.body.appendChild(errorModal);
        
        document.getElementById('migrationErrorBtn').onclick = () => {
            document.body.removeChild(errorModal);
        };
    }
}

function showLoginRequired(showMigrationNotice = false) {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) {
        mainMenu.style.display = 'none';
    }

    createAuthScreen(showMigrationNotice);
}

function createAuthScreen(showMigrationNotice = false) {
    const existing = document.getElementById('authScreen');
    if (existing) {
        document.body.removeChild(existing);
    }

    const isPendingMigration = localStorage.getItem('pendingMigration') === 'true';

    const authScreen = document.createElement('div');
    authScreen.id = 'authScreen';
    authScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    authScreen.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 450px;
            width: 90%;
        ">
            <h1 style="text-align: center; color: #667eea; margin-bottom: 10px;">🎴 Mystic Duel</h1>
            <h2 style="text-align: center; color: #333; margin-bottom: 30px;" id="authTitle">${isPendingMigration ? 'Create Account to Migrate' : 'Login'}</h2>

            ${isPendingMigration || showMigrationNotice ? `
                <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #856404; font-size: 0.9em;">
                        🔒 Create an account to transfer your progress to the secure server!
                    </p>
                </div>
            ` : ''}

            <div id="loginForm" style="display: ${isPendingMigration ? 'none' : 'block'};">
                <input type="text" id="loginUsername" placeholder="Username or Email" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <input type="password" id="loginPassword" placeholder="Password" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <button id="loginBtn" style="
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                ">
                    Login
                </button>
                <p style="text-align: center; margin-top: 20px; color: #666;">
                    Don't have an account? 
                    <a href="#" id="showRegisterLink" style="color: #667eea; font-weight: bold; text-decoration: none;">Register</a>
                </p>
            </div>

            <div id="registerForm" style="display: ${isPendingMigration ? 'block' : 'none'};">
                <input type="text" id="registerUsername" placeholder="Username (min 3 chars)" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <input type="email" id="registerEmail" placeholder="Email (optional)" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 5px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <p style="font-size: 0.85em; color: #666; margin: 0 0 15px 0; padding: 0 5px;">
                    📧 Email is optional (not used for emails)
                </p>
                <input type="password" id="registerPassword" placeholder="Password (min 6 chars)" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 15px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <input type="password" id="registerPasswordConfirm" placeholder="Confirm Password" style="
                    width: 100%;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 1em;
                    box-sizing: border-box;
                    user-select: text;
                    -webkit-user-select: text;
                    pointer-events: auto;
                    cursor: text;
                " />
                <button id="registerBtn" style="
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #34d399 0%, #059669 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 5px 15px rgba(52, 211, 153, 0.3);
                ">
                    Create Account & Migrate
                </button>
                <p style="text-align: center; margin-top: 20px; color: #666;">
                    Already have an account? 
                    <a href="#" id="showLoginLink" style="color: #667eea; font-weight: bold; text-decoration: none;">Login</a>
                </p>
            </div>

            <div id="authError" style="
                color: #e74c3c;
                text-align: center;
                margin-top: 15px;
                font-weight: bold;
                min-height: 20px;
            "></div>
        </div>
    `;

    document.body.appendChild(authScreen);

    document.getElementById('loginBtn').onclick = handleLogin;
    document.getElementById('registerBtn').onclick = handleRegister;
    document.getElementById('showRegisterLink').onclick = (e) => {
        e.preventDefault();
        showRegisterForm();
    };
    document.getElementById('showLoginLink').onclick = (e) => {
        e.preventDefault();
        showLoginForm();
    };

    document.getElementById('loginPassword').onkeypress = (e) => {
        if (e.key === 'Enter') handleLogin();
    };
    document.getElementById('registerPasswordConfirm').onkeypress = (e) => {
        if (e.key === 'Enter') handleRegister();
    };
}



function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Create Account';
    document.getElementById('authError').textContent = '';
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('authTitle').textContent = 'Login';
    document.getElementById('authError').textContent = '';
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('authError');

    if (!username || !password) {
        errorDiv.textContent = 'Please enter username and password';
        return;
    }

    errorDiv.textContent = 'Logging in...';

    try {
        const serverUrl = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080';
        const response = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const result = await response.json();
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('v3_migrated', 'true');

        console.log('✅ Logged in as:', result.user.username);

        const authScreen = document.getElementById('authScreen');
        if (authScreen) {
            document.body.removeChild(authScreen);
        }

        location.reload();

    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

async function handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const errorDiv = document.getElementById('authError');

    if (!username) {
        errorDiv.textContent = 'Please enter a username';
        return;
    }

    if (password !== passwordConfirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        return;
    }

    errorDiv.textContent = 'Creating account...';

    try {
        const serverUrl = window.MYSTIC_DUEL_CONFIG?.SERVER_URL || 'http://localhost:8080';
        const response = await fetch(`${serverUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                email: email || '', 
                password 
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        // Reuse serverUrl from above (already declared)
        const loginResponse = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const loginResult = await loginResponse.json();
        localStorage.setItem('authToken', loginResult.token);

        console.log('✅ Account created and logged in!');

        const isPending = localStorage.getItem('pendingMigration') === 'true';
        
        if (isPending) {
            const oldData = JSON.parse(localStorage.getItem('playerData'));
            await performMigration(oldData);
        } else {
            localStorage.setItem('v3_migrated', 'true');
            
            const authScreen = document.getElementById('authScreen');
            if (authScreen) {
                document.body.removeChild(authScreen);
            }
            
            location.reload();
        }

    } catch (error) {
        errorDiv.textContent = error.message;
    }
}

// Function to disable multiplayer in localStorage mode
function disableMultiplayerInLocalMode() {
    const multiplayerBtn = document.querySelector('.menu-buttons button[onclick*="showMultiplayer"]');
    if (multiplayerBtn) {
        multiplayerBtn.disabled = true;
        multiplayerBtn.style.opacity = '0.5';
        multiplayerBtn.style.cursor = 'not-allowed';
        multiplayerBtn.title = 'Multiplayer requires Secure Mode';
        
        multiplayerBtn.onclick = function(e) {
            e.preventDefault();
            
            // Create custom HTML modal instead of alert()
            const modal = document.createElement('div');
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
                    <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                    <h2 style="color: #667eea; margin-bottom: 20px;">Multiplayer Requires Secure Mode</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: left;">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">Why?</p>
                        <p style="margin: 5px 0;">• Prevents cheating (editing localStorage)</p>
                        <p style="margin: 5px 0;">• Fair competitive play</p>
                        <p style="margin: 5px 0;">• Server validates all actions</p>
                    </div>
                    
                    <p style="margin-bottom: 25px; line-height: 1.6;">
                        Login to enable multiplayer.
                    </p>
                    
                    <button id="multiplayerNoticeBtn" style="
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
            
            document.getElementById('multiplayerNoticeBtn').onclick = () => {
                document.body.removeChild(modal);
            };
        };
        
        console.log('[SECURITY] Multiplayer disabled in localStorage mode');
    }
}

// Function to enable multiplayer in server mode
function enableMultiplayerInServerMode() {
    const multiplayerBtn = document.querySelector('.menu-buttons button[onclick*="showMultiplayer"]');
    if (multiplayerBtn) {
        multiplayerBtn.disabled = false;
        multiplayerBtn.style.opacity = '1';
        multiplayerBtn.style.cursor = 'pointer';
        multiplayerBtn.title = '';
        
        multiplayerBtn.onclick = function() {
            if (window.ui && window.ui.showMultiplayer) {
                window.ui.showMultiplayer();
            }
        };
        
        console.log('[SECURITY] Multiplayer enabled in server mode');
    }
}

// Global logout function
window.authLogout = function() {
    // Create custom HTML confirm modal instead of native confirm()
    const modal = document.createElement('div');
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
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            color: #333;
            text-align: center;
        ">
            <h2 style="color: #667eea; margin-bottom: 20px;">Confirm Logout</h2>
            <p style="margin-bottom: 20px; line-height: 1.6;">
                Are you sure you want to logout?
            </p>
            <p style="margin-bottom: 25px; line-height: 1.6; font-size: 0.9em; color: #666;">
                This will return you to localStorage mode.
            </p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button id="logoutCancelBtn" style="
                    padding: 12px 30px;
                    background: #6c757d;
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                ">Cancel</button>
                <button id="logoutConfirmBtn" style="
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
                ">Logout</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('logoutCancelBtn').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('logoutConfirmBtn').onclick = () => {
        document.body.removeChild(modal);
        localStorage.removeItem('authToken');
        localStorage.removeItem('v3_migrated');
        location.reload();
    };
};

// Global login function
window.authShowLogin = function() {
    createAuthScreen();
};

// Function for upgrade button in warning banner
window.showSecureModeUpgrade = function() {
    const oldData = localStorage.getItem('playerData');
    if (oldData) {
        try {
            const data = JSON.parse(oldData);
            showMigrationOffer(data);
        } catch (error) {
            console.error('Error parsing player data:', error);
            createAuthScreen(true);
        }
    } else {
        createAuthScreen(true);
    }
};

// Function for View Profile menu item
window.showProfileModal = function() {
    const token = localStorage.getItem('authToken');
    const isV3 = window.isV3Mode;
    
    if (!token || !isV3) {
        // Not logged in - show login prompt
        const modal = document.createElement('div');
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
        
        modal.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                max-width: 400px;
                width: 90%;
                color: #333;
                text-align: center;
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">🔒</div>
                <h2 style="color: #667eea; margin-bottom: 20px;">Login Required</h2>
                <p style="margin-bottom: 25px; line-height: 1.6;">
                    Please login first to view your profile.
                </p>
                <button id="profileLoginBtn" style="
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
        
        document.getElementById('profileLoginBtn').onclick = () => {
            document.body.removeChild(modal);
        };
        return;
    }
    
    // Logged in - show profile info
    const playerData = window.playerData || {};
    const gold = playerData.gold || 0;
    const gems = playerData.gems || 0;
    const totalCards = Object.keys(playerData.ownedCards || {}).length;
    const totalCardCount = Object.values(playerData.ownedCards || {}).reduce((a, b) => a + b, 0);
    const stats = playerData.gameStats || {};
    
    const modal = document.createElement('div');
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
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 500px;
            width: 90%;
            color: #333;
        ">
            <h2 style="text-align: center; color: #667eea; margin-bottom: 25px;">🎮 Your Profile</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333; margin-bottom: 15px;">Currency</h3>
                <p style="margin: 8px 0; font-size: 1.1em;">💰 Gold: <strong>${gold.toLocaleString()}</strong></p>
                <p style="margin: 8px 0; font-size: 1.1em;">💎 Gems: <strong>${gems}</strong></p>
            </div>
            
            <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #333; margin-bottom: 15px;">Collection</h3>
                <p style="margin: 8px 0;">🃏 Unique Cards: <strong>${totalCards}</strong></p>
                <p style="margin: 8px 0;">📦 Total Cards: <strong>${totalCardCount}</strong></p>
            </div>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #333; margin-bottom: 15px;">Game Stats</h3>
                <p style="margin: 8px 0;">Total Games: <strong>${stats.totalGames || 0}</strong></p>
                <p style="margin: 8px 0;">Wins: <strong style="color: #4CAF50;">${stats.wins || 0}</strong></p>
                <p style="margin: 8px 0;">Losses: <strong style="color: #f44336;">${stats.losses || 0}</strong></p>
                <p style="margin: 8px 0;">Win Streak: <strong style="color: #ff9800;">${stats.winStreak || 0}</strong></p>
            </div>
            
            <div style="text-align: center;">
                <button id="profileCloseBtn" style="
                    padding: 12px 40px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 1em;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                ">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('profileCloseBtn').onclick = () => {
        document.body.removeChild(modal);
    };
};

// Function for deckbuilder loading fallback
window.showDeckbuilderLoadingModal = function() {
    const modal = document.createElement('div');
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
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            width: 90%;
            color: #333;
            text-align: center;
        ">
            <div style="font-size: 60px; margin-bottom: 20px;">⏳</div>
            <h2 style="color: #667eea; margin-bottom: 20px;">Deckbuilder Loading</h2>
            <p style="margin-bottom: 25px; line-height: 1.6;">
                Deckbuilder is loading, please try again in a moment.
            </p>
            <button id="deckbuilderLoadingBtn" style="
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
    
    document.getElementById('deckbuilderLoadingBtn').onclick = () => {
        document.body.removeChild(modal);
    };
};

// ==================== GAME MANAGER ====================
// Handles game initialization and starting games

// Start a quick game with random deck from owned cards
function startQuickGame() {
    const ownedCardsList = [];
    const ALL_CARDS = window.ALL_CARDS || [];
    const playerData = window.storage ? window.storage.playerData : { ownedCards: {} };
    
    for (const [cardName, count] of Object.entries(playerData.ownedCards || {})) {
        const cardTemplate = ALL_CARDS.find(c => c.name === cardName);
        if (cardTemplate) {
            for (let i = 0; i < count; i++) {
                ownedCardsList.push(cardTemplate);
            }
        }
    }
    
    if (ownedCardsList.length < 30) {
        // Show custom HTML modal instead of alert()
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">🛍️</div><h2 style="color: #667eea; margin-bottom: 20px;">Not Enough Cards</h2><p style="margin-bottom: 25px; line-height: 1.6;">You need at least 30 cards to play! Buy more cards in the store.</p><button id="notEnoughCardsBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('notEnoughCardsBtn').onclick = () => { document.body.removeChild(modal); };
        return;
    }
    
    // Create a random deck from owned cards
    const quickDeck = [];
    const shuffled = [...ownedCardsList].sort(() => Math.random() - 0.5);
    
    for (const card of shuffled) {
        if (quickDeck.length >= 30) break;
        
        const copiesInDeck = quickDeck.filter(c => c.name === card.name).length;
        const maxCopies = card.rarity === 'legendary' ? 1 : 2;
        
        if (copiesInDeck < maxCopies) {
            quickDeck.push(new window.Card(card));
        }
    }
    
    // Fill remaining slots if needed
    while (quickDeck.length < 30 && ownedCardsList.length > quickDeck.length) {
        const remainingOwned = ownedCardsList.filter(card => {
            const copiesInDeck = quickDeck.filter(c => c.name === card.name).length;
            const maxCopies = card.rarity === 'legendary' ? 1 : 2;
            return copiesInDeck < maxCopies;
        });
        
        if (remainingOwned.length === 0) break;
        
        const randomCard = remainingOwned[Math.floor(Math.random() * remainingOwned.length)];
        quickDeck.push(new window.Card(randomCard));
    }
    
    if (quickDeck.length < 30) {
        // Show custom HTML modal instead of alert()
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">🛍️</div><h2 style="color: #667eea; margin-bottom: 20px;">Not Enough Unique Cards</h2><p style="margin-bottom: 25px; line-height: 1.6;">Not enough unique cards to create a deck! Buy more cards in the store.</p><button id="notEnoughUniqueBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('notEnoughUniqueBtn').onclick = () => { document.body.removeChild(modal); };
        return;
    }
    
    startGame(quickDeck);
}

// Start game with current deck from deckbuilder
function startGameWithDeck() {
    const currentDeck = window.deckbuilder ? window.deckbuilder.getCurrentDeck() : [];
    if (currentDeck.length !== 30) {
        // Show custom HTML modal instead of alert()
        const modal = document.createElement('div');
        modal.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 9999;`;
        modal.innerHTML = `<div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); max-width: 400px; width: 90%; color: #333; text-align: center;"><div style="font-size: 60px; margin-bottom: 20px;">⚠️</div><h2 style="color: #ff9800; margin-bottom: 20px;">Incomplete Deck</h2><p style="margin-bottom: 25px; line-height: 1.6;">Deck must have exactly 30 cards!</p><button id="gameWithDeckIncompleteBtn" style="padding: 12px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; font-size: 1em; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">OK</button></div>`;
        document.body.appendChild(modal);
        document.getElementById('gameWithDeckIncompleteBtn').onclick = () => { document.body.removeChild(modal); };
        return;
    }
    startGame([...currentDeck]);
}

// Start a new game with provided deck
function startGame(playerDeckCards) {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('deckbuilder').style.display = 'none';
    document.getElementById('storeContainer').style.display = 'none';
    document.getElementById('collectionContainer').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'flex';
    document.getElementById('gameLog').style.display = 'block';
    document.getElementById('gameLog').innerHTML = '';
    
    window.game = new window.Game(playerDeckCards);
}

// Create gameManager object
window.gameManager = {
    startQuickGame: startQuickGame,
    startGameWithDeck: startGameWithDeck,
    startGame: startGame
};

// Global functions
window.initializeGame = initializeGame;
window.showLoginRequired = showLoginRequired;
window.performMigration = performMigration;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;

console.log('✅ Main-secure.js loaded');
