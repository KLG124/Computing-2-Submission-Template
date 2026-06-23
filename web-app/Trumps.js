/*jslint browser*/

/**
 * Celebrity Top Trumps with poker-style betting.
 *
 * Two players (a human and a CPU) are each dealt half the deck. On each round
 * the leader picks a stat and a bet; the other player can match the bet or
 * fold. The higher value in the chosen stat wins the pot and the opponent's
 * card. Whoever wins a round leads the next one. The game ends when a player
 * runs out of cards or coins.
 *
 * Every exported function is pure: it takes a state and returns a new state
 * without mutating its input. The only exception is newGame, which shuffles
 * the deck and therefore uses randomness by necessity.
 *
 * @module CelebTrumps
 * @author Kaiyu
 * @version 2025/26
 */

const STARTING_COINS = 200;
const MIN_BET = 5;
const MAX_BET = 25;
const MAX_FOLD_STREAK = 2;

const CPU_CALL_BASE = 46;
const CPU_CALL_PER_COIN = 1.9;

const CPU_CALL_BLUFF_CHANCE = 0.15;
const CPU_LEAD_BLUFF_CHANCE = 0.15;
const CPU_LEAD_BLUFF_BET = MAX_BET;

const CPU_LEAD_MIN_VALUE = 75;
const CPU_LEAD_MAX_VALUE = 88;

const STAT_KEYS = [
    "fame", "popularity", "legacy", "power", "influence", "wealth"
];

