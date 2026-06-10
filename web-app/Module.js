/*jslint browser: true */

/**
 * @module TopTrumps
 * @description Celebrity Top Trumps game module with betting mechanics.
 * All functions are pure - they take state and return new state without mutation.
 */

/**
 * @typedef {Object} Card
 * @property {string} name - Celebrity name
 * @property {string} nation - Nation flag emoji
 * @property {string} tier - "gold", "black", or "red"
 * @property {number} rating - Overall rating
 * @property {Object} stats - The six stat values
 * @property {number} stats.fame
 * @property {number} stats.popularity
 * @property {number} stats.legacy
 * @property {number} stats.power
 * @property {number} stats.influence
 * @property {number} stats.wealth
 */

/**
 * @typedef {Object} GameState
 * @property {Card[]} playerDeck - Player's current cards
 * @property {Card[]} cpuDeck - CPU's current cards
 * @property {number} playerCoins - Player's coin total
 * @property {number} cpuCoins - CPU's coin total
 * @property {string|null} chosenStat - Stat chosen this round
 * @property {number} currentBet - Coins bet this round
 * @property {number} playerFolds - How many times player has folded
 * @property {number} cpuFolds - How many times CPU has folded
 * @property {string} phase - "choose_stat" | "place_bet" | "cpu_response" | "round_result" | "game_over"
 * @property {string|null} winner - "player" | "cpu" | null
 * @property {string|null} lastResult - Description of last round result
 */

