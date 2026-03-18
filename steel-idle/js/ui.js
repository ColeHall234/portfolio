// updateUI - reads from gameState and updates what the player sees
function updateBuildingButton(buttonId, building, ownedText) {
    const button = document.getElementById(buttonId);
    if (building.owned) {
        button.textContent = ownedText;
        button.disabled = true;
    } else if (gameState.resources.cash < building.cost) {
        button.disabled = true;
    } else {
        button.disabled = false;
    }
}

function updateUI() {
    document.getElementById("iron-ore").textContent = gameState.resources.ironOre;
    document.getElementById("coal").textContent = gameState.resources.coal;
    document.getElementById("limestone").textContent = gameState.resources.limestone;
    document.getElementById("coke").textContent = gameState.resources.coke;
    document.getElementById("cash").textContent = gameState.resources.cash;

    // Update buy button based on ownership and affordability
    updateBuildingButton("buy-coke-oven", gameState.buildings.cokeOven, "Coke Oven Owned");
    updateBuildingButton("buy-iron-shaft", gameState.buildings.ironShaft, "Iron Shaft Owned");
    updateBuildingButton("buy-coal-shaft", gameState.buildings.coalShaft, "Coal Shaft Owned");
    updateBuildingButton("buy-limestone-shaft", gameState.buildings.limestoneShaft, "Limestone Shaft Owned");

    const currentRank = getCurrentRank();
const nextRankIndex = gameState.player.currentRankIndex + 1;
const isMaxRank = nextRankIndex >= gameState.ranks.length;

document.getElementById("rank-title-display").textContent = currentRank.title;

const currentExp = gameState.player.exp;
const currentRankExp = currentRank.expRequired;
const nextRankExp = isMaxRank ? currentExp : gameState.ranks[nextRankIndex].expRequired;
const expIntoCurrentRank = currentExp - currentRankExp;
const expNeededForNextRank = nextRankExp - currentRankExp;
const percentage = isMaxRank ? 100 : Math.min((expIntoCurrentRank / expNeededForNextRank) * 100, 100);

document.getElementById("exp-bar").style.width = percentage + "%";
document.getElementById("exp-label").textContent = isMaxRank
  ? "MAX RANK"
  : currentExp + " / " + nextRankExp + " EXP";


    // Update active contract display
if (gameState.contracts.active) {
  const contract = gameState.contracts.active;
  document.getElementById("active-contract-details").classList.remove("hidden");
  document.getElementById("no-active-contract").classList.add("hidden");
  document.getElementById("active-client").textContent = contract.client;
  document.getElementById("active-description").textContent = contract.required.resource + " x" + contract.required.quantity;
  document.getElementById("active-progress").textContent = "Progress: " + contract.progress + " / " + contract.required.quantity;
  document.getElementById("active-reward").textContent = "Reward: $" + contract.reward.cash + " + " + contract.reward.exp + " EXP";
} else {
  document.getElementById("active-contract-details").classList.add("hidden");
  document.getElementById("no-active-contract").classList.remove("hidden");
}

// Hide available contract card if already accepted
if (gameState.contracts.active && gameState.contracts.active.id === "contract-iron-50") {
  document.getElementById("contract-iron-50").classList.add("hidden");
} else if (!gameState.contracts.available.find(c => c.id === "contract-iron-50")) {
  document.getElementById("contract-iron-50").classList.add("hidden");
} else {
  document.getElementById("contract-iron-50").classList.remove("hidden");
}
}

function showNotification(message) {
    const notification = document.getElementById("notification");
    const notificationMessage = document.getElementById("notification-message");

    notificationMessage.textContent = message;
    notification.classList.remove("hidden");
    
    setTimeout(() => {
        notification.classList.add("hidden");
    }, 3000);
}

// Button Listeners - tell each button which function to run when clicked
document.addEventListener("DOMContentLoaded", function() {
    loadGame(); // Load game state from localStorage when the page loads
    document.getElementById("mine-iron").addEventListener("click", mineIronOre);
    document.getElementById("mine-coal").addEventListener("click", mineCoal);
    document.getElementById("mine-limestone").addEventListener("click", mineLimestone);
    document.getElementById("buy-coke-oven").addEventListener("click", buyCokeOven);
    document.getElementById("buy-iron-shaft").addEventListener("click", buyIronShaft);
    document.getElementById("buy-coal-shaft").addEventListener("click", buyCoalShaft);
    document.getElementById("buy-limestone-shaft").addEventListener("click", buyLimestoneShaft);
    document.getElementById("sell-ore").addEventListener("click", sellOre);
    document.getElementById("save-game").addEventListener("click", saveGame);
    document.getElementById("delete-save").addEventListener("click", deleteSave);
    document.querySelectorAll(".accept-contract").forEach(function(button) {
    button.addEventListener("click", function() {
    acceptContract(button.dataset.contractId);
  });
});
});