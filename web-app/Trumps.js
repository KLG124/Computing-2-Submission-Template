/*jslint node*/

import assert from "assert";
import { describe, it } from "mocha";
import {
    canFold,
    chooseStat,
    clampBet,
    cpuLead,
    cpuLeadBet,
    cpuRespondDecision,
    fold,
    MAX_BET,
    MIN_BET,
    newGame,
    nextRound,
    other,
    placeLeadBet,
    resolveRound,
    respond,
    STARTING_COINS
} from "../Trumps.js";

// A small, predictable two-card-each state for the resolve/fold tests.
const rigged = function () {
    const strong = {
        name: "Strong",
        flag: "🇬🇧",
        tier: "gold",
        rating: 90,
        stats: {
            fame: 90,
            popularity: 50,
            legacy: 50,
            power: 50,
            influence: 50,
            wealth: 50
        }
    };

    const weak = {
        name: "Weak",
        flag: "🇺🇸",
        tier: "gold",
        rating: 50,
        stats: {
            fame: 10,
            popularity: 50,
            legacy: 50,
            power: 50,
            influence: 50,
            wealth: 50
        }
    };

    const p2 = Object.assign({}, strong, {name: "P2"});
    const c2 = Object.assign({}, weak, {name: "C2"});

    return {
        playerDeck: [strong, p2],
        cpuDeck: [weak, c2],
        playerCoins: 100,
        cpuCoins: 100,
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
        message: ""
    };
};

describe("newGame", function () {

    it("gives both players the same number of cards", function () {
        const state = newGame();
        assert.strictEqual(state.playerDeck.length, state.cpuDeck.length);
    });

    it("starts both players on the configured coin total", function () {
        const state = newGame();
        assert.strictEqual(state.playerCoins, STARTING_COINS);
        assert.strictEqual(state.cpuCoins, STARTING_COINS);
    });

    it("lets the player lead first", function () {
        assert.strictEqual(newGame().turn, "player");
    });

});

describe("chooseStat", function () {

    it("records the stat and moves to the bet phase", function () {
        const state = chooseStat(rigged(), "fame");
        assert.strictEqual(state.chosenStat, "fame");
        assert.strictEqual(state.phase, "lead_bet");
    });

    it("ignores an invalid stat", function () {
        const state = chooseStat(rigged(), "charisma");
        assert.strictEqual(state.chosenStat, null);
    });

});

describe("resolveRound", function () {

    it("awards the pot to the higher stat", function () {
        let state = chooseStat(rigged(), "fame");
        state = placeLeadBet(state, 10);
        state = respond(state);

        assert.strictEqual(state.playerCoins, 110);
        assert.strictEqual(state.cpuCoins, 90);
        assert.strictEqual(state.roundWinner, "player");
    });

    it("makes the responder match the leader's bet", function () {
        let state = chooseStat(rigged(), "fame");
        state = placeLeadBet(state, 20);
        state = respond(state);

        assert.strictEqual(state.playerCoins, 120);
        assert.strictEqual(state.cpuCoins, 80);
    });

    it("caps the match at the responder's coins (all-in)", function () {
        let state = Object.assign({}, rigged(), {cpuCoins: 8});
        state = chooseStat(state, "fame");
        state = placeLeadBet(state, 20);
        state = respond(state);

        assert.strictEqual(state.cpuCoins, 0);
        assert.strictEqual(state.playerCoins, 108);
    });

    it(
        "keeps cards in place at the reveal, then moves them on the next round",
        function () {
            let state = chooseStat(rigged(), "fame");
            state = placeLeadBet(state, 5);
            state = respond(state);
            assert.strictEqual(state.playerDeck.length, 2);

            state = nextRound(state);
            assert.strictEqual(state.playerDeck.length, 3);
            assert.strictEqual(state.cpuDeck.length, 1);
        }
    );

    it("records the played cards and result for the reveal", function () {
        let state = chooseStat(rigged(), "fame");
        state = placeLeadBet(state, 5);
        state = respond(state);

        assert.strictEqual(state.revealPlayer.name, "Strong");
        assert.strictEqual(state.revealCpu.name, "Weak");
        assert.strictEqual(state.resultKind, "won");
    });

    it("returns both bets on a draw", function () {
        const base = rigged();
        const drawState = Object.assign({}, base, {
            chosenStat: "popularity",
            phase: "respond",
            playerBet: 10,
            cpuBet: 10
        });
        const resolved = resolveRound(drawState);

        assert.strictEqual(resolved.playerCoins, 100);
        assert.strictEqual(resolved.cpuCoins, 100);
        assert.strictEqual(resolved.roundWinner, "draw");
    });

});