const cards = [
    {
        name: "Ed Sheeran",
        nation: "🇬🇧",
        tier: "gold",
        rating: 82,
        stats: {fame: 78, popularity: 80, legacy: 70, power: 55, influence: 78, wealth: 85}
    },
    {
        name: "Eminem",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 79, popularity: 82, legacy: 82, power: 50, influence: 80, wealth: 78}
    },
    {
        name: "Adele",
        nation: "🇬🇧",
        tier: "gold",
        rating: 82,
        stats: {fame: 77, popularity: 81, legacy: 75, power: 45, influence: 72, wealth: 76}
    },
    {
        name: "Kanye West",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 76, popularity: 60, legacy: 79, power: 62, influence: 81, wealth: 79}
    },
    {
        name: "Justin Bieber",
        nation: "🇨🇦",
        tier: "gold",
        rating: 82,
        stats: {fame: 76, popularity: 78, legacy: 62, power: 48, influence: 72, wealth: 77}
    },
    {
        name: "Bob Marley",
        nation: "🇯🇲",
        tier: "gold",
        rating: 82,
        stats: {fame: 75, popularity: 82, legacy: 78, power: 40, influence: 83, wealth: 36}
    },
    {
        name: "Rihanna",
        nation: "🇧🇧",
        tier: "gold",
        rating: 82,
        stats: {fame: 74, popularity: 85, legacy: 72, power: 78, influence: 80, wealth: 88}
    },
    {
        name: "Beyoncé",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 79, popularity: 89, legacy: 82, power: 72, influence: 84, wealth: 82}
    },
    {
        name: "Tom Hanks",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 78, popularity: 86, legacy: 80, power: 55, influence: 75, wealth: 80}
    },
    {
        name: "Leo DiCaprio",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 79, popularity: 78, legacy: 76, power: 58, influence: 80, wealth: 84}
    },
    {
        name: "Tom Cruise",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 77, popularity: 75, legacy: 75, power: 59, influence: 76, wealth: 85}
    },
    {
        name: "Johnny Depp",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 76, popularity: 72, legacy: 70, power: 45, influence: 68, wealth: 72}
    },
    {
        name: "Oprah Winfrey",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 79, popularity: 82, legacy: 76, power: 78, influence: 80, wealth: 82}
    },
    {
        name: "Kim Kardashian",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 78, popularity: 71, legacy: 55, power: 65, influence: 78, wealth: 81}
    },
    {
        name: "Brad Pitt",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 75, popularity: 72, legacy: 70, power: 52, influence: 68, wealth: 80}
    },
    {
        name: "Will Smith",
        nation: "🇺🇸",
        tier: "gold",
        rating: 82,
        stats: {fame: 74, popularity: 75, legacy: 72, power: 55, influence: 72, wealth: 82}
    },
    {
        name: "The Rock",
        nation: "🇺🇸",
        tier: "black",
        rating: 84,
        stats: {fame: 85, popularity: 89, legacy: 78, power: 76, influence: 79, wealth: 86}
    },
    {
        name: "Taylor Swift",
        nation: "🇺🇸",
        tier: "black",
        rating: 83,
        stats: {fame: 84, popularity: 90, legacy: 79, power: 58, influence: 88, wealth: 89}
    },
    {
        name: "Elon Musk",
        nation: "🇺🇸",
        tier: "black",
        rating: 83,
        stats: {fame: 83, popularity: 62, legacy: 74, power: 97, influence: 86, wealth: 99}
    },
    {
        name: "Albert Einstein",
        nation: "🇩🇪",
        tier: "black",
        rating: 82,
        stats: {fame: 82, popularity: 79, legacy: 94, power: 46, influence: 98, wealth: 41}
    },
    {
        name: "Beethoven",
        nation: "🇩🇪",
        tier: "black",
        rating: 82,
        stats: {fame: 82, popularity: 74, legacy: 90, power: 38, influence: 88, wealth: 42}
    },
    {
        name: "Elvis Presley",
        nation: "🇺🇸",
        tier: "black",
        rating: 81,
        stats: {fame: 81, popularity: 92, legacy: 78, power: 55, influence: 82, wealth: 72}
    },
    {
        name: "Charlie Chaplin",
        nation: "🇬🇧",
        tier: "black",
        rating: 80,
        stats: {fame: 80, popularity: 82, legacy: 81, power: 40, influence: 79, wealth: 71}
    },
    {
        name: "Princess Diana",
        nation: "🇬🇧",
        tier: "black",
        rating: 89,
        stats: {fame: 92, popularity: 95, legacy: 88, power: 60, influence: 85, wealth: 80}
    },
    {
        name: "Shakespeare",
        nation: "🇬🇧",
        tier: "black",
        rating: 88,
        stats: {fame: 90, popularity: 75, legacy: 90, power: 42, influence: 88, wealth: 44}
    },
    {
        name: "Marilyn Monroe",
        nation: "🇺🇸",
        tier: "black",
        rating: 87,
        stats: {fame: 91, popularity: 89, legacy: 85, power: 46, influence: 82, wealth: 66}
    },
    {
        name: "LeBron James",
        nation: "🇺🇸",
        tier: "black",
        rating: 86,
        stats: {fame: 93, popularity: 84, legacy: 89, power: 60, influence: 82, wealth: 96}
    },
    {
        name: "Gandhi",
        nation: "🇮🇳",
        tier: "black",
        rating: 86,
        stats: {fame: 89, popularity: 81, legacy: 82, power: 68, influence: 91, wealth: 26}
    },
    {
        name: "Napoleon",
        nation: "🇫🇷",
        tier: "black",
        rating: 82,
        stats: {fame: 70, popularity: 64, legacy: 87, power: 94, influence: 78, wealth: 82}
    },
    {
        name: "Leonardo Da Vinci",
        nation: "🇮🇹",
        tier: "black",
        rating: 82,
        stats: {fame: 69, popularity: 78, legacy: 85, power: 42, influence: 82, wealth: 55}
    },
    {
        name: "Bill Gates",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 68, popularity: 78, legacy: 82, power: 85, influence: 75, wealth: 97}
    },
    {
        name: "Mark Zuckerberg",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 64, popularity: 55, legacy: 79, power: 86, influence: 82, wealth: 96}
    },
    {
        name: "Barack Obama",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 76, popularity: 78, legacy: 85, power: 93, influence: 78, wealth: 72}
    },
    {
        name: "Mr Beast",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 66, popularity: 78, legacy: 52, power: 48, influence: 72, wealth: 85}
    },
    {
        name: "Jackie Chan",
        nation: "🇭🇰",
        tier: "black",
        rating: 82,
        stats: {fame: 64, popularity: 77, legacy: 75, power: 40, influence: 71, wealth: 72}
    },
    {
        name: "Stan Lee",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 62, popularity: 76, legacy: 80, power: 53, influence: 78, wealth: 68}
    },
    {
        name: "Serena Williams",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 74, popularity: 75, legacy: 80, power: 55, influence: 72, wealth: 70}
    },
    {
        name: "Tiger Woods",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 73, popularity: 70, legacy: 80, power: 60, influence: 70, wealth: 75}
    },
    {
        name: "Muhammad Ali",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 79, popularity: 86, legacy: 83, power: 45, influence: 78, wealth: 58}
    },
    {
        name: "Usain Bolt",
        nation: "🇯🇲",
        tier: "black",
        rating: 82,
        stats: {fame: 75, popularity: 78, legacy: 85, power: 40, influence: 72, wealth: 70}
    },
    {
        name: "Mike Tyson",
        nation: "🇺🇸",
        tier: "black",
        rating: 82,
        stats: {fame: 74, popularity: 79, legacy: 80, power: 56, influence: 70, wealth: 56}
    },
    {
        name: "David Beckham",
        nation: "🇬🇧",
        tier: "black",
        rating: 82,
        stats: {fame: 72, popularity: 75, legacy: 73, power: 59, influence: 76, wealth: 83}
    },
    {
        name: "Stephen Hawking",
        nation: "🇬🇧",
        tier: "black",
        rating: 82,
        stats: {fame: 71, popularity: 79, legacy: 86, power: 38, influence: 78, wealth: 54}
    },
    {
        name: "Isaac Newton",
        nation: "🇬🇧",
        tier: "black",
        rating: 82,
        stats: {fame: 74, popularity: 73, legacy: 88, power: 36, influence: 80, wealth: 47}
    },
    {
        name: "Lincoln",
        nation: "🇺🇸",
        tier: "black",
        rating: 85,
        stats: {fame: 88, popularity: 87, legacy: 94, power: 96, influence: 92, wealth: 62}
    },
    {
        name: "Cleopatra",
        nation: "🌍",
        tier: "black",
        rating: 85,
        stats: {fame: 86, popularity: 79, legacy: 87, power: 95, influence: 84, wealth: 95}
    },
    {
        name: "Ronaldo",
        nation: "🇵🇹",
        tier: "red",
        rating: 91,
        stats: {fame: 97, popularity: 93, legacy: 98, power: 62, influence: 95, wealth: 96}
    },
    {
        name: "Messi",
        nation: "🇦🇷",
        tier: "red",
        rating: 90,
        stats: {fame: 95, popularity: 89, legacy: 97, power: 54, influence: 96, wealth: 92}
    },
    {
        name: "Donald Trump",
        nation: "🇺🇸",
        tier: "red",
        rating: 90,
        stats: {fame: 96, popularity: 50, legacy: 76, power: 99, influence: 96, wealth: 90}
    },
    {
        name: "Michael Jackson",
        nation: "🇺🇸",
        tier: "red",
        rating: 92,
        stats: {fame: 98, popularity: 94, legacy: 97, power: 54, influence: 86, wealth: 86}
    },
    {
        name: "Jesus Christ",
        nation: "🌍",
        tier: "red",
        rating: 98,
        stats: {fame: 99, popularity: 89, legacy: 99, power: 98, influence: 99, wealth: 42}
    },
    {
        name: "Buddha",
        nation: "🌍",
        tier: "red",
        rating: 97,
        stats: {fame: 95, popularity: 90, legacy: 98, power: 85, influence: 97, wealth: 24}
    }
];

