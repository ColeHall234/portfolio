const ENEMIES = [
    {
        name: "Hollow Shade",
        hp: 30,
        max_hp: 30,
        attack: 5,
        defense: 1,
        xp: 20,
        floor: 1
    },
    {
        name: "Bone Revenant",
        hp: 55,
        max_hp: 55,
        attack: 8,
        defense: 2,
        xp: 35,
        floor: 2
    },
    {
        name: "Plague Wraith",
        hp: 80,
        max_hp: 80,
        attack: 12,
        defense: 3,
        xp: 55,
        floor: 3
    },
    {
        name: "Void Stalker",
        hp: 120,
        max_hp: 120,
        attack: 18,
        defense: 5,
        xp: 80,
        floor: 4
    },
    {
        name: "Dread Lich",
        hp: 200,
        max_hp: 200,
        attack: 25,
        defense: 8,
        xp: 150,
        floor: 5
    }
];

const BOSSES = [
    {
        name: "The Hollow King",
        hp: 300,
        max_hp: 300,
        attack: 30,
        defense: 8,
        xp: 300,
        floor: 5
    },
    {
        name: "Voidweaver Serrath",
        hp: 600,
        max_hp: 600,
        attack: 45,
        defense: 14,
        xp: 600,
        floor: 10
    },
    {
        name: "The Dread Sovereign",
        hp: 1200,
        max_xp: 1200,
        attack: 70,
        defense: 22,
        xp: 1200,
        floor: 15
    }
];

const CONSUMABLES = [
    { id: "health_potion", name: "Health Potion", icon: "🧪", type: "consumable", effect: "heal", power: 60, drop_weight: 4, floor: 1 },
    { id: "mana_potion", name: "Mana Potion", icon: "💧", type: "consumable", effect: "mana", power: 40, drop_weight: 4, floor: 1 },
    { id: "elixir", name: "Elixir", icon: "✨", type: "consumable", effect: "elixir", power: 40, drop_weight: 2, floor: 2 },
    { id: "scroll_of_power", name: "Scroll of Power", icon: "📜", type: "consumable", effect: "attack_boost", power: 10, duration: 5, drop_weight: 2, floor: 3 },
    { id: "ward", name: "Ward", icon: "🛡️", type: "consumable", effect: "defense_boost", power: 8, duration: 5, drop_weight: 2, floor: 3 }
];

const SKILL_TREE = [
    {
        id: "soul_mastery",
        name: "Soul Mastery",
        desc: "You bend death to your will.",
        branch: "root",
        requires: null,
        cost: 1,
        effect: { type: "none" },
        x: 2, y: 0
    },
    {
        id: "crit_strike",
        name: "Critical Strike",
        desc: "15% chance to deal double damage.",
        branch: "combat",
        requires: "soul_mastery",
        cost: 1,
        effect: { type: "crit_chance", value: 0.15 },
        x: 1, y: 1
    },
    {
        id: "lifesteal",
        name: "Lifesteal",
        desc: "Heal for 20% of damage dealt.",
        branch: "combat",
        requires: "soul_mastery",
        cost: 1,
        effect: { type: "lifesteal", value: 0.2 },
        x: 0, y: 2
    },
    {
        id: "crit_surge",
        name: "Critical Surge",
        desc: "Critical hits restore 5 mana.",
        branch: "combat",
        requires: "crit_strike",
        cost: 1,
        effect: { type: "crit_mana", value: 5 },
        x: 1, y: 2
    },
    {
        id: "vampiric",
        name: "Vampiric",
        desc: "Lifesteal increased to 35%.",
        branch: "combat",
        requires: "lifesteal",
        cost: 1,
        effect: { type: "lifesteal_bonus", value: 0.15 },
        x: 0, y: 3
    },
    {
        id: "cooldown_mastery",
        name: "Cooldown Mastery",
        desc: "All ability cooldowns reduced by 1.",
        branch: "arcane",
        requires: "soul_mastery",
        cost: 1,
        effect: { type: "cooldown_reduction", value: 1 },
        x: 3, y: 1
    },
    {
        id: "spell_power",
        name: "Spell Power",
        desc: "All abilities deal 25% more damage.",
        branch: "arcane",
        requires: "soul_mastery",
        cost: 1,
        effect: { type: "spell_power", value: 0.25 },
        x: 4, y: 2
    },
    {
        id: "flow_state",
        name: "Flow State",
        desc: "Using an ability restores 3 mana.",
        branch: "arcane",
        requires: "cooldown_mastery",
        cost: 1,
        effect: { type: "ability_mana_regen", value: 3 },
        x: 3, y: 2
    },
    {
        id: "void_mastery",
        name: "Void Mastery",
        desc: "Spell Power increased to 50%.",
        branch: "arcane",
        requires: "spell_power",
        cost: 1,
        effect: { type: "spell_power_bonus", value: 0.25 },
        x: 4, y: 3
    }
];

const SHOP_ITEMS = [
    { id: "health_potion", name: "Health Potion", icon: "🧪", type: "consumable", effect: "heal", power: 60, cost: 30 },
    { id: "mana_potion", name: "Mana Potion", icon: "💧", type: "consumable", effect: "mana", power: 40, cost: 25 },
    { id: "elixir", name: "Elixir", icon: "✨", type: "consumable", effect: "elixir", power: 40, cost: 60 },
    { id: "scroll_of_power", name: "Scroll of Power", icon: "📜", type: "consumable", effect: "attack_boost", power: 10, duration: 5, cost: 50 },
    { id: "ward", name: "Ward", icon: "🛡️", type: "consumable", effect: "defense_boost", power: 8, duration: 5, cost: 45 }
];

const ABILITIES = [
    {
        id: "soul_drain",
        name: "Soul Drain",
        description: "Drain life from the enemy",
        mana_cost: 8,
        cooldown: 3,
        current_cooldown: 0,
        effect: "drain",
        power: 30
    },
    {
        id: "void_bolt",
        name: "Void Bolt",
        description: "Hurl a bolt of void energy",
        mana_cost: 12,
        cooldown: 5,
        current_cooldown: 0,
        effect: "damage",
        power: 50
    },
    {
        id: "dark_shield",
        name: "Dark Shield",
        description: "Absorb the next attack",
        mana_cost: 15,
        cooldown: 8,
        current_cooldown: 0,
        effect: "shield",
        power: 40
    }
];

const ENEMIES_PER_FLOOR = 2;