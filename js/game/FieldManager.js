// Field Manager - Prevents stale reference bugs
// Always returns the current field array, never a cached reference

class FieldManager {
    constructor(game) {
        this.game = game;
    }
    
    // Get current field for player (ALWAYS fresh reference)
    getField(player) {
        return player === 'player' ? this.game.playerField : this.game.aiField;
    }
    
    // Add creature to field (ALWAYS uses current reference)
    addCreature(player, creature) {
        const field = this.getField(player);
        
        if (field.length >= 7) {
            this.game.addLog("Field is full!");
            return false;
        }
        
        field.push(creature);
        return true;
    }
    
    // Remove creature from field
    removeCreature(player, creature) {
        const field = this.getField(player);
        const index = field.indexOf(creature);
        
        if (index > -1) {
            field.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    // Get all creatures (both fields)
    getAllCreatures() {
        return [...this.game.playerField, ...this.game.aiField];
    }
    
    // Find creature by property
    findCreature(property, value) {
        return this.getAllCreatures().find(c => c[property] === value);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FieldManager;
}