/**
 * Returns all available cards in the game.
 * @returns {Card[]} The full array of celebrity cards
 */
const getCards = () => cards;

/**
 * Returns the 16 gold cards used as the player's starting deck.
 * @returns {Card[]} Array of 16 gold tier cards
 */
const getStartingDeck = () => cards.filter((card) => card.tier === "gold");

/**
 * Generates a random CPU deck of 16 cards.
 * Gold cards are most likely, red cards rarest.
 * @returns {Card[]} Array of 16 cards for the CPU
 */
const generateCpuDeck = () => {
    const goldCards = cards.filter((c) => c.tier === "gold");
    const blackCards = cards.filter((c) => c.tier === "black");
    const redCards = cards.filter((c) => c.tier === "red");

    const pool = [
        ...goldCards,
        ...goldCards,
        ...blackCards,
        ...redCards
    ];

    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    const selected = [];
    const used = new Set();

    shuffled.forEach(function (card) {
        if (selected.length < 16 && !used.has(card.name)) {
            selected.push(card);
            used.add(card.name);
        }
    });

    while (selected.length < 16) {
        const fallback = goldCards.find((c) => !used.has(c.name));
        if (fallback) {
            selected.push(fallback);
            used.add(fallback.name);
        }
    }

    return selected;
};

/**
 * Creates a fresh game state to start a new game.
 * @param {Card[]} playerDeck - The 16 cards the player has chosen
 * @returns {GameState} Initial game state
 */
