// Quick Test Suite for V3.0 Abilities
// Run these tests in Debug Mode to verify ability implementations

console.log('🧪 V3.0 Abilities Test Suite Ready');

window.v3AbilityTests = {
    // Test 1: Attack Triggers
    testAttackTriggers: function() {
        console.log('\n=== TEST 1: Attack Triggers ===');
        console.log('Cards to test:');
        console.log('- Flameheart Scout (1 mana): Attack Trigger: Deal 1 damage');
        console.log('- Magma Lizard (1 mana): Attack Trigger: Deal 1 damage');
        console.log('- Crimson Assassin (3 mana): Attack Trigger: Draw a card');
        console.log('- Inferno Titan (7 mana): Attack Trigger: Deal 3 damage');
        console.log('\nExpected: Damage/draw triggers when creature attacks');
    },
    
    // Test 2: Auras
    testAuras: function() {
        console.log('\n=== TEST 2: Auras ===');
        console.log('Cards to test:');
        console.log('- War Drummer (3 mana): Your Crimson creatures have +1 attack');
        console.log('- Crimson Warlord (4 mana): Your Crimson creatures have Charge');
        console.log('- Arcane Scholar (2 mana): Your Azure spells cost 1 less');
        console.log('- Plague Doctor (4 mana): All enemy creatures have -1/-1');
        console.log('\nExpected: Buffs/debuffs apply when creature is on board');
    },
    
    // Test 3: Deathrattles
    testDeathrattles: function() {
        console.log('\n=== TEST 3: Deathrattles ===');
        console.log('Cards to test:');
        console.log('- Lava Hound (2 mana): Deathrattle: Deal 2 damage to enemy');
        console.log('- Molten Golem (5 mana): Deathrattle: Deal 3 damage to all enemies');
        console.log('- Grave Rat (1 mana): Deathrattle: Summon 1/1 Skeleton');
        console.log('- Death Knight (5 mana): Deathrattle: Deal 5 damage to all');
        console.log('\nExpected: Effects trigger when creature dies');
    },
    
    // Test 4: Battlecries
    testBattlecries: function() {
        console.log('\n=== TEST 4: Battlecries ===');
        console.log('Cards to test:');
        console.log('- Azure Initiate (1 mana): Draw a card when played');
        console.log('- Earthroot Elk (4 mana): Battlecry: Gain 3 health');
        console.log('- Fire Cultist (3 mana): Battlecry: Deal 2 damage');
        console.log('- Void Terror (6 mana): Destroy all allies, gain stats');
        console.log('\nExpected: Effects trigger immediately when played');
    },
    
    // Test 5: Cost Reduction
    testCostReduction: function() {
        console.log('\n=== TEST 5: Dynamic Costs ===');
        console.log('Cards to test:');
        console.log('- Arcane Giant (8 mana): Costs 1 less per spell cast');
        console.log('- Volcanic Drake (6 mana): Costs 1 less per enemy creature');
        console.log('- Bone Collector (3 mana): Costs 1 less per friendly death');
        console.log('- Azure Colossus (9 mana): Costs 1 less per spell cast');
        console.log('\nExpected: Mana cost decreases based on conditions');
    },
    
    // Test 6: Conditional Bonuses
    testConditionals: function() {
        console.log('\n=== TEST 6: Conditional Bonuses ===');
        console.log('Cards to test:');
        console.log('- Raging Treant: +2/+2 if you have Crimson AND Verdant');
        console.log('- Stormfire Mage: Spell Power +2 if both colors');
        console.log('- Tide Treant: Taunt + draw, +2/+2 if both colors');
        console.log('- Verdant Disciple: Gains Taunt if Azure on board');
        console.log('\nExpected: Bonuses activate with correct board state');
    },
    
    // Test 7: Splash Cards
    testSplash: function() {
        console.log('\n=== TEST 7: Splash Bonuses ===');
        console.log('Cards to test (need 3rd color):');
        console.log('- Cauterize: Deal 4, splash: restore 3 health');
        console.log('- Reckless Gambit: Deal 6, splash: no self-damage');
        console.log('- Battle Triage: Restore 4, splash: always draw');
        console.log('- Emergency Roots: Summon 3/3, splash: heal 5');
        console.log('\nExpected: Bonuses only when card is 3rd color');
    },
    
    // Test 8: On-Death Triggers
    testOnDeathTriggers: function() {
        console.log('\n=== TEST 8: On-Death Triggers ===');
        console.log('Cards to test:');
        console.log('- Umbral Reaper: Gain +1/+1 when ANY creature dies');
        console.log('- Soul Harvester: Gain 2 health when creature dies');
        console.log('- Grave Lord: Summon skeleton when ally dies');
        console.log('- Carrion Feeder: Gain +1/+1 when ally dies');
        console.log('\nExpected: Triggers activate on any death in game');
    },
    
    // Test 9: Special Mechanics
    testSpecialMechanics: function() {
        console.log('\n=== TEST 9: Special Mechanics ===');
        console.log('Cards to test:');
        console.log('- Ancient Protector: You take no damage while alive');
        console.log('- Phoenix Eternal: Returns at end of turn when dies');
        console.log('- Eternal Lich: Cannot go below 1 health');
        console.log('- Dream Weaver: Unlimited hand size');
        console.log('- Whale Shark: Can\'t attack');
        console.log('\nExpected: Unique mechanics work as described');
    },
    
    // Test 10: Complex Spells
    testComplexSpells: function() {
        console.log('\n=== TEST 10: Complex Spells ===');
        console.log('Spells to test:');
        console.log('- Chain Lightning: Chain if kills');
        console.log('- Mass Recall: Return all creatures to hands');
        console.log('- Blood Ritual: Deal 5, gain 5, repeat if both colors');
        console.log('- Nature\'s Vengeance: Deal 10, restore 10, summon 5/5');
        console.log('- Omniscience: Draw 5, spells cost 0 this turn');
        console.log('\nExpected: Multi-part effects execute correctly');
    },
    
    // Run all tests
    runAll: function() {
        console.log('🧪 Running All V3.0 Ability Tests...\n');
        this.testAttackTriggers();
        this.testAuras();
        this.testDeathrattles();
        this.testBattlecries();
        this.testCostReduction();
        this.testConditionals();
        this.testSplash();
        this.testOnDeathTriggers();
        this.testSpecialMechanics();
        this.testComplexSpells();
        console.log('\n✅ Test suite complete! Use Debug Mode to verify each category.');
    },
    
    // Quick card lookup for testing
    getCard: function(name) {
        return window.ALL_CARDS.find(c => c.name === name);
    },
    
    // Print card info
    info: function(cardName) {
        const card = this.getCard(cardName);
        if (card) {
            console.log('\n📋 Card Info:');
            console.log('Name:', card.name);
            console.log('Cost:', card.cost);
            console.log('Type:', card.type);
            console.log('Stats:', card.attack + '/' + card.health);
            console.log('Ability:', card.ability);
            console.log('Color:', card.color);
            console.log('Rarity:', card.rarity);
            if (card.splashFriendly) {
                console.log('Splash Bonus:', card.splashBonus);
            }
        } else {
            console.log('Card not found:', cardName);
        }
    }
};

// Quick access
window.testAbilities = window.v3AbilityTests.runAll.bind(window.v3AbilityTests);

console.log('✅ Test suite loaded!');
console.log('📝 Usage:');
console.log('  window.testAbilities() - Run all tests');
console.log('  window.v3AbilityTests.info("Card Name") - Get card info');
console.log('  window.v3AbilityTests.getCard("Card Name") - Get card object');
