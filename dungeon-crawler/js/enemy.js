let active_enemies = [];
let current_floor = 1;

function spawn_floor(floor) {
    active_enemies = [];
    if (floor % 5 === 0) {
        sound_boss();
        let boss_templates = BOSSES.filter(function (b) {
            return b.floor <= floor;
        });
        let template = boss_templates[boss_templates.length - 1];
        let boss = {
            name: template.name + " ⚡",
            hp: template.hp + Math.floor(floor * 10),
            max_hp: template.hp + Math.floor(floor * 10),
            attack: template.attack + Math.floor(floor * 2),
            defense: template.defense + Math.floor(floor * 1),
            xp: template.xp + Math.floor(floor * 20),
            id: 0,
            is_boss: true
        };
        active_enemies.push(boss);
        add_to_log("💀 A mighty evil stirs... " + boss.name + " appears!");
    } else {
        let eligible = ENEMIES.filter(function (e) {
            return e.floor <= floor;
        });
        for (let i = 0; i < ENEMIES_PER_FLOOR; i++) {
            let template = eligible[Math.floor(Math.random() * eligible.length)];
            let enemy = {
                name: template.name,
                hp: template.max_hp,
                max_hp: template.max_hp,
                attack: template.attack + Math.floor(floor * 1.2),
                defense: template.defense + Math.floor(floor * 0.5),
                xp: template.xp,
                id: i,
                is_boss: false
            };
            active_enemies.push(enemy);
        }
    }
    render_enemies();
}

function get_alive_enemies() {
    return active_enemies.filter(function (e) {
        return e.hp > 0;
    });
}

function enemy_take_damage(enemy, amount) {
    let actual = Math.max(1, amount - enemy.defense);
    enemy.hp = Math.max(0, enemy.hp - actual);
    add_to_log("💀 " + enemy.name + " takes " + actual + " damage. (" + Math.max(0, enemy.hp) + " HP left)");
    render_enemies();
    if (enemy.hp <= 0) {
        on_enemy_death(enemy);
    }
}

function on_enemy_death(enemy) {
    sound_death();
    player.kills += 1;
    add_to_log("☠️ " + enemy.name + " is destroyed. +" + enemy.xp + " XP");
    player_gain_xp(enemy.xp);
    if (enemy.is_boss) {
        roll_loot(current_floor);
        roll_loot(current_floor);
        add_to_log("👑 The boss drops rare spoils!");
    } else {
        roll_loot(current_floor);
    }
    let alive = get_alive_enemies();
    if (alive.length === 0) {
        on_floor_cleared();
    }
}

function on_floor_cleared() {
    add_to_log("✦ Floor " + current_floor + " cleared. Descending...");
    current_floor += 1;
    document.getElementById("floor-display").innerText = "Floor " + current_floor;
    setTimeout(function () {
        spawn_floor(current_floor);
    }, 2000);
}

function enemy_attack_tick() {
    let alive = get_alive_enemies();
    alive.forEach(function (enemy) {
        let damage = enemy.attack + Math.floor(Math.random() * 4) - 2;
        add_to_log("🔥 " + enemy.name + " attacks you for " + damage);
        player_take_damage(damage);
    });
}

function on_floor_cleared() {
    add_to_log("✦ Floor " + current_floor + " cleared. Descending...");
    current_floor += 1;
    document.getElementById("floor-display").innerText = "Floor " + current_floor;
    show_shop();
    save_game();
}