const initGame = (playerDeck) => ({
    playerDeck,
    cpuDeck: generateCpuDeck(),
    playerCoins: 100,
    cpuCoins: 100,
    chosenStat: null,
    currentBet: 0,
    playerFolds: 0,
    cpuFolds: 0,
    phase: "choose_stat",
    winner: null,
    roundWinner: null,
    lastResult: null
});

/**
 * Player chooses which stat to compare this round.
 * @param {GameState} state - Current game state
 * @param {string} stat - One of: fame, popularity, legacy, power, influence, wealth
 * @returns {GameState} Updated state with chosen stat and phase moved to place_bet
 */
const chooseStat = (state, stat) => {
    const validStats = ["fame", "popularity", "legacy", "power", "influence", "wealth"];
    if (!validStats.includes(stat)) {
        return state;
    }
    return Object.assign({}, state, {
        chosenStat: stat,
        phase: "place_bet"
    });
};

/**
 * Player places a bet for the round.
 * @param {GameState} state - Current game state
 * @param {number} amount - Bet amount (1-10, cannot exceed player's coins)
 * @returns {GameState} Updated state with bet set and phase moved to cpu_response
 */
const placeBet = (state, amount) => {
    const maxBet = Math.min(10, state.playerCoins);
    if (amount < 1 || amount > maxBet) {
        return state;
    }
    return Object.assign({}, state, {
        currentBet: amount,
        phase: "cpu_response"
    });
};

/**
 * Finds the highest stat value and name on a card.
 * @param {Card} card - A celebrity card
 * @returns {{stat: string, value: number}} The stat name and value
 */
const getHighestStat = (card) => {
    const stats = card.stats;
    return Object.keys(stats).reduce(function (best, key) {
        return stats[key] > best.value
            ? {stat: key, value: stats[key]}
            : best;
    }, {stat: "fame", value: stats.fame});
};

/**
 * CPU decides whether to fold or accept the bet.
 * CPU folds if the bet is high and its card's chosen stat is weaker.
 * CPU cannot fold if it has already folded twice.
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated state with cpu decision applied
 */
const cpuDecide = (state) => {
    const cpuCard = state.cpuDeck[0];
    const playerCard = state.playerDeck[0];
    const stat = state.chosenStat;

    const cpuStatValue = cpuCard.stats[stat];
    const playerStatValue = playerCard.stats[stat];
    const cpuIsLosing = cpuStatValue < playerStatValue;
    const betIsHigh = state.currentBet >= 7;

    const forcedToPlay = state.cpuFolds >= 2;
    const shouldFold = !forcedToPlay && cpuIsLosing && betIsHigh;

    if (shouldFold) {
        const newCpuDeck = state.cpuDeck.slice(1);
        const playerDeckWithWon = state.playerDeck.concat([cpuCard]);
        return Object.assign({}, state, {
            cpuDeck: newCpuDeck,
            playerDeck: playerDeckWithWon,
            cpuFolds: state.cpuFolds + 1,
            currentBet: 0,
            chosenStat: null,
            phase: "round_result",
            roundWinner: "player",
            lastResult: "CPU folded! You win their card but no coins."
        });
    }

    return Object.assign({}, state, {
        cpuCoins: state.cpuCoins - state.currentBet,
        phase: "round_result"
    });
};