describe("fold", function () {

    it("does not move cards or coins at the moment of folding", function () {
        const state = fold(rigged(), "player");
        assert.strictEqual(state.playerDeck.length, 2);
        assert.strictEqual(state.cpuDeck.length, 2);
        assert.strictEqual(state.playerCoins, 100);
    });

    it(
        "hands the folded card to the opponent once the round cycles",
        function () {
            const state = nextRound(fold(rigged(), "player"));
            assert.strictEqual(state.playerDeck.length, 1);
            assert.strictEqual(state.cpuDeck.length, 3);
        }
    );

    it("increments the folder's fold streak", function () {
        assert.strictEqual(fold(rigged(), "player").playerFolds, 1);
    });

    it("blocks a third fold once the streak hits the limit", function () {
        const state = Object.assign({}, rigged(), {playerFolds: 2});
        assert.strictEqual(canFold(state, "player"), false);
    });

    it(
        "cycles the winner's card to the back so it is not repeated",
        function () {
            const state = nextRound(fold(rigged(), "cpu"));
            const after = state.playerDeck[0].name;
            assert.notStrictEqual(after, "Strong");
        }
    );

    it("labels the outcome from the player's point of view", function () {
        assert.strictEqual(fold(rigged(), "player").resultKind, "folded");
        assert.strictEqual(fold(rigged(), "cpu").resultKind, "opp_folded");
    });

});

describe("nextRound", function () {

    it("ends the game when the cpu has no coins", function () {
        const broke = Object.assign({}, rigged(), {cpuCoins: 0});
        const ended = nextRound(broke);

        assert.strictEqual(ended.phase, "game_over");
        assert.strictEqual(ended.winner, "player");
    });

    it(
        "continues the game while both sides have cards and coins",
        function () {
            const state = rigged();
            state.phase = "resolved";
            const ongoing = nextRound(state);
            assert.strictEqual(ongoing.phase, "choose");
        }
    );

});

describe("cpuRespondDecision", function () {

    const facing = function (value, bet, cpuFolds) {
        let folds = 0;
        if (cpuFolds) {
            folds = cpuFolds;
        }

        const cpuCard = {
            name: "CPU", flag: "x", tier: "gold", rating: 80,
            stats: {
                fame: value, popularity: 50, legacy: 50,
                power: 50, influence: 50, wealth: 50
            }
        };
        const playerCard = {
            name: "P", flag: "x", tier: "gold", rating: 80,
            stats: {
                fame: 80, popularity: 50, legacy: 50,
                power: 50, influence: 50, wealth: 50
            }
        };

        return {
            playerDeck: [playerCard],
            cpuDeck: [cpuCard],
            playerCoins: 100,
            cpuCoins: 100,
            playerFolds: 0,
            cpuFolds: folds,
            turn: "player",
            phase: "respond",
            chosenStat: "fame",
            playerBet: bet,
            cpuBet: 0,
            pot: 0,
            roundWinner: null,
            winner: null,
            message: ""
        };
    };

    it("matches when the card clears the threshold", function () {
        const state = facing(90, 25, 0);
        const decision = cpuRespondDecision(state, 0.99);
        assert.strictEqual(decision.action, "match");
    });

    it("folds a weak card to a big bet (no bluff)", function () {
        const state = facing(30, 25, 0);
        const decision = cpuRespondDecision(state, 0.99);
        assert.strictEqual(decision.action, "fold");
    });

    it("demands a higher stat as the bet grows", function () {
        const lowBetState = facing(50, MIN_BET, 0);
        const highBetState = facing(50, MAX_BET, 0);

        const decisionLow = cpuRespondDecision(lowBetState, 0.99);
        const decisionHigh = cpuRespondDecision(highBetState, 0.99);

        assert.strictEqual(decisionLow.action, "match");
        assert.strictEqual(decisionHigh.action, "fold");
    });

    it("bluff-calls below the threshold on a low roll", function () {
        const state = facing(30, 25, 0);
        const decision = cpuRespondDecision(state, 0.01);
        assert.strictEqual(decision.action, "match");
    });

    it("is forced to play once the fold streak is maxed", function () {
        const state = facing(10, 25, 2);
        const decision = cpuRespondDecision(state, 0.99);
        assert.strictEqual(decision.action, "match");
    });

});

