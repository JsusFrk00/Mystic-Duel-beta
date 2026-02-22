// Mystic Duel - Server Configuration
// Change SERVER_URL to point to your cloud deployment

window.MYSTIC_DUEL_CONFIG = {
    // LOCALHOST (for development):
    // SERVER_URL: 'http://localhost:8080',
    
    // RENDER.COM (for production):
    SERVER_URL: 'https://mystic-duel-server.onrender.com',
};

console.log('🌐 Server configured:', window.MYSTIC_DUEL_CONFIG.SERVER_URL);
