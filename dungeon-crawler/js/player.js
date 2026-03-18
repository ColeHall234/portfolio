let player = {
    name: "The Sorcerer",
    level: 1,
    xp: 0,
    xp_to_next: 100,
    hp: 150,
    max_hp: 150,
    mana: 80,
    max_mana: 80,
    attack: 12,
    defense: 4,
    shield: 0,
    kills: 0,
    gold: 0,
    skill_points: 0,
    unlocked_skills: []
};

function player_attack_damage() {
    let base = player.attack;
    let variance = Math.floor(Math.random() * 5) - 2;
    return Math.max(1, base + variance);
}

function player_take_damage(amount) {
    sound_player_hit();
    if (player.shield > 0) {
        let absorbed = Math.min(player.shield, amount);
        player.shield -= absorbed;
        amount -= absorbed;
        add_to_log("🛡️ Your shield absorbs " + absorbed + " damage.");
    }
    let actual = Math.max(1, amount - player.defense);
    player.hp = Math.max(0, player.hp - actual);
    update_player_ui();
    if (player.hp <= 0) {
        game_over();
    }
}

function player_gain_xp(amount) {
    player.xp += amount;
    add_to_log("✨ +" + amount + " XP");
    if (player.xp >= player.xp_to_next) {
        level_up();
    }
    update_player_ui();
}

function level_up() {
    sound_level_up();
    player.xp -= player.xp_to_next;
    player.level += 1;
    player.xp_to_next = Math.floor(player.xp_to_next * 1.5);
    player.skill_points += 1;
    add_to_log("⚔️ Level " + player.level + "! Choose a stat to increase.");
    add_to_log("🌟 You gained a skill point! (" + player.skill_points + " available)");
    show_level_up_choices();
}

function player_heal(amount) {
    player.hp = Math.min(player.max_hp, player.hp + amount);
    update_player_ui();
}