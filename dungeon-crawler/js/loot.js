let inventory = [];
let consumables = [];
let active_boosts = [];
let equipped = {
    weapon: null,
    armor: null,
    ring: null
};

const ITEMS = [
    { id: "rusty_blade", name: "Rusty Blade", type: "weapon", slot: "weapon", attack: 5, defense: 0, floor: 1 },
    { id: "bone_staff", name: "Bone Staff", type: "weapon", slot: "weapon", attack: 10, defense: 0, floor: 2 },
    { id: "void_dagger", name: "Void Dagger", type: "weapon", slot: "weapon", attack: 18, defense: 0, floor: 4 },
    { id: "tattered_robe", name: "Tattered Robe", type: "armor", slot: "armor", attack: 0, defense: 3, floor: 1 },
    { id: "shadow_cloak", name: "Shadow Cloak", type: "armor", slot: "armor", attack: 0, defense: 7, floor: 3 },
    { id: "soul_ring", name: "Soul Ring", type: "ring", slot: "ring", attack: 3, defense: 2, floor: 2 },
    { id: "void_sigil", name: "Void Sigil", type: "ring", slot: "ring", attack: 8, defense: 4, floor: 4 }
];

function roll_loot(floor) {
    let gold_earned = Math.floor(Math.random() * 15) + 5 + Math.floor(floor * 2);
    player.gold += gold_earned;
    add_to_log("💰 +" + gold_earned + " gold");
    update_gold_display();

    if (Math.random() > 0.65) return;

    if (Math.random() < 0.4) {
        let eligible = CONSUMABLES.filter(function (c) {
            return c.floor <= floor;
        });
        let pool = [];
        eligible.forEach(function (c) {
            for (let i = 0; i < c.drop_weight; i++) {
                pool.push(c);
            }
        });
        let dropped = pool[Math.floor(Math.random() * pool.length)];
        consumables.push({ ...dropped });
        add_to_log(dropped.icon + " Found: " + dropped.name + "!");
    } else {
        let eligible = ITEMS.filter(function (item) {
            return item.floor <= floor;
        });
        if (eligible.length === 0) return;
        let item = eligible[Math.floor(Math.random() * eligible.length)];
        inventory.push({ ...item });
        add_to_log("🎁 Loot dropped: " + item.name + "!");
    }
    render_hotbar();
    render_inventory();
}

function equip_item(index) {
    let item = inventory[index];
    if (!item) return;
    let previously_equipped = equipped[item.slot];
    if (previously_equipped) {
        player.attack -= previously_equipped.attack;
        player.defense -= previously_equipped.defense;
        inventory.push(previously_equipped);
        add_to_log("📦 Unequipped: " + previously_equipped.name);
    }
    equipped[item.slot] = item;
    player.attack += item.attack;
    player.defense += item.defense;
    inventory.splice(index, 1);
    add_to_log("⚔️ Equipped: " + item.name);
    update_player_ui();
    render_inventory();
}

function use_consumable(index) {
    let item = consumables[index];
    if (!item) return;

    if (item.effect === "heal") {
        player_heal(item.power);
        add_to_log(item.icon + " Used " + item.name + ". Restored " + item.power + " HP.");
    } else if (item.effect === "mana") {
        player.mana = Math.min(player.max_mana, player.mana + item.power);
        add_to_log(item.icon + " Used " + item.name + ". Restored " + item.power + " mana.");
        update_player_ui();
    } else if (item.effect === "elixir") {
        player_heal(item.power);
        player.mana = Math.min(player.max_mana, player.mana + item.power);
        add_to_log(item.icon + " Used " + item.name + ". Restored HP and mana.");
        update_player_ui();
    } else if (item.effect === "attack_boost") {
        player.attack += item.power;
        active_boosts.push({ effect: "attack_boost", power: item.power, ticks_left: item.duration });
        add_to_log(item.icon + " Used " + item.name + ". Attack +" + item.power + " for " + item.duration + " seconds.");
        update_player_ui();
    } else if (item.effect === "defense_boost") {
        player.defense += item.power;
        active_boosts.push({ effect: "defense_boost", power: item.power, ticks_left: item.duration });
        add_to_log(item.icon + " Used " + item.name + ". Defense +" + item.power + " for " + item.duration + " seconds.");
        update_player_ui();
    }
    consumables.splice(index, 1);
    render_inventory();
    render_hotbar();
}