describe("cpuLead", function () {

    const leadState = function (highStat) {
        const cpuCard = {
            name: "CPU", flag: "x", tier: "gold", rating: 60,
            stats: {
                fame: highStat, popularity: 20, legacy: 20,
                power: 20, influence: 20, wealth: 20
            }
        };
        const playerCard = {
            name: "P", flag: "x", tier: "gold", rating: 80,
            stats: {
                fame: 80, popularity: 50, legacy: 50,
                power: 50, influence: 50, wealth: 50
            }
        };
        
        return {
            playerDeck: [playerCard],
            cpuDeck: [cpuCard],
            playerCoins: 100,
            cpuCoins: 100,
            playerFolds: 0,
            cpuFolds: 0,
            turn: "cpu",
            phase: "choose",
            chosenStat: null,
            playerBet: 0,
            cpuBet: 0,
            pot: 0,
            roundWinner: null,
            winner: null,
            message: ""
        };
    };

    it("bets to its strength on a normal (non-bluff) roll", function () {
        const state = leadState(40);
        const led = cpuLead(state, 0.99);
        assert.ok(led.cpuBet < MAX_BET);
        assert.strictEqual(led.chosenStat, "fame");
    });

    it("shoves a big bluff bet on a low roll", function () {
        const state = leadState(40);
        assert.strictEqual(cpuLead(state, 0.01).cpuBet, MAX_BET);
    });

    it("scales the leading bet up as the best stat improves", function () {
        const lowBet = cpuLead(leadState(80), 0.99).cpuBet;
        const highBet = cpuLead(leadState(95), 0.99).cpuBet;
        assert.ok(lowBet < highBet);
    });

});

describe("cpuLeadBet", function () {

    it("bets the minimum at or below the floor value", function () {
        assert.strictEqual(cpuLeadBet(75), MIN_BET);
        assert.strictEqual(cpuLeadBet(60), MIN_BET);
        assert.strictEqual(cpuLeadBet(10), MIN_BET);
    });

    it("bets the maximum at or above the ceiling value", function () {
        assert.strictEqual(cpuLeadBet(99), MAX_BET);
        assert.strictEqual(cpuLeadBet(120), MAX_BET);
    });

    it("scales smoothly in between", function () {
        const mid = cpuLeadBet(87);
        assert.ok(mid > MIN_BET && mid < MAX_BET);
        assert.ok(cpuLeadBet(80) < cpuLeadBet(90));
    });

});

describe("helpers", function () {

    it("other() flips the player", function () {
        assert.strictEqual(other("player"), "cpu");
        assert.strictEqual(other("cpu"), "player");
    });

    it("clampBet() keeps bets inside the legal band", function () {
        assert.strictEqual(clampBet(1, 100), MIN_BET);
        assert.strictEqual(clampBet(999, 100), MAX_BET);
        assert.strictEqual(clampBet(3, 3), 3);
    });

});