const cards = [
    {
        name: "Ed Sheeran", flag: "🇬🇧", tier: "gold", rating: 78,
        stats: {
            fame: 78, popularity: 80, legacy: 70,
            power: 55, influence: 78, wealth: 85
        }
    },
    {
        name: "Eminem", flag: "🇺🇸", tier: "gold", rating: 79,
        stats: {
            fame: 79, popularity: 82, legacy: 82,
            power: 50, influence: 80, wealth: 78
        }
    },
    {
        name: "Adele", flag: "🇬🇧", tier: "gold", rating: 77,
        stats: {
            fame: 77, popularity: 81, legacy: 75,
            power: 45, influence: 72, wealth: 76
        }
    },
    {
        name: "Kanye West", flag: "🇺🇸", tier: "gold", rating: 76,
        stats: {
            fame: 76, popularity: 60, legacy: 79,
            power: 62, influence: 81, wealth: 79
        }
    },
    {
        name: "Justin Bieber", flag: "🇨🇦", tier: "gold", rating: 76,
        stats: {
            fame: 76, popularity: 78, legacy: 62,
            power: 48, influence: 72, wealth: 77
        }
    },
    {
        name: "Bob Marley", flag: "🇯🇲", tier: "gold", rating: 75,
        stats: {
            fame: 75, popularity: 82, legacy: 78,
            power: 40, influence: 83, wealth: 36
        }
    },
    {
        name: "Rihanna", flag: "🇧🇧", tier: "gold", rating: 74,
        stats: {
            fame: 74, popularity: 85, legacy: 72,
            power: 78, influence: 80, wealth: 88
        }
    },
    {
        name: "Beyoncé", flag: "🇺🇸", tier: "gold", rating: 79,
        stats: {
            fame: 79, popularity: 89, legacy: 82,
            power: 72, influence: 84, wealth: 82
        }
    },
    {
        name: "Tom Hanks", flag: "🇺🇸", tier: "gold", rating: 78,
        stats: {
            fame: 78, popularity: 86, legacy: 80,
            power: 55, influence: 75, wealth: 80
        }
    },
    {
        name: "Leo DiCaprio", flag: "🇺🇸", tier: "gold", rating: 79,
        stats: {
            fame: 79, popularity: 78, legacy: 76,
            power: 58, influence: 80, wealth: 84
        }
    },
    {
        name: "Tom Cruise", flag: "🇺🇸", tier: "gold", rating: 77,
        stats: {
            fame: 77, popularity: 75, legacy: 75,
            power: 59, influence: 76, wealth: 85
        }
    },
    {
        name: "Johnny Depp", flag: "🇺🇸", tier: "gold", rating: 76,
        stats: {
            fame: 76, popularity: 72, legacy: 70,
            power: 45, influence: 68, wealth: 72
        }
    },
    {
        name: "Oprah Winfrey", flag: "🇺🇸", tier: "gold", rating: 79,
        stats: {
            fame: 79, popularity: 82, legacy: 76,
            power: 78, influence: 80, wealth: 82
        }
    },
    {
        name: "Kim Kardashian", flag: "🇺🇸", tier: "gold", rating: 78,
        stats: {
            fame: 78, popularity: 71, legacy: 55,
            power: 65, influence: 78, wealth: 81
        }
    },
    {
        name: "Brad Pitt", flag: "🇺🇸", tier: "gold", rating: 75,
        stats: {
            fame: 75, popularity: 72, legacy: 70,
            power: 52, influence: 68, wealth: 80
        }
    },
    {
        name: "Will Smith", flag: "🇺🇸", tier: "gold", rating: 74,
        stats: {
            fame: 74, popularity: 75, legacy: 72,
            power: 55, influence: 72, wealth: 82
        }
    },
    {
        name: "Serena Williams", flag: "🇺🇸", tier: "gold", rating: 74,
        stats: {
            fame: 74, popularity: 75, legacy: 80,
            power: 55, influence: 72, wealth: 70
        }
    },
    {
        name: "Tiger Woods", flag: "🇺🇸", tier: "gold", rating: 73,
        stats: {
            fame: 73, popularity: 70, legacy: 80,
            power: 60, influence: 70, wealth: 75
        }
    },
    {
        name: "Muhammad Ali", flag: "🇺🇸", tier: "gold", rating: 79,
        stats: {
            fame: 79, popularity: 86, legacy: 83,
            power: 45, influence: 78, wealth: 58
        }
    },
    {
        name: "Usain Bolt", flag: "🇯🇲", tier: "gold", rating: 75,
        stats: {
            fame: 75, popularity: 78, legacy: 85,
            power: 40, influence: 72, wealth: 70
        }
    },
    {
        name: "Mike Tyson", flag: "🇺🇸", tier: "gold", rating: 74,
        stats: {
            fame: 74, popularity: 79, legacy: 80,
            power: 56, influence: 70, wealth: 56
        }
    },
    {
        name: "David Beckham", flag: "🇬🇧", tier: "gold", rating: 72,
        stats: {
            fame: 72, popularity: 75, legacy: 73,
            power: 59, influence: 76, wealth: 83
        }
    },
    {
        name: "Stephen Hawking", flag: "🇬🇧", tier: "gold", rating: 71,
        stats: {
            fame: 71, popularity: 79, legacy: 86,
            power: 38, influence: 78, wealth: 54
        }
    },
    {
        name: "Isaac Newton", flag: "🇬🇧", tier: "gold", rating: 74,
        stats: {
            fame: 74, popularity: 73, legacy: 88,
            power: 36, influence: 80, wealth: 47
        }
    },
    {
        name: "Napoleon", flag: "🇫🇷", tier: "gold", rating: 82,
        stats: {
            fame: 70, popularity: 64, legacy: 87,
            power: 94, influence: 78, wealth: 82
        }
    },
    {
        name: "Leonardo da Vinci", flag: "🇮🇹", tier: "gold", rating: 69,
        stats: {
            fame: 69, popularity: 78, legacy: 85,
            power: 42, influence: 82, wealth: 55
        }
    },
    {
        name: "Bill Gates", flag: "🇺🇸", tier: "gold", rating: 68,
        stats: {
            fame: 68, popularity: 78, legacy: 82,
            power: 85, influence: 75, wealth: 97
        }
    },
    {
        name: "Mark Zuckerberg", flag: "🇺🇸", tier: "gold", rating: 67,
        stats: {
            fame: 64, popularity: 55, legacy: 79,
            power: 86, influence: 82, wealth: 96
        }
    },
    {
        name: "Barack Obama", flag: "🇺🇸", tier: "gold", rating: 76,
        stats: {
            fame: 76, popularity: 78, legacy: 85,
            power: 93, influence: 78, wealth: 72
        }
    },
    {
        name: "Mr Beast", flag: "🇺🇸", tier: "gold", rating: 66,
        stats: {
            fame: 66, popularity: 78, legacy: 52,
            power: 48, influence: 72, wealth: 85
        }
    },
    {
        name: "Jackie Chan", flag: "🇭🇰", tier: "gold", rating: 67,
        stats: {
            fame: 64, popularity: 77, legacy: 75,
            power: 40, influence: 71, wealth: 72
        }
    },
    {
        name: "Stan Lee", flag: "🇺🇸", tier: "gold", rating: 65,
        stats: {
            fame: 62, popularity: 76, legacy: 80,
            power: 53, influence: 78, wealth: 68
        }
    },

    // ── Black tier ───────────────────────────────────────────────────────────
    {
        name: "The Rock", flag: "🇺🇸", tier: "black", rating: 84,
        stats: {
            fame: 85, popularity: 89, legacy: 78,
            power: 76, influence: 79, wealth: 86
        }
    },
    {
        name: "Taylor Swift", flag: "🇺🇸", tier: "black", rating: 83,
        stats: {
            fame: 84, popularity: 90, legacy: 79,
            power: 58, influence: 88, wealth: 89
        }
    },
    {
        name: "Elon Musk", flag: "🇺🇸", tier: "black", rating: 83,
        stats: {
            fame: 83, popularity: 62, legacy: 74,
            power: 97, influence: 86, wealth: 99
        }
    },
    {
        name: "Albert Einstein", flag: "🇩🇪", tier: "black", rating: 82,
        stats: {
            fame: 82, popularity: 79, legacy: 94,
            power: 46, influence: 98, wealth: 41
        }
    },
    {
        name: "Beethoven", flag: "🇩🇪", tier: "black", rating: 82,
        stats: {
            fame: 82, popularity: 74, legacy: 90,
            power: 38, influence: 88, wealth: 42
        }
    },
    {
        name: "Elvis Presley", flag: "🇺🇸", tier: "black", rating: 81,
        stats: {
            fame: 81, popularity: 92, legacy: 78,
            power: 55, influence: 82, wealth: 72
        }
    },
    {
        name: "Charlie Chaplin", flag: "🇬🇧", tier: "black", rating: 80,
        stats: {
            fame: 80, popularity: 82, legacy: 81,
            power: 40, influence: 79, wealth: 71
        }
    },
    {
        name: "Princess Diana", flag: "🇬🇧", tier: "black", rating: 89,
        stats: {
            fame: 92, popularity: 95, legacy: 88,
            power: 60, influence: 85, wealth: 80
        }
    },
    {
        name: "Shakespeare", flag: "🇬🇧", tier: "black", rating: 88,
        stats: {
            fame: 90, popularity: 75, legacy: 90,
            power: 42, influence: 88, wealth: 44
        }
    },
    {
        name: "Julius Caesar", flag: "🏛️", tier: "black", rating: 88,
        stats: {
            fame: 92, popularity: 72, legacy: 91,
            power: 97, influence: 89, wealth: 87
        }
    },
    {
        name: "Marilyn Monroe", flag: "🇺🇸", tier: "black", rating: 87,
        stats: {
            fame: 91, popularity: 89, legacy: 85,
            power: 46, influence: 82, wealth: 66
        }
    },
    {
        name: "LeBron James", flag: "🇺🇸", tier: "black", rating: 86,
        stats: {
            fame: 93, popularity: 84, legacy: 89,
            power: 60, influence: 82, wealth: 96
        }
    },
    {
        name: "Gandhi", flag: "🇮🇳", tier: "black", rating: 86,
        stats: {
            fame: 89, popularity: 81, legacy: 82,
            power: 68, influence: 91, wealth: 26
        }
    },
    {
        name: "Abraham Lincoln", flag: "🇺🇸", tier: "black", rating: 85,
        stats: {
            fame: 88, popularity: 87, legacy: 94,
            power: 96, influence: 92, wealth: 62
        }
    },
    {
        name: "Cleopatra", flag: "🇪🇬", tier: "black", rating: 85,
        stats: {
            fame: 86, popularity: 79, legacy: 87,
            power: 95, influence: 84, wealth: 95
        }
    },

    // ── Red tier ─────────────────────────────────────────────────────────────
    {
        name: "Jesus Christ", flag: "✝️", tier: "red", rating: 98,
        stats: {
            fame: 99, popularity: 89, legacy: 99,
            power: 98, influence: 99, wealth: 42
        }
    },
    {
        name: "Buddha", flag: "☸️", tier: "red", rating: 97,
        stats: {
            fame: 95, popularity: 90, legacy: 98,
            power: 85, influence: 97, wealth: 24
        }
    },
    {
        name: "Michael Jackson", flag: "🇺🇸", tier: "red", rating: 92,
        stats: {
            fame: 98, popularity: 94, legacy: 97,
            power: 54, influence: 86, wealth: 86
        }
    },
    {
        name: "Cristiano Ronaldo", flag: "🇵🇹", tier: "red", rating: 91,
        stats: {
            fame: 97, popularity: 93, legacy: 98,
            power: 62, influence: 95, wealth: 96
        }
    },
    {
        name: "Donald Trump", flag: "🇺🇸", tier: "red", rating: 90,
        stats: {
            fame: 96, popularity: 50, legacy: 76,
            power: 99, influence: 96, wealth: 90
        }
    },
    {
        name: "Lionel Messi", flag: "🇦🇷", tier: "red", rating: 90,
        stats: {
            fame: 95, popularity: 89, legacy: 97,
            power: 54, influence: 96, wealth: 92
        }
    }
];

