import {
    playerFold,
    initGame,
    getStartingDeck
} from "../Module.js";

import assert from "assert";

// Helper: creates a fresh default game state for each test
const freshState = () => initGame(getStartingDeck());

describe("playerFold", function () {

    it("reduces the player's deck by one card", function () {
        const state = freshState();
        const newState = playerFold(state);
        assert.strictEqual(newState.playerDeck.length, 15);
    });

    it("gives the folded card to the CPU", function () {
        const state = freshState();
        const newState = playerFold(state);
        assert.strictEqual(newState.cpuDeck.length, state.cpuDeck.length + 1);
    });

    it("the card given to the CPU is the player's top card", function () {
        const state = freshState();
        const topCard = state.playerDeck[0];
        const newState = playerFold(state);
        const lastCpuCard = newState.cpuDeck[newState.cpuDeck.length - 1];
        assert.strictEqual(lastCpuCard.name, topCard.name);
    });

    it("does not change the player's coin total", function () {
        const state = freshState();
        const newState = playerFold(state);
        assert.strictEqual(newState.playerCoins, state.playerCoins);
    });

    it("does not change the CPU's coin total", function () {
        const state = freshState();
        const newState = playerFold(state);
        assert.strictEqual(newState.cpuCoins, state.cpuCoins);
    });

    it("increments the player fold counter by one", function () {
        const state = freshState();
        const newState = playerFold(state);
        assert.strictEqual(newState.playerFolds, 1);
    });

    it("cannot fold a third time after folding twice", function () {
        const state = freshState();
        const state2 = Object.assign({}, state, {playerFolds: 2});
        const newState = playerFold(state2);
        assert.strictEqual(newState.playerDeck.length, state2.playerDeck.length);
    });

    it("returns the state unchanged when fold limit is reached", function () {
        const state = freshState();
        const state2 = Object.assign({}, state, {playerFolds: 2});
        const newState = playerFold(state2);
        assert.strictEqual(newState.playerFolds, 2);
    });

});