let crit_chance = 0;
let lifesteal = 0;
let crit_mana = 0;
let spell_power_bonus = 1;
let ability_mana_regen = 0;

function unlock_skill(skill_id) {
    let skill = SKILL_TREE.find(function (s) {
        return s.id === skill_id;
    });
    if (!skill) return;
    if (player.unlocked_skills.includes(skill_id)) {
        add_to_log("Already unlocked.");
        return;
    }
    if (skill.requires && !player.unlocked_skills.includes(skill.requires)) {
        add_to_log("⚠️ Unlock " + skill.requires + " first.");
        return;
    }
    if (player.skill_points < skill.cost) {
        add_to_log("⚠️ Not enough skill points.");
        return;
    }
    player.skill_points -= skill.cost;
    player.unlocked_skills.push(skill_id);
    apply_skill_effect(skill);
    add_to_log("🌟 Unlocked: " + skill.name + "!");
    render_skill_tree();
    update_player_ui();
}

function apply_skill_effect(skill) {
    let e = skill.effect;
    if (e.type === "crit_chance") crit_chance += e.value;
    else if (e.type === "lifesteal") lifesteal += e.value;
    else if (e.type === "crit_mana") crit_mana += e.value;
    else if (e.type === "lifesteal_bonus") lifesteal += e.value;
    else if (e.type === "cooldown_reduction") {
        ABILITIES.forEach(function (a) {
            a.cooldown = Math.max(1, a.cooldown - e.value);
        });
    }
    else if (e.type === "spell_power") spell_power_bonus += e.value;
    else if (e.type === "spell_power_bonus") spell_power_bonus += e.value;
    else if (e.type === "ability_mana_regen") ability_mana_regen += e.value;
}

function reapply_all_skills() {
    crit_chance = 0;
    lifesteal = 0;
    crit_mana = 0;
    spell_power_bonus = 1;
    ability_mana_regen = 0;
    player.unlocked_skills.forEach(function (id) {
        let skill = SKILL_TREE.find(function (s) { return s.id === id; });
        if (skill) apply_skill_effect(skill);
    });
}

function render_skill_tree() {
    let container = document.getElementById("skill-tree-grid");
    if (!container) return;
    container.innerHTML = "";
    SKILL_TREE.forEach(function (skill) {
        let unlocked = player.unlocked_skills.includes(skill.id);
        let available = !unlocked && (
            skill.requires === null ||
            player.unlocked_skills.includes(skill.requires)
        );
        let node = document.createElement("div");
        node.className = "skill-node " +
            (unlocked ? "unlocked" : available ? "available" : "locked");
        node.style.gridColumn = (skill.x + 1);
        node.style.gridRow = (skill.y + 1);
        node.innerHTML =
            "<span class='skill-name'>" + skill.name + "</span>" +
            "<span class='skill-desc'>" + skill.desc + "</span>" +
            (available ? "<span class='skill-cost'>1 point</span>" : "");
        if (available) {
            node.onclick = function () { unlock_skill(skill.id); };
        }
        container.appendChild(node);
    });
    document.getElementById("skill-points-display").innerText =
        "Skill Points: " + player.skill_points;
}