const getCards = function () {
    return cards.slice();
};

const getStatKeys = function () {
    return STAT_KEYS.slice();
};

const other = function (who) {
    if (who === "player") {
        return "cpu";
    }
    return "player";
};

const shuffle = function (list) {
    const copy = list.slice();
    let i = copy.length - 1;
    while (i > 0) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
        i -= 1;
    }
    return copy;
};

const highestStat = function (card) {
    return STAT_KEYS.reduce(function (best, key) {
        if (card.stats[key] > card.stats[best]) {
            return key;
        }
        return best;
    }, STAT_KEYS[0]);
};

const clampBet = function (amount, coins) {
    const top = Math.min(MAX_BET, coins);
    const floor = Math.min(MIN_BET, coins);
    if (amount < floor) {
        return floor;
    }
    if (amount > top) {
        return top;
    }
    return amount;
};

const cpuLeadBet = function (value) {
    const span = CPU_LEAD_MAX_VALUE - CPU_LEAD_MIN_VALUE;
    let frac = 0;
    if (span > 0) {
        frac = (value - CPU_LEAD_MIN_VALUE) / span;
    }
    if (frac < 0) {
        frac = 0;
    }
    if (frac > 1) {
        frac = 1;
    }
    return MIN_BET + Math.round(frac * (MAX_BET - MIN_BET));
};

