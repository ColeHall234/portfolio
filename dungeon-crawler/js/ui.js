function update_player_ui() {
    let hp_percent = (player.hp / player.max_hp) * 100;
    document.getElementById("player-hp-bar").style.width = hp_percent + "%";
    document.getElementById("player-hp-bar").style.background =
        hp_percent > 50 ? "#00cc66" : hp_percent > 25 ? "#ffaa00" : "#cc0000";
    document.getElementById("player-hp-text").innerText =
        "HP: " + Math.ceil(player.hp) + " / " + player.max_hp +
        (player.shield > 0 ? " 🛡️ " + player.shield : "");
    document.getElementById("player-mana-text").innerText =
        "Mana: " + Math.ceil(player.mana) + " / " + player.max_mana;
    document.getElementById("player-stats-text").innerText =
        "ATK: " + player.attack + " | DEF: " + player.defense + " | Level: " + player.level;
    document.getElementById("player-xp-text").innerText =
        "XP: " + player.xp + " / " + player.xp_to_next;
}

function render_enemies() {
    let container = document.getElementById("enemy-container");
    container.innerHTML = "";
    active_enemies.forEach(function (enemy) {
        if (enemy.hp <= 0) return;
        let hp_percent = (enemy.hp / enemy.max_hp) * 100;
        let div = document.createElement("div");
        div.className = "enemy-card" + (enemy.is_boss ? " boss" : "");
        div.innerHTML =
            "<p class='enemy-name'>" + enemy.name + "</p>" +
            "<div class='hp-bar-container'>" +
            "<div class='hp-bar enemy-hp-bar' style='width:" + hp_percent + "%'></div>" +
            "</div>" +
            "<p class='enemy-hp-text'>" + Math.ceil(enemy.hp) + " / " + enemy.max_hp + " HP</p>";
        container.appendChild(div);
    });
}

function add_to_log(message) {
    let log = document.getElementById("combat-log");
    let p = document.createElement("p");
    p.innerText = message;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
    while (log.children.length > 50) {
        log.removeChild(log.firstChild);
    }
}

function render_abilities() {
    let container = document.getElementById("ability-buttons");
    if (!container) return;
    container.innerHTML = "";
    ABILITIES.forEach(function (ability) {
        let btn = document.createElement("button");
        btn.className = "ability-btn" + (ability.current_cooldown > 0 ? " on-cooldown" : "");
        btn.innerHTML =
            "<span class='ability-name'>" + ability.name + "</span>" +
            "<span class='ability-cost'>Mana: " + ability.mana_cost + "</span>" +
            (ability.current_cooldown > 0 ?
                "<span class='ability-cd'>CD: " + ability.current_cooldown + "s</span>" :
                "<span class='ability-ready'>Ready</span>");
        btn.onclick = function () { use_ability(ability.id); };
        container.appendChild(btn);
    });
}

function render_inventory() {
    let existing = document.getElementById("inventory-panel");
    if (existing) existing.remove();
    let panel = document.createElement("div");
    panel.id = "inventory-panel";
    panel.innerHTML = "<h3>📦 Inventory</h3>";

    let equipped_div = document.createElement("div");
    equipped_div.innerHTML = "<p class='inv-header'>Equipped:</p>";
    ["weapon", "armor", "ring"].forEach(function (slot) {
        let item = equipped[slot];
        equipped_div.innerHTML += "<p class='equipped-item'>» " + slot + ": " +
            (item ? item.name + " (ATK+" + item.attack + " DEF+" + item.defense + ")" : "empty") + "</p>";
    });
    panel.appendChild(equipped_div);

    if (inventory.length > 0) {
        let inv_div = document.createElement("div");
        inv_div.innerHTML = "<p class='inv-header'>Backpack:</p>";
        inventory.forEach(function (item, index) {
            let btn = document.createElement("button");
            btn.className = "inv-btn";
            btn.innerText = item.name + " (ATK+" + item.attack + " DEF+" + item.defense + ")";
            btn.onclick = function () { equip_item(index); };
            inv_div.appendChild(btn);
        });
        panel.appendChild(inv_div);
    }
    

    document.getElementById("game-container").appendChild(panel);
}

function update_gold_display() {
    let el = document.getElementById("gold-display");
    if (el) el.innerText = "Gold: " + player.gold;
}

function show_shop() {
    game_running = false;
    let panel = document.getElementById("ability-panel");
    panel.innerHTML = "<h3>🏪 Dark Market</h3><p class='inv-header'>Gold: " + player.gold + "</p>";
    SHOP_ITEMS.forEach(function (item) {
        let btn = document.createElement("button");
        btn.className = "ability-btn";
        btn.innerHTML = item.icon + " " + item.name + "<span class='ability-cost'>" + item.cost + " gold</span>";
        btn.onclick = function () { buy_shop_item(item); };
        panel.appendChild(btn);
    });
    let leave_btn = document.createElement("button");
    leave_btn.className = "ability-btn";
    leave_btn.innerHTML = "⚔️ Continue Descent";
    leave_btn.onclick = function () { close_shop(); };
    panel.appendChild(leave_btn);
}

function buy_shop_item(item) {
    sound_purchase();
    if (player.gold < item.cost) {
        add_to_log("💰 Not enough gold for " + item.name + ".");
        return;
    }
    player.gold -= item.cost;
    consumables.push({ ...item });
    add_to_log(item.icon + " Purchased: " + item.name + "!");
    update_gold_display();
    render_inventory();
    render_hotbar();
    show_shop();
}

function close_shop() {
    game_running = true;
    let panel = document.getElementById("ability-panel");
    panel.innerHTML = "<h3>Abilities</h3><div id='ability-buttons'></div>";
    render_abilities();
    spawn_floor(current_floor);
    start_combat();
}

function render_hotbar() {
    let slots = document.getElementById("hotbar-slots");
    if (!slots) return;
    slots.innerHTML = "";
    let max_slots = 5;
    for (let i = 0; i < max_slots; i++) {
        let btn = document.createElement("button");
        if (consumables[i]) {
            let item = consumables[i];
            btn.className = "hotbar-slot";
            btn.innerHTML =
                "<span class='hotbar-slot-icon'>" + item.icon + "</span>" + "<span class='hotbar-slot-name'>" + item.name + "</span>";
            btn.onclick = (function(index) {
                return function() { use_consumable(index); };
            })(i);
        } else {
            btn.className = "hotbar-slot hotbar-empty";
            btn.innerHMTL = "<span class='hotbar-slot-icon'>-</span>"
        }
        slots.appendChild(btn);
    }
}