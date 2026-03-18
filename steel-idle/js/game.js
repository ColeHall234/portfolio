// Game State - this object holds all the date for the game
const gameState = {
    resources: {
        ironOre: 0,
        coal: 0,
        limestone: 0,
        coke: 0,
        cash: 0,
    },

    //How much each ore sells for
    prices: {
        ironOre: 2,
        coal: 1,
        limestone: 1,
        coke: 3,
    },

    buildings: {
        cokeOven: {
            owned: false,
            cost: 50,
            coalPerCycle: 2,
            cokePerCycle: 3,
            cycleTime: 5000, // in milliseconds.
        },
        ironShaft: {
            owned: false,
            cost: 100,
            cycleTime: 3000, // in milliseconds.
        },
        coalShaft: {
            owned: false,
            cost: 150,
            cycleTime: 3000, // in milliseconds.
        },
        limestoneShaft: {
            owned: false,
            cost: 120,
            cycleTime: 3000, // in milliseconds.
        },

    },

    ranks: [
        { title: "Cinder Boy", expRequired: 0 },
        { title: "Bellows Hand", expRequired: 100 },
        { title: "Slag Puller", expRequired: 300 },
        { title: "Crucible Tender", expRequired: 600 },
        { title: "Forge Keeper", expRequired: 1000 },
    ],

    player: {
        currentRankIndex: 0,
        exp: 0,
    },

    contracts: {
    active: null,
    available: [
        {
            id: "contract-iron-50",
            client: "Ashford Ironworks",
            description: "50 units of Iron Ore",
            required: [{ resource: "ironOre", quantity: 50 }],
            reward: { cash: 150, exp: 25 },
            progress: {},
        },
        {
            id: "contract-coal-40",
            client: "Grimshaw Furnaces",
            description: "40 units of Coal",
            required: [{ resource: "coal", quantity: 40 }],
            reward: { cash: 120, exp: 20 },
            progress: {},
        },
        {
            id: "contract-limestone-30",
            client: "Caldwell Masonry",
            description: "30 units of Limestone",
            required: [{ resource: "limestone", quantity: 30 }],
            reward: { cash: 90, exp: 15 },
            progress: {},
        },
        {
            id: "contract-coke-25",
            client: "Northern Smelters",
            description: "25 units of Coke",
            required: [{ resource: "coke", quantity: 25 }],
            reward: { cash: 175, exp: 30 },
            progress: {},
        },
        {
            id: "contract-mixed-1",
            client: "Harwick & Sons",
            description: "30 Iron Ore + 20 Coal",
            required: [
                { resource: "ironOre", quantity: 30 },
                { resource: "coal", quantity: 20 }
            ],
            reward: { cash: 200, exp: 35 },
            progress: {},
        },
    ]
},
};

//Mining Functions - each adds 1 to the relevant resource and updates the display
function mineIronOre() {
    gameState.resources.ironOre += 1;
    updateUI();
}

function mineCoal() {
    gameState.resources.coal += 1;
    updateUI();
}

function mineLimestone() {
    gameState.resources.limestone += 1;
    updateUI();
}

//Sell Function - sells all resources for cash and resets them to 0
function sellOre () {
    if (gameState.resources.ironOre === 0 && gameState.resources.coal === 0 && gameState.resources.limestone === 0 && gameState.resources.coke === 0) {
        return;
    }
    const earnings =
    (gameState.resources.ironOre * gameState.prices.ironOre) +
    (gameState.resources.coal * gameState.prices.coal) +
    (gameState.resources.limestone * gameState.prices.limestone) + (gameState.resources.coke * gameState.prices.coke);

    gameState.resources.cash += earnings;
    gameState.resources.ironOre = 0;
    gameState.resources.coal = 0;
    gameState.resources.limestone = 0;
    gameState.resources.coke = 0;
    awardEXP(10); // Award 10 EXP for selling
    updateUI();
    
}

//Buy Function for Coke Oven
function buyCokeOven() {
    if (gameState.buildings.cokeOven.owned) {
        
        return;
    }
    if (gameState.resources.cash < gameState.buildings.cokeOven.cost) {
        
        return;
    }
    gameState.resources.cash -= gameState.buildings.cokeOven.cost;
    gameState.buildings.cokeOven.owned = true;
    updateUI();
}

function buyIronShaft() {
    if (gameState.buildings.ironShaft.owned) {
       
        return;
    }
    if (gameState.resources.cash < gameState.buildings.ironShaft.cost) {
        
        return;
    }
    gameState.resources.cash -= gameState.buildings.ironShaft.cost;
    gameState.buildings.ironShaft.owned = true;
    updateUI();
}