const newGame = function () {
    const shuffled = shuffle(cards);
    const half = Math.floor(shuffled.length / 2);
    return {
        playerDeck: shuffled.slice(0, half),
        cpuDeck: shuffled.slice(half, half * 2),
        playerCoins: STARTING_COINS,
        cpuCoins: STARTING_COINS,
        playerFolds: 0,
        cpuFolds: 0,
        turn: "player",
        phase: "choose",
        chosenStat: null,
        playerBet: 0,
        cpuBet: 0,
        pot: 0,
        roundWinner: null,
        winner: null,
        revealPlayer: null,
        revealCpu: null,
        revealStat: null,
        resultKind: null,
        message: "New game. You lead the first round."
    };
};

const chooseStat = function (state, stat) {
    if (state.phase !== "choose" || !STAT_KEYS.includes(stat)) {
        return state;
    }
    return Object.assign({}, state, {
        chosenStat: stat,
        phase: "lead_bet"
    });
};

const placeLeadBet = function (state, amount) {
    if (state.phase !== "lead_bet") {
        return state;
    }
    const leader = state.turn;
    let coins;
    let betField;

    if (leader === "player") {
        coins = state.playerCoins;
        betField = "playerBet";
    } else {
        coins = state.cpuCoins;
        betField = "cpuBet";
    }

    const bet = clampBet(amount, coins);
    const nextState = Object.assign({}, state, {
        phase: "respond"
    });
    nextState[betField] = bet;

    return nextState;
};

