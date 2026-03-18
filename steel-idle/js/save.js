const SAVE_KEY = "steel-idle-save";

function saveGame() {
    const saveDate = JSON.stringify(gameState);
    localStorage.setItem(SAVE_KEY, saveDate);
    showNotification("Game Saved!");
}

function loadGame() {
    const saveDate = localStorage.getItem(SAVE_KEY);

    if (!saveDate) {
        return;
    }

    const parsedData = JSON.parse(saveDate);

    gameState.resources = parsedData.resources;
    gameState.prices = parsedData.prices;
    gameState.buildings = parsedData.buildings;
    gameState.ranks = parsedData.ranks;
    gameState.player = parsedData.player;
    gameState.contracts = parsedData.contracts;
    
    updateUI();
}

function deleteSave() {
    localStorage.removeItem(SAVE_KEY);
    showNotification("Save Deleted!");
}

// Auto-save every 30 seconds
setInterval(saveGame, 30000);
