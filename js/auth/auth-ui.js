// Authentication UI
// File: js/auth/auth-ui.js

import apiClient from '../utils/api-client.js';

// Show login screen
export function showLoginScreen() {
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu) mainMenu.style.display = 'none';
    
    // Create login screen if it doesn't exist
    let loginScreen = document.getElementById('loginScreen');
    
    if (!loginScreen) {
        loginScreen = document.createElement('div');
        loginScreen.id = 'loginScreen';
        loginScreen.className = 'auth-screen';
        loginScreen.innerHTML = `
            <div class="auth-container">
                <h1>🎴 Mystic Duel</h1>
                <h2>Welcome Back!</h2>
                
                <div id="loginForm" class="auth-form">
                    <input type="text" id="loginUsername" placeholder="Username or Email" />
                    <input type="password" id="loginPassword" placeholder="Password" />
                    <button onclick="auth.login()">Login</button>
                    <p class="auth-switch">
                        Don't have an account? 
                        <a href="#" onclick="auth.showRegisterForm(); return false;">Register</a>
                    </p>
                </div>

                <div id="registerForm" class="auth-form" style="display: none;">
                    <input type="text" id="registerUsername" placeholder="Username" />
                    <input type="email" id="registerEmail" placeholder="Email" />
                    <input type="password" id="registerPassword" placeholder="Password (min 6 chars)" />
                    <input type="password" id="registerPasswordConfirm" placeholder="Confirm Password" />
                    <button onclick="auth.register()">Create Account</button>
                    <p class="auth-switch">
                        Already have an account? 
                        <a href="#" onclick="auth.showLoginForm(); return false;">Login</a>
                    </p>
                </div>

                <div id="authError" class="auth-error"></div>
            </div>
        `;
        document.body.appendChild(loginScreen);
    }
    
    loginScreen.style.display = 'flex';
}

// Show register form
export function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authError').textContent = '';
}

// Show login form
export function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authError').textContent = '';
}

// Login
export async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('authError');

    if (!username || !password) {
        errorDiv.textContent = 'Please enter username and password';
        return;
    }

    try {
        errorDiv.textContent = 'Logging in...';
        
        const result = await apiClient.login(username, password);
        
        console.log('✅ Logged in:', result.user.username);
        
        // Hide login screen
        document.getElementById('loginScreen').style.display = 'none';
        
        // Load player data and show main menu
        await loadPlayerData();
        
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) mainMenu.style.display = 'flex';
        
    } catch (error) {
        errorDiv.textContent = error.message;
        console.error('Login failed:', error);
    }
}

// Register
export async function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const errorDiv = document.getElementById('authError');

    // Validation
    if (!username || !email || !password || !passwordConfirm) {
        errorDiv.textContent = 'Please fill in all fields';
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

    try {
        errorDiv.textContent = 'Creating account...';
        
        await apiClient.register(username, email, password);
        
        // Auto-login after registration
        await apiClient.login(username, password);
        
        console.log('✅ Account created and logged in');
        
        // Check for pending migration
        const pendingMigration = localStorage.getItem('pendingMigration');
        if (pendingMigration) {
            await completeMigration(pendingMigration);
        }
        
        // Hide login screen
        document.getElementById('loginScreen').style.display = 'none';
        
        // Load player data and show main menu
        await loadPlayerData();
        
        const mainMenu = document.getElementById('mainMenu');
        if (mainMenu) mainMenu.style.display = 'flex';
        
    } catch (error) {
        errorDiv.textContent = error.message;
        console.error('Registration failed:', error);
    }
}

// Load player data from server
async function loadPlayerData() {
    try {
        const data = await apiClient.getPlayerData();
        
        // Update storage module with server data
        if (window.storage && window.storage.setPlayerData) {
            window.storage.setPlayerData(data);
        }
        
        // Update currency display
        if (window.ui && window.ui.updateCurrencyDisplay) {
            window.ui.updateCurrencyDisplay();
        }
        
        console.log('✅ Player data loaded from server');
    } catch (error) {
        console.error('Failed to load player data:', error);
        alert('Failed to load your game data. Please try again.');
    }
}

// Complete migration after registration
async function completeMigration(pendingDataStr) {
    try {
        const oldData = JSON.parse(pendingDataStr);
        await apiClient.migrateData(oldData);
        
        alert('✅ Migration successful!\n\nYour progress has been transferred to your new account.');
        
        // Clean up
        localStorage.removeItem('playerData');
        localStorage.removeItem('pendingMigration');
        localStorage.setItem('v3_migrated', 'true');
        
    } catch (error) {
        console.error('Migration failed:', error);
        alert('Migration failed. Don\'t worry, your old data is still saved locally.\nPlease contact support for assistance.');
    }
}

// Check if user is logged in
export function checkAuth() {
    if (!apiClient.token) {
        showLoginScreen();
        return false;
    }
    return true;
}

// Logout
export function logout() {
    apiClient.clearToken();
    showLoginScreen();
}

// Export as global object for onclick handlers
window.auth = {
    showLoginScreen,
    showRegisterForm,
    showLoginForm,
    login,
    register,
    checkAuth,
    logout
};

export default {
    showLoginScreen,
    showRegisterForm,
    showLoginForm,
    login,
    register,
    checkAuth,
    logout
};