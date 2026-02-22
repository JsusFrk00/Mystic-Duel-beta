// Card Collection - 150 total cards (Non-module version)
// Remove 'export' and use window. assignments instead

const ALL_CARDS = [
    // Common Cards (60 total)
    { name: "Goblin Scout", cost: 1, type: "creature", attack: 2, health: 1, ability: "Quick", emoji: "👺", rarity: "common" },
    { name: "Fire Sprite", cost: 1, type: "creature", attack: 1, health: 2, ability: "Burn", emoji: "🔥", rarity: "common" },
    { name: "Shield Bearer", cost: 2, type: "creature", attack: 1, health: 4, ability: "Taunt", emoji: "🛡️", rarity: "common" },
    { name: "Forest Wolf", cost: 2, type: "creature", attack: 3, health: 2, ability: "Rush", emoji: "🐺", rarity: "common" },
    { name: "Apprentice Mage", cost: 2, type: "creature", attack: 2, health: 2, ability: "Spell Power +1", emoji: "🧙", rarity: "common" },
    { name: "Skeleton Warrior", cost: 1, type: "creature", attack: 1, health: 1, ability: "Deathrattle: Draw", emoji: "💀", rarity: "common" },
    { name: "Arcane Missile", cost: 1, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage", emoji: "✨", rarity: "common" },
    { name: "Healing Touch", cost: 1, type: "spell", attack: 0, health: 0, ability: "Restore 3 health", emoji: "💚", rarity: "common" },
    { name: "Frost Bolt", cost: 2, type: "spell", attack: 0, health: 0, ability: "Deal 3 damage, Freeze", emoji: "❄️", rarity: "common" },
    { name: "Battle Cry", cost: 2, type: "spell", attack: 0, health: 0, ability: "All allies +1/+1", emoji: "📯", rarity: "common" },
    
    // More common creatures
    { name: "Peasant", cost: 1, type: "creature", attack: 1, health: 1, ability: "", emoji: "👨‍🌾", rarity: "common" },
    { name: "Squire", cost: 1, type: "creature", attack: 2, health: 1, ability: "", emoji: "⚔️", rarity: "common" },
    { name: "Guard Dog", cost: 2, type: "creature", attack: 2, health: 3, ability: "Taunt", emoji: "🐕", rarity: "common" },
    { name: "Archer", cost: 2, type: "creature", attack: 2, health: 2, ability: "Reach", emoji: "🏹", rarity: "common" },
    { name: "Militia", cost: 3, type: "creature", attack: 3, health: 3, ability: "", emoji: "🗡️", rarity: "common" },
    { name: "Scout", cost: 2, type: "creature", attack: 2, health: 1, ability: "Quick", emoji: "🏃", rarity: "common" },
    { name: "Torch Bearer", cost: 1, type: "creature", attack: 1, health: 2, ability: "Burn", emoji: "🔦", rarity: "common" },
    { name: "Medic", cost: 3, type: "creature", attack: 2, health: 3, ability: "Lifelink", emoji: "⚕️", rarity: "common" },
    { name: "Footman", cost: 2, type: "creature", attack: 2, health: 2, ability: "Vigilance", emoji: "👮", rarity: "common" },
    { name: "Pikeman", cost: 3, type: "creature", attack: 3, health: 2, ability: "First Strike", emoji: "🎯", rarity: "common" },
    
    // More common spells
    { name: "Minor Blessing", cost: 1, type: "spell", attack: 0, health: 0, ability: "Restore 3 health", emoji: "✝️", rarity: "common" },
    { name: "Quick Shot", cost: 2, type: "spell", attack: 0, health: 0, ability: "Deal 3 damage", emoji: "➡️", rarity: "common" },
    { name: "Shield Bash", cost: 1, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage", emoji: "🛡️", rarity: "common" },
    { name: "Rally", cost: 3, type: "spell", attack: 0, health: 0, ability: "All allies +1/+1", emoji: "🚩", rarity: "common" },
    { name: "Heal", cost: 2, type: "spell", attack: 0, health: 0, ability: "Restore 5 health", emoji: "❤️", rarity: "common" },
    { name: "Burn", cost: 3, type: "spell", attack: 0, health: 0, ability: "Deal 4 damage", emoji: "🔥", rarity: "common" },
    { name: "Freeze", cost: 1, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage, Freeze", emoji: "🧊", rarity: "common" },
    { name: "Draw", cost: 2, type: "spell", attack: 0, health: 0, ability: "Draw 2 cards", emoji: "📜", rarity: "common" },
    { name: "Blessing", cost: 2, type: "spell", attack: 0, health: 0, ability: "All allies +1/+1", emoji: "🌟", rarity: "common" },
    { name: "Strike", cost: 1, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage", emoji: "⚡", rarity: "common" },
    
    // Common vanilla creatures (no abilities)
    { name: "Bear", cost: 3, type: "creature", attack: 3, health: 3, ability: "", emoji: "🐻", rarity: "common" },
    { name: "Spider", cost: 1, type: "creature", attack: 1, health: 2, ability: "", emoji: "🕷️", rarity: "common" },
    { name: "Rat", cost: 1, type: "creature", attack: 2, health: 1, ability: "", emoji: "🐀", rarity: "common" },
    { name: "Snake", cost: 2, type: "creature", attack: 3, health: 1, ability: "", emoji: "🐍", rarity: "common" },
    { name: "Boar", cost: 2, type: "creature", attack: 2, health: 2, ability: "", emoji: "🐗", rarity: "common" },
    { name: "Crow", cost: 1, type: "creature", attack: 1, health: 1, ability: "Flying", emoji: "🦅", rarity: "common" },
    { name: "Fish", cost: 1, type: "creature", attack: 1, health: 2, ability: "", emoji: "🐟", rarity: "common" },
    { name: "Frog", cost: 1, type: "creature", attack: 1, health: 1, ability: "", emoji: "🐸", rarity: "common" },
    { name: "Bat", cost: 2, type: "creature", attack: 2, health: 1, ability: "Flying", emoji: "🦇", rarity: "common" },
    { name: "Rabbit", cost: 1, type: "creature", attack: 1, health: 1, ability: "Quick", emoji: "🐰", rarity: "common" },
    
    // More common cards to reach 60
    { name: "Farmer", cost: 2, type: "creature", attack: 1, health: 3, ability: "", emoji: "👨‍🌾", rarity: "common" },
    { name: "Merchant", cost: 3, type: "creature", attack: 2, health: 4, ability: "", emoji: "💰", rarity: "common" },
    { name: "Blacksmith", cost: 3, type: "creature", attack: 3, health: 2, ability: "", emoji: "🔨", rarity: "common" },
    { name: "Innkeeper", cost: 2, type: "creature", attack: 1, health: 4, ability: "Taunt", emoji: "🏠", rarity: "common" },
    { name: "Thief", cost: 2, type: "creature", attack: 3, health: 1, ability: "Stealth", emoji: "🦹", rarity: "common" },
    { name: "Bard", cost: 3, type: "creature", attack: 2, health: 3, ability: "Draw a card", emoji: "🎵", rarity: "common" },
    { name: "Hunter", cost: 3, type: "creature", attack: 3, health: 2, ability: "Reach", emoji: "🏹", rarity: "common" },
    { name: "Sailor", cost: 2, type: "creature", attack: 2, health: 2, ability: "", emoji: "⚓", rarity: "common" },
    { name: "Monk", cost: 2, type: "creature", attack: 1, health: 3, ability: "Lifelink", emoji: "🧘", rarity: "common" },
    { name: "Ranger", cost: 3, type: "creature", attack: 2, health: 3, ability: "Vigilance", emoji: "🏞️", rarity: "common" },
    
    // Common buff/debuff spells
    { name: "Empower", cost: 1, type: "spell", attack: 0, health: 0, ability: "All allies +1/+1", emoji: "💪", rarity: "common" },
    { name: "Weaken", cost: 2, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage", emoji: "💔", rarity: "common" },
    { name: "Fortify", cost: 2, type: "spell", attack: 0, health: 0, ability: "All allies +1/+1", emoji: "🏰", rarity: "common" },
    { name: "Curse", cost: 3, type: "spell", attack: 0, health: 0, ability: "Deal 3 damage", emoji: "👻", rarity: "common" },
    { name: "Inspire", cost: 2, type: "spell", attack: 0, health: 0, ability: "Draw a card", emoji: "🌈", rarity: "common" },
    { name: "Zap", cost: 1, type: "spell", attack: 0, health: 0, ability: "Deal 2 damage", emoji: "⚡", rarity: "common" },
    { name: "Refresh", cost: 1, type: "spell", attack: 0, health: 0, ability: "Restore 3 health", emoji: "🔄", rarity: "common" },
    { name: "Energize", cost: 2, type: "spell", attack: 0, health: 0, ability: "Draw 2 cards", emoji: "⚡", rarity: "common" },
    { name: "Smite", cost: 2, type: "spell", attack: 0, health: 0, ability: "Deal 3 damage", emoji: "✨", rarity: "common" },
    { name: "Mend", cost: 2, type: "spell", attack: 0, health: 0, ability: "Restore 5 health", emoji: "🩹", rarity: "common" },
    
    // Rare Cards (50 total)
    { name: "Mystic Owl", cost: 3, type: "creature", attack: 2, health: 3, ability: "Draw a card", emoji: "🦉", rarity: "rare" },
    { name: "Shadow Assassin", cost: 3, type: "creature", attack: 4, health: 2, ability: "Stealth", emoji: "🥷", rarity: "rare" },
    { name: "Wind Dancer", cost: 3, type: "creature", attack: 3, health: 3, ability: "Flying", emoji: "🌪️", rarity: "rare" },
    { name: "Stone Golem", cost: 4, type: "creature", attack: 3, health: 6, ability: "Taunt", emoji: "🗿", rarity: "rare" },
    { name: "Ice Elemental", cost: 4, type: "creature", attack: 3, health: 5, ability: "Freeze enemy", emoji: "❄️", rarity: "rare" },
    { name: "Lightning Bolt", cost: 3, type: "spell", attack: 0, health: 0, ability: "Deal 4 damage", emoji: "⚡", rarity: "rare" },
    { name: "Healing Potion", cost: 2, type: "spell", attack: 0, health: 0, ability: "Restore 5 health", emoji: "🧪", rarity: "rare" },
    { name: "Mind Control", cost: 5, type: "spell", attack: 0, health: 0, ability: "Steal creature", emoji: "🧠", rarity: "rare" },
    { name: "Phoenix", cost: 4, type: "creature", attack: 4, health: 3, ability: "Resurrect", emoji: "🦅", rarity: "rare" },
    { name: "Crystal Guardian", cost: 5, type: "creature", attack: 4, health: 5, ability: "Spell Shield", emoji: "💎", rarity: "rare" },
    
    // More rare creatures
    { name: "Knight", cost: 4, type: "creature", attack: 4, health: 4, ability: "Vigilance", emoji: "♞", rarity: "rare" },
    { name: "Priest", cost: 3, type: "creature", attack: 2, health: 4, ability: "Lifelink", emoji: "⛪", rarity: "rare" },
    { name: "Wizard", cost: 4, type: "creature", attack: 3, health: 3, ability: "Spell Power +1", emoji: "🧙‍♂️", rarity: "rare" },
    { name: "Berserker", cost: 4, type: "creature", attack: 5, health: 3, ability: "Enrage", emoji: "😤", rarity: "rare" },
    { name: "Paladin", cost: 5, type: "creature", attack: 4, health: 5, ability: "Divine Shield", emoji: "🛡️", rarity: "rare" },
    { name: "Rogue", cost: 3, type: "creature", attack: 4, health: 2, ability: "Poison", emoji: "🗡️", rarity: "rare" },
    { name: "Shaman", cost: 4, type: "creature", attack: 3, health: 4, ability: "Windfury", emoji: "🌊", rarity: "rare" },
    { name: "Druid", cost: 4, type: "creature", attack: 3, health: 5, ability: "Regenerate", emoji: "🌳", rarity: "rare" },
    { name: "Warlock", cost: 4, type: "creature", attack: 4, health: 3, ability: "Lifesteal", emoji: "👹", rarity: "rare" },
    { name: "Ranger Lord", cost: 5, type: "creature", attack: 4, health: 4, ability: "Reach", emoji: "🏹", rarity: "rare" },
    
    // More rare spells
    { name: "Fireball", cost: 4, type: "spell", attack: 0, health: 0, ability: "Deal 5 damage", emoji: "🔥", rarity: "rare" },
    { name: "Blizzard", cost: 5, type: "spell", attack: 0, health: 0, ability: "AOE damage", emoji: "🌨️", rarity: "rare" },
    { name: "Holy Light", cost: 3, type: "spell", attack: 0, health: 0, ability: "Restore 8 health", emoji: "✨", rarity: "rare" },
    { name: "Shadow Strike", cost: 4, type: "spell", attack: 0, health: 0, ability: "Deal 5 damage", emoji: "👤", rarity: "rare" },
    { name: "Nature's Blessing", cost: 4, type: "spell", attack: 0, health: 0, ability: "All allies +2/+2", emoji: "🌿", rarity: "rare" },
    { name: "Arcane Intellect", cost: 3, type: "spell", attack: 0, health: 0, ability: "Draw 2 cards", emoji: "🧠", rarity: "rare" },
    { name: "Polymorph", cost: 4, type: "spell", attack: 0, health: 0, ability: "Silence", emoji: "🐏", rarity: "rare" },
    { name: "Execute", cost: 3, type: "spell", attack: 0, health: 0, ability: "Deal 4 damage", emoji: "⚔️", rarity: "rare" },
    { name: "Consecration", cost: 4, type: "spell", attack: 0, health: 0, ability: "AOE damage", emoji: "⭐", rarity: "rare" },
    { name: "Siphon Soul", cost: 5, type: "spell", attack: 0, health: 0, ability: "Deal 4 damage", emoji: "👻", rarity: "rare" },
    
    // Rare vanilla and simple ability creatures
    { name: "Griffin", cost: 4, type: "creature", attack: 4, health: 4, ability: "Flying", emoji: "🦅", rarity: "rare" },
    { name: "Ogre", cost: 5, type: "creature", attack: 5, health: 5, ability: "", emoji: "👹", rarity: "rare" },
    { name: "Troll", cost: 4, type: "creature", attack: 3, health: 5, ability: "Regenerate", emoji: "🧌", rarity: "rare" },
    { name: "Centaur", cost: 4, type: "creature", attack: 4, health: 3, ability: "Charge", emoji: "🐴", rarity: "rare" },
    { name: "Minotaur", cost: 5, type: "creature", attack: 5, health: 4, ability: "Trample", emoji: "🐂", rarity: "rare" },
    { name: "Harpy", cost: 3, type: "creature", attack: 3, health: 2, ability: "Flying", emoji: "🦅", rarity: "rare" },
    { name: "Basilisk", cost: 4, type: "creature", attack: 2, health: 4, ability: "Deathtouch", emoji: "🐍", rarity: "rare" },
    { name: "Hydra", cost: 5, type: "creature", attack: 4, health: 5, ability: "Double Strike", emoji: "🐉", rarity: "rare" },
    { name: "Sphinx", cost: 5, type: "creature", attack: 4, health: 4, ability: "Flying", emoji: "🦁", rarity: "rare" },
    { name: "Manticore", cost: 5, type: "creature", attack: 5, health: 3, ability: "First Strike", emoji: "🦂", rarity: "rare" },
    
    // More rare cards to reach 50
    { name: "Champion", cost: 5, type: "creature", attack: 5, health: 4, ability: "Vigilance", emoji: "🏆", rarity: "rare" },
    { name: "Sorcerer", cost: 4, type: "creature", attack: 3, health: 3, ability: "Draw a card", emoji: "🔮", rarity: "rare" },
    { name: "Templar", cost: 5, type: "creature", attack: 4, health: 5, ability: "Divine Shield", emoji: "✝️", rarity: "rare" },
    { name: "Assassin", cost: 3, type: "creature", attack: 4, health: 1, ability: "Stealth", emoji: "🗡️", rarity: "rare" },
    { name: "Elementalist", cost: 4, type: "creature", attack: 3, health: 4, ability: "Spell Power +1", emoji: "🌟", rarity: "rare" },
    { name: "Barbarian", cost: 4, type: "creature", attack: 5, health: 3, ability: "Charge", emoji: "🪓", rarity: "rare" },
    { name: "Cleric", cost: 3, type: "creature", attack: 2, health: 4, ability: "Heal all allies", emoji: "✨", rarity: "rare" },
    { name: "Necromancer", cost: 5, type: "creature", attack: 4, health: 4, ability: "Summon skeletons", emoji: "💀", rarity: "rare" },
    { name: "Pyromancer", cost: 4, type: "creature", attack: 3, health: 3, ability: "AOE damage", emoji: "🔥", rarity: "rare" },
    { name: "Frost Mage", cost: 4, type: "creature", attack: 3, health: 4, ability: "Freeze enemy", emoji: "❄️", rarity: "rare" },
    
    // Epic Cards (30 total)
    { name: "Fire Drake", cost: 5, type: "creature", attack: 5, health: 4, ability: "Flying", emoji: "🐲", rarity: "epic" },
    { name: "Dark Knight", cost: 5, type: "creature", attack: 6, health: 5, ability: "Lifesteal", emoji: "⚔️", rarity: "epic" },
    { name: "Ancient Tree", cost: 6, type: "creature", attack: 4, health: 7, ability: "Regenerate", emoji: "🌳", rarity: "epic" },
    { name: "Storm Caller", cost: 6, type: "creature", attack: 5, health: 5, ability: "AOE damage", emoji: "⛈️", rarity: "epic" },
    { name: "Meteor Strike", cost: 6, type: "spell", attack: 0, health: 0, ability: "Deal 8 damage", emoji: "☄️", rarity: "epic" },
    { name: "Time Warp", cost: 5, type: "spell", attack: 0, health: 0, ability: "Extra turn", emoji: "⏰", rarity: "epic" },
    { name: "Vampire Lord", cost: 7, type: "creature", attack: 6, health: 6, ability: "Lifesteal, Flying", emoji: "🦇", rarity: "epic" },
    { name: "Arcane Giant", cost: 8, type: "creature", attack: 8, health: 8, ability: "Costs less per spell", emoji: "🗿", rarity: "epic" },
    { name: "Lich", cost: 5, type: "creature", attack: 4, health: 4, ability: "Summon skeletons", emoji: "💀", rarity: "epic" },
    { name: "Divine Shield", cost: 4, type: "spell", attack: 0, health: 0, ability: "All allies immune", emoji: "✨", rarity: "epic" },
    
    // More epic creatures
    { name: "War Golem", cost: 7, type: "creature", attack: 7, health: 7, ability: "", emoji: "🗿", rarity: "epic" },
    { name: "Sea Giant", cost: 8, type: "creature", attack: 8, health: 8, ability: "", emoji: "🌊", rarity: "epic" },
    { name: "Mountain Giant", cost: 9, type: "creature", attack: 8, health: 9, ability: "Taunt", emoji: "⛰️", rarity: "epic" },
    { name: "Molten Giant", cost: 10, type: "creature", attack: 10, health: 8, ability: "", emoji: "🔥", rarity: "epic" },
    { name: "Frost Giant", cost: 7, type: "creature", attack: 6, health: 8, ability: "Freeze enemy", emoji: "❄️", rarity: "epic" },
    { name: "Storm Giant", cost: 8, type: "creature", attack: 7, health: 7, ability: "Windfury", emoji: "⚡", rarity: "epic" },
    { name: "Earth Elemental", cost: 6, type: "creature", attack: 5, health: 7, ability: "Taunt", emoji: "🪨", rarity: "epic" },
    { name: "Fire Elemental", cost: 6, type: "creature", attack: 6, health: 5, ability: "Battlecry: Damage", emoji: "🔥", rarity: "epic" },
    { name: "Water Elemental", cost: 5, type: "creature", attack: 4, health: 6, ability: "Freeze enemy", emoji: "💧", rarity: "epic" },
    { name: "Air Elemental", cost: 5, type: "creature", attack: 5, health: 4, ability: "Flying", emoji: "🌪️", rarity: "epic" },
    
    // More epic spells
    { name: "Flamestrike", cost: 7, type: "spell", attack: 0, health: 0, ability: "AOE damage", emoji: "🔥", rarity: "epic" },
    { name: "Pyroblast", cost: 8, type: "spell", attack: 0, health: 0, ability: "Deal 8 damage", emoji: "💥", rarity: "epic" },
    { name: "Call of the Wild", cost: 8, type: "spell", attack: 0, health: 0, ability: "Summon nature", emoji: "🦁", rarity: "epic" },
    { name: "Doom", cost: 10, type: "spell", attack: 0, health: 0, ability: "Destroy all", emoji: "☠️", rarity: "epic" },
    { name: "Equality", cost: 6, type: "spell", attack: 0, health: 0, ability: "All allies +2/+2", emoji: "⚖️", rarity: "epic" },
    { name: "Sprint", cost: 5, type: "spell", attack: 0, health: 0, ability: "Draw 3 cards", emoji: "🏃", rarity: "epic" },
    { name: "Vanish", cost: 6, type: "spell", attack: 0, health: 0, ability: "Destroy hand", emoji: "💨", rarity: "epic" },
    { name: "Brawl", cost: 5, type: "spell", attack: 0, health: 0, ability: "Destroy all", emoji: "⚔️", rarity: "epic" },
    { name: "Tree of Life", cost: 9, type: "spell", attack: 0, health: 0, ability: "Heal all allies", emoji: "🌳", rarity: "epic" },
    { name: "Astral Communion", cost: 4, type: "spell", attack: 0, health: 0, ability: "Draw 3 cards", emoji: "🌌", rarity: "epic" },
    
    // Legendary Cards (10 total)
    { name: "Dragon Emperor", cost: 9, type: "creature", attack: 9, health: 9, ability: "Destroy all", emoji: "🐉", rarity: "legendary" },
    { name: "Archmage Solarius", cost: 7, type: "creature", attack: 5, health: 7, ability: "Double spell damage", emoji: "🧙‍♂️", rarity: "legendary" },
    { name: "Death's Shadow", cost: 8, type: "creature", attack: 10, health: 5, ability: "Instant kill", emoji: "☠️", rarity: "legendary" },
    { name: "Phoenix King", cost: 8, type: "creature", attack: 7, health: 7, ability: "Resurrect all", emoji: "🔥", rarity: "legendary" },
    { name: "Titan of Earth", cost: 10, type: "creature", attack: 10, health: 10, ability: "Taunt, Immune", emoji: "⛰️", rarity: "legendary" },
    { name: "Time Lord", cost: 9, type: "creature", attack: 6, health: 8, ability: "Rewind turn", emoji: "⌛", rarity: "legendary" },
    { name: "Void Walker", cost: 6, type: "creature", attack: 5, health: 5, ability: "Destroy hand", emoji: "🌀", rarity: "legendary" },
    { name: "Angel of Light", cost: 7, type: "creature", attack: 6, health: 9, ability: "Heal all allies", emoji: "😇", rarity: "legendary" },
    { name: "Chaos Orb", cost: 10, type: "spell", attack: 0, health: 0, ability: "Random chaos", emoji: "🔮", rarity: "legendary" },
    { name: "World Tree", cost: 8, type: "creature", attack: 3, health: 12, ability: "Summon nature", emoji: "🌍", rarity: "legendary" }
];

// Card Power Values (for balancing)
const CARD_POWER = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4
};

// Card Pricing
const CARD_PRICES = {
    common: 50,
    rare: 150,
    epic: 400,
    legendary: 1000
};

// Pack Prices and Rates
const PACK_PRICES = {
    basic: { gold: 100, cards: 5, rates: { common: 0.65, rare: 0.25, epic: 0.08, legendary: 0.02 } },
    rare: { gold: 300, cards: 5, rates: { common: 0.40, rare: 0.40, epic: 0.15, legendary: 0.05 } },
    epic: { gems: 5, cards: 5, rates: { common: 0.20, rare: 0.40, epic: 0.30, legendary: 0.10 } },
    legendary: { gems: 10, cards: 5, rates: { common: 0, rare: 0.30, epic: 0.50, legendary: 0.20 } }
};

// Make available globally (replaces export statements)
window.ALL_CARDS = ALL_CARDS;
window.CARD_POWER = CARD_POWER;
window.CARD_PRICES = CARD_PRICES;
window.PACK_PRICES = PACK_PRICES;

console.log('✅ Cards data loaded: ' + ALL_CARDS.length + ' cards available');