/**
 * Resolves the round after CPU has accepted the bet.
 * Compares the chosen stat, transfers coins and card to the winner.
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated state after round is resolved
 */
const resolveRound = (state) => {
    if (state.phase !== "round_result" || state.currentBet === 0) {
        return state;
    }

    const playerCard = state.playerDeck[0];
    const cpuCard = state.cpuDeck[0];
    const stat = state.chosenStat;

    const playerValue = playerCard.stats[stat];
    const cpuValue = cpuCard.stats[stat];
    const totalPot = state.currentBet * 2;

    if (playerValue > cpuValue) {
        return Object.assign({}, state, {
            playerCoins: state.playerCoins + totalPot,
            playerDeck: state.playerDeck.slice(1).concat([playerCard, cpuCard]),
            cpuDeck: state.cpuDeck.slice(1),
            cpuFolds: 0,
            playerFolds: 0,
            currentBet: 0,
            chosenStat: null,
            phase: "choose_stat",
            roundWinner: "player",
            lastResult: `You win! ${playerCard.name}'s ${stat} (${playerValue}) beat ${cpuCard.name}'s ${stat} (${cpuValue}). You gain ${totalPot} coins and their card!`
        });
    }

    if (cpuValue > playerValue) {
        return Object.assign({}, state, {
            cpuCoins: state.cpuCoins + totalPot,
            cpuDeck: state.cpuDeck.slice(1).concat([cpuCard, playerCard]),
            playerDeck: state.playerDeck.slice(1),
            cpuFolds: 0,
            playerFolds: 0,
            currentBet: 0,
            chosenStat: null,
            phase: "choose_stat",
            roundWinner: "cpu",
            lastResult: `CPU wins! ${cpuCard.name}'s ${stat} (${cpuValue}) beat ${playerCard.name}'s ${stat} (${playerValue}). You lose ${state.currentBet} coins and your card!`
        });
    }

    return Object.assign({}, state, {
        playerCoins: state.playerCoins + state.currentBet,
        cpuCoins: state.cpuCoins + state.currentBet,
        cpuFolds: 0,
        playerFolds: 0,
        currentBet: 0,
        chosenStat: null,
        phase: "choose_stat",
        roundWinner: "draw",
        lastResult: `Draw! Both cards had ${stat} of ${playerValue}. Coins returned, cards stay.`
    });
};

/**
 * Player chooses to fold, losing their top card but no coins.
 * Can only fold if they haven't folded twice already this session.
 * @param {GameState} state - Current game state
 * @returns {GameState} Updated state after player folds
 */
const playerFold = (state) => {
    if (state.playerFolds >= 2) {
        return state;
    }
    const lostCard = state.playerDeck[0];
    return Object.assign({}, state, {
        playerDeck: state.playerDeck.slice(1),
        cpuDeck: state.cpuDeck.concat([lostCard]),
        playerFolds: state.playerFolds + 1,
        currentBet: 0,
        chosenStat: null,
        phase: "choose_stat",
        lastResult: "You folded. CPU takes your card but no coins change hands."
    });
};

/**
 * Checks whether the game has been won by either player.
 * Win conditions: opponent has 0 coins, or opponent has 0 cards.
 * @param {GameState} state - Current game state
 * @returns {GameState} State with winner set and phase set to game_over if applicable
 */
const checkWinCondition = (state) => {
    if (state.playerDeck.length === 0 || state.playerCoins <= 0) {
        return Object.assign({}, state, {
            winner: "cpu",
            phase: "game_over"
        });
    }
    if (state.cpuDeck.length === 0 || state.cpuCoins <= 0) {
        return Object.assign({}, state, {
            winner: "player",
            phase: "game_over"
        });
    }
    return state;
};

export {
    getCards,
    getStartingDeck,
    generateCpuDeck,
    initGame,
    chooseStat,
    placeBet,
    cpuDecide,
    resolveRound,
    playerFold,
    checkWinCondition,
    getHighestStat
};