function save_game() {
    let save_data = {
        player: {
            level: player.level,
            xp: player.xp,
            xp_to_next: player.xp_to_next,
            hp: player.hp,
            max_hp: player.max_hp,
            mana: player.mana,
            max_mana: player.max_mana,
            attack: player.attack,
            defense: player.defense,
            shield: player.shield,
            kills: player.kills,
            gold: player.gold,
            skill_points: player.skill_points,
            unlocked_skills: player.unlocked_skills,
        },
        current_floor: current_floor,
        inventory: inventory,
        equipped: equipped,
        consumables: consumables,
        active_boosts: active_boosts,
        abilities: ABILITIES.map(function (a) {
            return { id: a.id, current_cooldown: a.current_cooldown };
        }),
        last_saved: Date.now()
    };
    localStorage.setItem("soul_descent_save", JSON.stringify(save_data));
    add_to_log("💾 Game saved.");
}

function load_game() {
    let saved = localStorage.getItem("soul_descent_save");
    if (!saved) return false;
    let data = JSON.parse(saved);

    Object.assign(player, data.player);
    current_floor = data.current_floor;
    inventiy = data.inventory || [];
    equipped = data.equipped || { weapon: null, armor: null, ring: null };
    consumables = data.consumables || [];
    active_boosts = data.active_boosts || [];
    reapply_all_skills();
    render_skill_tree();

    data.abilities.forEach(function (saved_ability) {
        let ability = ABILITIES.find(function (a) {
            return a.id === saved_ability.id;
        });
        if (ability) ability.current_cooldown = saved_ability.current_cooldown;
    });

    return true;
}

function delete_save() {
    localStorage.removeItem("soul_descent_save");
    add_to_log("🗑️ Save deleted.");
}