const cpuLead = function (state, roll) {
    if (state.phase !== "choose" || state.turn !== "cpu") {
        return state;
    }
    const card = state.cpuDeck[0];
    const stat = highestStat(card);
    const value = card.stats[stat];

    let wanted;
    if (roll < CPU_LEAD_BLUFF_CHANCE) {
        wanted = CPU_LEAD_BLUFF_BET;
    } else {
        wanted = cpuLeadBet(value);
    }

    const bet = clampBet(wanted, state.cpuCoins);

    return Object.assign({}, state, {
        chosenStat: stat,
        cpuBet: bet,
        phase: "respond",
        message: "CPU leads."
    });
};

const resolveRound = function (state) {
    const playerCard = state.playerDeck[0];
    const cpuCard = state.cpuDeck[0];
    const stat = state.chosenStat;
    const playerValue = playerCard.stats[stat];
    const cpuValue = cpuCard.stats[stat];
    const pot = state.playerBet + state.cpuBet;

    const base = {
        pot,
        playerBet: 0,
        cpuBet: 0,
        playerFolds: 0,
        cpuFolds: 0,
        lastFold: null,
        revealPlayer: playerCard,
        revealCpu: cpuCard,
        revealStat: stat,
        phase: "resolved"
    };

    if (playerValue > cpuValue) {
        const msg = (
            playerCard.name + " (" + playerValue + ") beat " +
            cpuCard.name + " (" + cpuValue + ") on " + stat + ". +" +
            pot + " coins and a card."
        );
        return Object.assign({}, state, base, {
            playerCoins: state.playerCoins - state.playerBet + pot,
            cpuCoins: state.cpuCoins - state.cpuBet,
            turn: "player",
            roundWinner: "player",
            resultKind: "won",
            message: msg
        });
    }

    if (cpuValue > playerValue) {
        const msg = (
            cpuCard.name + " (" + cpuValue + ") beat " +
            playerCard.name + " (" + playerValue + ") on " + stat + ". " +
            "You lose " + state.playerBet + " coins and a card."
        );
        return Object.assign({}, state, base, {
            cpuCoins: state.cpuCoins - state.cpuBet + pot,
            playerCoins: state.playerCoins - state.playerBet,
            turn: "cpu",
            roundWinner: "cpu",
            resultKind: "lost",
            message: msg
        });
    }

    const msg = (
        "Draw on " + stat + " (" + playerValue + "). " +
        "Your bet and card stay with you; same for the house."
    );
    return Object.assign({}, state, base, {
        pot: 0,
        roundWinner: "draw",
        resultKind: "draw",
        message: msg
    });
};

const cycleDecks = function (state) {
    const playerCard = state.playerDeck[0];
    const cpuCard = state.cpuDeck[0];
    const playerRest = state.playerDeck.slice(1);
    const cpuRest = state.cpuDeck.slice(1);

    if (state.roundWinner === "player") {
        return {
            playerDeck: playerRest.concat([playerCard, cpuCard]),
            cpuDeck: cpuRest
        };
    }
    if (state.roundWinner === "cpu") {
        return {
            playerDeck: playerRest,
            cpuDeck: cpuRest.concat([cpuCard, playerCard])
        };
    }
    return {
        playerDeck: playerRest.concat([playerCard]),
        cpuDeck: cpuRest.concat([cpuCard])
    };
};

