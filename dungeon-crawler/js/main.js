window.onload = function () {
    let loaded = load_game();
    if (loaded) {
        add_to_log("⚔️ Welcome back, Sorcerer.");
        add_to_log("📍 Resuming Floor " + current_floor + "...");
        document.getElementById("floor-display").innerText = "Floor " + current_floor;
        spawn_floor(current_floor);
    } else {
        add_to_log("⚔️ You descend into the darkness...");
        add_to_log("🔥 Floor 1 begins. Enemies stir.");
        spawn_floor(1);
    }
    start_combat();
    render_skill_tree();
    render_abilities();
    update_player_ui();
    update_gold_display();
    render_hotbar();
    render_inventory();
}