function buyCoalShaft() {
    if (gameState.buildings.coalShaft.owned) {
        
        return;
    }
    if (gameState.resources.cash < gameState.buildings.coalShaft.cost) {
        
        return;
    }
    gameState.resources.cash -= gameState.buildings.coalShaft.cost;
    gameState.buildings.coalShaft.owned = true;
    updateUI();
}

function buyLimestoneShaft() {
    if (gameState.buildings.limestoneShaft.owned) {
        
        return;
    }
    if (gameState.resources.cash < gameState.buildings.limestoneShaft.cost) {
        
        return;
    }
    gameState.resources.cash -= gameState.buildings.limestoneShaft.cost;
    gameState.buildings.limestoneShaft.owned = true;
    updateUI();
}

function runIronShaft() {
    if (!gameState.buildings.ironShaft.owned) {
        return;
    }
    gameState.resources.ironOre += 1;
    updateUI();
}

function runCoalShaft() {
    if (!gameState.buildings.coalShaft.owned) {
        return;
    }
    gameState.resources.coal += 1;
    updateUI();
}

function runLimestoneShaft() {
    if (!gameState.buildings.limestoneShaft.owned) {
        return;
    }
    gameState.resources.limestone += 1;
    updateUI();
}
//Coke Oven Production Cycle
function runCokeOven() {
    if (!gameState.buildings.cokeOven.owned) {
        return;
    }
    if (gameState.resources.coal < gameState.buildings.cokeOven.coalPerCycle) {
        return;
    }
    gameState.resources.coal -= gameState.buildings.cokeOven.coalPerCycle;
    gameState.resources.coke += gameState.buildings.cokeOven.cokePerCycle;
    updateUI();
}

// Set an interval to run the coke oven cycle every 5 seconds
setInterval(runCokeOven, gameState.buildings.cokeOven.cycleTime);

// Set intervals for mining shafts
setInterval(runIronShaft, gameState.buildings.ironShaft.cycleTime);
setInterval(runCoalShaft, gameState.buildings.coalShaft.cycleTime);
setInterval(runLimestoneShaft, gameState.buildings.limestoneShaft.cycleTime);

//Set Interval for Contract Progress
setInterval(checkContractProgress, 1000);

//Award EXP to the Player
function awardEXP(amount) {
    gameState.player.exp += amount;
    checkRankUp();
    updateUI();
}

//Check if Player can Rank Up
function checkRankUp() {
    const nextRankIndex = gameState.player.currentRankIndex + 1;

    //If there is no next rank, player is at max rank
    if (nextRankIndex >= gameState.ranks.length) {
        return;
    }

    const nextRank = gameState.ranks[nextRankIndex];

    if (gameState.player.exp >= nextRank.expRequired) {
        gameState.player.currentRankIndex = nextRankIndex;
        showNotification("Rank Up: " + nextRank.title);
        checkRankUp(); // Check if we can rank up again in case player has enough EXP for multiple ranks
    }
}
    //Get the player's current rank object
function getCurrentRank() {
        return gameState.ranks[gameState.player.currentRankIndex];  
    }

function acceptContract(contractId) {
    if (gameState.contracts.active) {
        showNotification("You already have an active contract!");
        return;
    }

    const contract = gameState.contracts.available.find(c => c.id === contractId);

    if (!contract) {
        return;
    }

    contract.accepted = true;
    gameState.contracts.active = contract;
    updateUI();
}

//Check active contract progress.
function checkContractProgress() {
    if (!gameState.contracts.active) {
        return;
    }

    const contract = gameState.contracts.active;
    let contractComplete = true;

    contract.required.forEach(function(requirement) {
        const resource = requirement.resource;
        const needed = requirement.quantity;

        //Initialize progress for this resource if not set
        if (!contract.progress[resource]) {
            contract.progress[resource] = 0;
        }

        const available = gameState.resources[resource];
        const deliver = Math.min(available, stillNeeded);

        gameState.resources[resource] -= deliver;
        contract.progress[resource] += deliver;

        if (contract.progress[resource] < needed) {
            contractComplete = false;
        }
    });

    if (contractComplete) {
        completeContract();
    }
    updateUI();

}
    


function completeContract() {
    const contract = gameState.contracts.active;

    gameState.resources.cash += contract.reward.cash;
    awardEXP(contract.reward.exp);
    showNotification("Contract Complete: " + contract.client);

    gameState.contracts.available = gameState.contracts.available.filter(c => c.id !== contract.id);
    gameState.contracts.active = null;

    updateUI();
}