const respond = function (state) {
    if (state.phase !== "respond") {
        return state;
    }
    let leaderBet;
    if (state.turn === "player") {
        leaderBet = state.playerBet;
    } else {
        leaderBet = state.cpuBet;
    }

    const responder = other(state.turn);
    let coins;
    let betField;

    if (responder === "player") {
        coins = state.playerCoins;
        betField = "playerBet";
    } else {
        coins = state.cpuCoins;
        betField = "cpuBet";
    }

    const matched = Math.min(leaderBet, coins);
    const nextState = Object.assign({}, state);
    nextState[betField] = matched;

    return resolveRound(nextState);
};

const fold = function (state, who) {
    const base = {
        playerBet: 0,
        cpuBet: 0,
        pot: 0,
        lastFold: who,
        revealPlayer: state.playerDeck[0],
        revealCpu: state.cpuDeck[0],
        revealStat: state.chosenStat,
        phase: "resolved"
    };

    if (who === "player") {
        const surrendered = state.playerDeck[0];
        const msg = "You folded. " + surrendered.name + " goes to the house.";
        return Object.assign({}, state, base, {
            playerFolds: state.playerFolds + 1,
            turn: "cpu",
            roundWinner: "cpu",
            resultKind: "folded",
            message: msg
        });
    }

    const surrendered = state.cpuDeck[0];
    const msg = "The house folded. " + surrendered.name + " comes to you.";
    return Object.assign({}, state, base, {
        cpuFolds: state.cpuFolds + 1,
        turn: "player",
        roundWinner: "player",
        resultKind: "opp_folded",
        message: msg
    });
};

const cpuRespondDecision = function (state, roll) {
    const value = state.cpuDeck[0].stats[state.chosenStat];
    let leaderBet;

    if (state.turn === "player") {
        leaderBet = state.playerBet;
    } else {
        leaderBet = state.cpuBet;
    }

    const required = CPU_CALL_BASE + (leaderBet - MIN_BET) * CPU_CALL_PER_COIN;
    const mustPlay = (state.cpuFolds >= MAX_FOLD_STREAK);

    if (value >= required || mustPlay) {
        return {action: "match"};
    }
    if (roll < CPU_CALL_BLUFF_CHANCE) {
        return {action: "match"};
    }
    return {action: "fold"};
};

const nextRound = function (state) {
    const decks = cycleDecks(state);
    const cleared = {
        playerDeck: decks.playerDeck,
        cpuDeck: decks.cpuDeck,
        chosenStat: null,
        pot: 0,
        roundWinner: null,
        lastFold: null
    };

    if (decks.playerDeck.length === 0 || state.playerCoins <= 0) {
        return Object.assign({}, state, cleared, {
            phase: "game_over",
            winner: "cpu",
            message: "Game over, the House Won."
        });
    }

    if (decks.cpuDeck.length === 0 || state.cpuCoins <= 0) {
        return Object.assign({}, state, cleared, {
            phase: "game_over",
            winner: "player",
            message: "Game over, You win!"
        });
    }

    let msg = "CPU won.";
    if (state.turn === "player") {
        msg = "You won, choose a stat.";
    }

    return Object.assign({}, state, cleared, {
        phase: "choose",
        message: msg
    });
};

const canFold = function (state, who) {
    let folds;
    if (who === "player") {
        folds = state.playerFolds;
    } else {
        folds = state.cpuFolds;
    }
    return folds < MAX_FOLD_STREAK;
};

export {
    getCards,
    getStatKeys,
    highestStat,
    cpuLeadBet,
    newGame,
    chooseStat,
    placeLeadBet,
    cpuLead,
    respond,
    resolveRound,
    fold,
    cpuRespondDecision,
    nextRound,
    canFold,
    other,
    clampBet,
    MIN_BET,
    MAX_BET,
    MAX_FOLD_STREAK,
    STARTING_COINS
};