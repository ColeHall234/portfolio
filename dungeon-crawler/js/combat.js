let combat_interval = null;
let player_attack_cooldown = 0;
let mana_regen_tick = 0;
let game_running = false;
let shield_active = false;
let tick = 0;
function start_combat() {
    if (combat_interval) clearInterval(combat_interval);
    game_running = true;
    combat_interval = setInterval(function () {
        if (!game_running) return;
        combat_tick();
    }, 1000);
}

function combat_tick() {
    player_attack_cooldown -= 1;
    mana_regen_tick += 1;
    sound_attack();
    if (player_attack_cooldown <= 0) {
        let alive = get_alive_enemies();
        if (alive.length > 0) {
            let target = alive[0];
            let damage = player_attack_damage();
            let is_crit = Math.random() < crit_chance;
            if (is_crit) {
                damage *= 2;
                add_to_log("💥 CRITICAL STRIKE! You hit " + target.name + " for " + Math.floor(damage));
                if (crit_mana > 0) {
                    player.mana = Math.min(player.max_mana, player.mana + crit_mana);
                }
            } else {
                add_to_log("⚔️ You strike " + target.name + " for " + damage);
            }

            enemy_take_damage(target, damage);
            player_attack_cooldown = 2;
        }
    }

    if (mana_regen_tick % 2 === 0) {
        player.mana = Math.min(player.max_mana, player.mana + 2);
        update_player_ui();
    }

    if (tick % 30 === 0 && tick > 0) {
        save_game();
    }

    tick_ability_cooldowns();
    enemy_attack_tick();
    tick_boosts();
}

function tick_ability_cooldowns() {
    ABILITIES.forEach(function (ability) {
        if (ability.current_cooldown > 0) {
            ability.current_cooldown -= 1;
        }
    });
    render_abilities();
}

function use_ability(ability_id) {
    sound_ability();
    let ability = ABILITIES.find(function (a) {
        return a.id === ability_id;
    });
    if (!ability) return;
    if (ability.current_cooldown > 0) {
        add_to_log("⏳ " + ability.name + " is on cooldown.");
        return;
    }
    if (player.mana < ability.mana_cost) {
        add_to_log("💧 Not enough mana for " + ability.name + ".");
        return;
    }
    player.mana -= ability.mana_cost;
    if (ability_mana_regen > 0) {
        player.mana = Math.min(player.max_mana, player.mana + ability_mana_regen);
    }
    ability.current_cooldown = ability.cooldown;

    let alive = get_alive_enemies();
    if (alive.length === 0) return;
    let target = alive[0];

    if (ability.effect === "damage") {
        let power = Math.floor(ability.power * spell_power_bonus);
        add_to_log("✨ " + ability.name + " hits " + target.name + " for " + power + "!");
        enemy_take_damage(target, power);
    } else if (ability.effect === "drain") {
        let power = Math.floor(ability.power * spell_power_bonus);
        add_to_log("🩸 " + ability.name + " drains " + power + " from " + target.name + "!");
        enemy_take_damage(target, power);
        player_heal(Math.floor(power / 2));
    }

    update_player_ui();
    render_abilities();
}

function game_over() {
    game_running = false;
    clearInterval(combat_interval);
    add_to_log("💀 You have fallen. The darkness claims you.");
    document.getElementById("combat-log").innerHTML +=
        "<p id='game-over-msg'>☠️ GAME OVER — <button onclick='restart_game()'>Rise Again</button></p>";
}

function restart_game() {
    player.hp = player.max_hp;
    player.mana = player.max_mana;
    player.xp = 0;
    player.level = 1;
    player.xp_to_next = 100;
    player.attack = 10;
    player.defense = 2;
    player.shield = 0;
    player.kills = 0;
    current_floor = 1;
    ABILITIES.forEach(function (a) { a.current_cooldown = 0; });
    document.getElementById("floor-display").innerText = "Floor 1";
    document.getElementById("combat-log").innerHTML = "";
    spawn_floor(1);
    start_combat();
    update_player_ui();
}

function show_level_up_choices() {
    game_running = false;
    let panel = document.getElementById("ability-panel");
    panel.innerHTML = "<h3>⚔️ Level Up!</h3><p>Choose a stat:</p>" +
        "<button onclick='apply_level_up(\"hp\")'>+25 Max HP</button>" +
        "<button onclick='apply_level_up(\"attack\")'>+5 Attack</button>" +
        "<button onclick='apply_level_up(\"defense\")'>+3 Defense</button>" +
        "<button onclick='apply_level_up(\"mana\")'>+15 Max Mana</button>";
}

function apply_level_up(stat) {
    if (stat === "hp") {
        player.max_hp += 35;
        player.hp = player.max_hp;
    } else if (stat === "attack") {
        player.attack += 7;
    } else if (stat === "defense") {
        player.defense += 4;
    } else if (stat === "mana") {
        player.max_mana += 20;
        player.mana = player.max_mana;
    }
    add_to_log("📈 " + stat.toUpperCase() + " increased!");
    game_running = true;
    let panel = document.getElementById("ability-panel");
    panel.innerHTML = "<h3>Abilities</h3><div id='ability-buttons'></div>";
    render_abilities();
    update_player_ui();
}

function tick_boosts() {
    active_boosts.forEach(function (boost) {
        boost.ticks_left -= 1;
        if (boost.ticks_left <= 0) {
            if (boost.effect === "attack_boost") {
                player.attack -= boost.power;
                add_to_log("📜 Scroll of Power fades.");
            } else if (boost.effect === "defense_boost") {
                player.defense -= boost.power;
                add_to_log("🛡️ Ward dissipates.");
            }
        }
    });
    active_boosts = active_boosts.filter(function (b) {
        return b.ticks_left > 0;
    });
}

function restart_game() {
    delete_save();
    player.hp = player.max_hp;
    player.mana = player.max_mana;
    player.xp = 0;
    player.level = 1;
    player.xp_to_next = 100;
    player.attack = 12;
    player.defense = 4;
    player.shield = 0;
    player.kills = 0;
    player.gold = 0;
    current_floor = 1;
    inventory = [];
    equipped = { weapon: null, armor: null, ring: null };
    consumables = [];
    active_boosts = [];
    ABILITIES.forEach(function (a) { a.current_cooldown = 0; });
    document.getElementById("floor-display").innerText = "Floor 1";
    document.getElementById("combat-log").innerHTML = "";
    spawn_floor(1);
    start_combat();
    update_player_ui();
    update_gold_display();
    render_hotbar();
    render_inventory();
}