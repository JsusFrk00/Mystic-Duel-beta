// UI.js v3.0.0 Runtime Patch
// This patches the claimDailyReward function to use server API

console.log('🔧 Applying v3.0.0 Patch to ui.js...');

// Store original function
window.ui._originalClaimDailyReward = window.ui.claimDailyReward;

// Replace with v3-compatible async version
window.ui.claimDailyReward = async function() {
    const hoursLeft = window.storage ? window.storage.getTimeUntilDailyReward() : 24;
    
    if (hoursLeft > 0) {
        alert(`Daily reward available in ${hoursLeft} hours!`);
        return;
    }
    
    if (!window.storage) {
        alert('Storage system not ready');
        return;
    }
    
    try {
        const result = await window.storage.claimDailyReward();
        
        if (result) {
            window.ui.updateCurrencyDisplay();
            window.ui.checkDailyReward();
            
            if (window.isV3Mode && result.goldReward) {
                window.ui.showNotification(`Daily Reward Claimed! +${result.goldReward} Gold 🪙 +${result.gemsReward} Gem 💎`, 'success');
            } else {
                window.ui.showNotification('Daily Reward Claimed! +100 Gold 🪙 +1 Gem 💎', 'success');
            }
        } else {
            alert('Could not claim daily reward. Please try again.');
        }
    } catch (error) {
        console.error('Failed to claim daily reward:', error);
        alert(error.message || 'Could not claim daily reward. Please try again.');
    }
};

// Also update the global function
window.claimDailyReward = window.ui.claimDailyReward;

console.log('✅ ui.js patched for v3.0.0!');
