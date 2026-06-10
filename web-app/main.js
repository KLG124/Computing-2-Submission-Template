import R from "./ramda.js";

/*jslint browser: true */

import {
    getStartingDeck,
    initGame,
    chooseStat,
    placeBet,
    cpuDecide,
    resolveRound,
    playerFold,
    checkWinCondition
} from "./Module.js";

let state = initGame(getStartingDeck());

// ─── DOM helpers ─────────────────────────────────────────────────────────────

const el = (id) => document.getElementById(id);

const tierColour = (tier) => (
    tier === "gold"
        ? "#b8860b"
        : tier === "red"
            ? "#8b0000"
            : "#2c2c2c"
);

const statLabel = (key) => key.charAt(0).toUpperCase() + key.slice(1);

// ─── Flash animation ─────────────────────────────────────────────────────────
// Briefly overrides the card border with green (win), red (lose), or gold (draw)
// then fades back to the tier colour after 1.2 seconds.

const flashCard = (containerId, result) => {
    const inner = el(containerId).querySelector("div");
    if (!inner) {
        return;
    }
    const flashColour = (
        result === "win"
            ? "#00e676"
            : result === "lose"
                ? "#ff1744"
                : "#ffd700"
    );
    inner.style.transition = "border-color 0.1s ease";
    inner.style.borderColor = flashColour;
    inner.style.boxShadow = `0 0 18px ${flashColour}`;

    setTimeout(function () {
        inner.style.borderColor = "";
        inner.style.boxShadow = "";
    }, 1200);
};

// ─── CPU turn: auto-choose stat and bet, then resolve ────────────────────────

const runCpuTurn = () => {
    el("phase-resolve").style.display = "block";
    el("cpu-thinking").textContent = "CPU is choosing a stat...";

    setTimeout(function () {
        // CPU picks its highest stat
        const cpuCard = state.cpuDeck[0];
        const bestStat = Object.keys(cpuCard.stats).reduce(function (best, key) {
            return cpuCard.stats[key] > cpuCard.stats[best] ? key : best;
        }, "fame");

        state = chooseStat(state, bestStat);
        el("cpu-thinking").textContent = `CPU chose ${statLabel(bestStat)}. Placing bet...`;
        render();

        setTimeout(function () {
            // CPU always bets max (up to 10, up to its coins)
            const cpuBet = Math.min(10, state.cpuCoins);
            state = placeBet(state, cpuBet);
            el("cpu-thinking").textContent = `CPU bets ${cpuBet} coins. Deciding...`;

            setTimeout(function () {
                state = cpuDecide(state);

                if (state.phase === "round_result" && state.currentBet === 0) {
                    // Player folded to CPU's bet — flash and hand back
                    flashCard("player-card", "lose");
                    flashCard("cpu-card", "win");
                    setTimeout(function () {
                        state = checkWinCondition(state);
                        if (state.phase !== "game_over") {
                            state = Object.assign({}, state, {phase: "choose_stat"});
                        }
                        render();
                    }, 1500);
                    return;
                }

                setTimeout(function () {
                    state = resolveRound(state);
                    state = checkWinCondition(state);

                    if (state.roundWinner === "player") {
                        flashCard("player-card", "win");
                        flashCard("cpu-card", "lose");
                    } else if (state.roundWinner === "cpu") {
                        flashCard("player-card", "lose");
                        flashCard("cpu-card", "win");
                    } else {
                        flashCard("player-card", "draw");
                        flashCard("cpu-card", "draw");
                    }

                    render();
                }, 900);
            }, 800);
        }, 700);
    }, 800);
};

// ─── Render a single card ─────────────────────────────────────────────────────

const renderCard = (card, container, showStats, activeStat) => {
    const colour = tierColour(card.tier);
    container.innerHTML = `
        <div style="
            border: 3px solid ${colour};
            border-radius: 10px;
            padding: 14px;
            background: #1a1a1a;
            color: #f0f0f0;
            width: 200px;
            font-family: sans-serif;
            text-align: center;
            transition: border-color 0.1s ease, box-shadow 0.1s ease;
        ">
            <div style="font-size: 2rem; font-weight: bold; color: ${colour};">
                ${card.rating}
            </div>
            <div style="font-size: 1.4rem;">${card.nation}</div>
            <div style="
                font-size: 0.95rem;
                font-weight: bold;
                margin: 8px 0;
                color: ${colour};
                letter-spacing: 1px;
                text-transform: uppercase;
            ">${card.name}</div>
            ${showStats ? Object.entries(card.stats).map(([key, val]) => `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 3px 6px;
                    border-radius: 4px;
                    margin: 2px 0;
                    background: ${activeStat === key ? colour : "transparent"};
                    color: ${activeStat === key ? "#fff" : "#ccc"};
                    font-size: 0.8rem;
                ">
                    <span>${val}</span>
                    <span>${statLabel(key)}</span>
                </div>
            `).join("") : `
                <div style="color:#666; font-size:0.8rem; margin-top:8px;">
                    Stats hidden
                </div>
            `}
        </div>
    `;
};

// ─── Render the full UI ───────────────────────────────────────────────────────

const render = () => {
    const playerCard = state.playerDeck[0];
    const cpuCard = state.cpuDeck[0];

    el("player-coins").textContent = state.playerCoins;
    el("cpu-coins").textContent = state.cpuCoins;
    el("player-cards").textContent = state.playerDeck.length;
    el("cpu-cards").textContent = state.cpuDeck.length;
    el("player-folds").textContent = state.playerFolds;
    el("cpu-folds").textContent = state.cpuFolds;

    const turnLabel = el("turn-label");
    if (state.roundWinner === "cpu") {
        turnLabel.textContent = "CPU's turn to choose";
        turnLabel.style.color = "#ff6b6b";
    } else {
        turnLabel.textContent = "Your turn to choose";
        turnLabel.style.color = "#b8860b";
    }

    if (playerCard) {
        renderCard(playerCard, el("player-card"), true, state.chosenStat);
    }
    if (cpuCard) {
        renderCard(cpuCard, el("cpu-card"), state.roundWinner === "cpu" || state.chosenStat !== null, state.chosenStat);
    }

    if (state.lastResult) {
        el("result-msg").textContent = state.lastResult;
        el("result-msg").style.display = "block";
    } else {
        el("result-msg").style.display = "none";
    }

    el("phase-choose").style.display = "none";
    el("phase-bet").style.display = "none";
    el("phase-resolve").style.display = "none";
    el("phase-gameover").style.display = "none";
    el("btn-fold-after-bet").style.display = "none";

    if (state.phase === "choose_stat") {
        // If CPU won last round, it goes first automatically
        if (state.roundWinner === "cpu") {
            el("phase-resolve").style.display = "block";
            el("cpu-thinking").textContent = "CPU won last round — CPU goes first...";
            setTimeout(runCpuTurn, 1200);
            return;
        }
        el("phase-choose").style.display = "block";
        el("stat-info").textContent = "";
    }

    if (state.phase === "place_bet") {
        el("phase-bet").style.display = "block";
        el("stat-info").textContent = `Chosen stat: ${statLabel(state.chosenStat)}  |  Your card: ${playerCard.stats[state.chosenStat]}`;
        el("bet-max").textContent = Math.min(10, state.playerCoins);
        el("bet-amount").max = Math.min(10, state.playerCoins);
        el("bet-amount").value = 1;
        el("bet-display").textContent = 1;
        if (state.playerFolds < 2) {
            el("btn-fold-after-bet").style.display = "inline-block";
        }
    }

    if (state.phase === "cpu_response") {
        el("phase-resolve").style.display = "block";
        el("cpu-thinking").textContent = "CPU is deciding...";
    }

    if (state.phase === "round_result" && state.currentBet === 0) {
        setTimeout(function () {
            state = checkWinCondition(state);
            if (state.phase !== "game_over") {
                state = Object.assign({}, state, {phase: "choose_stat"});
            }
            render();
        }, 1800);
    }

    if (state.phase === "game_over") {
        el("phase-gameover").style.display = "block";
        el("gameover-msg").textContent = state.winner === "player"
            ? `🏆 You win! You ended with ${state.playerCoins} coins.`
            : `💀 CPU wins. You ended with ${state.playerCoins} coins.`;
    }
};

// ─── Event listeners ──────────────────────────────────────────────────────────

["fame", "popularity", "legacy", "power", "influence", "wealth"].forEach(function (stat) {
    el("btn-" + stat).addEventListener("click", function () {
        state = chooseStat(state, stat);
        render();
    });
});

el("bet-amount").addEventListener("input", function () {
    el("bet-display").textContent = el("bet-amount").value;
});

el("btn-place-bet").addEventListener("click", function () {
    const amount = parseInt(el("bet-amount").value, 10);
    state = placeBet(state, amount);
    render();

    setTimeout(function () {
        state = cpuDecide(state);
        render();

        if (state.phase === "round_result" && state.currentBet > 0) {
            setTimeout(function () {
                state = resolveRound(state);
                state = checkWinCondition(state);

                if (state.roundWinner === "player") {
                    flashCard("player-card", "win");
                    flashCard("cpu-card", "lose");
                } else if (state.roundWinner === "cpu") {
                    flashCard("player-card", "lose");
                    flashCard("cpu-card", "win");
                } else {
                    flashCard("player-card", "draw");
                    flashCard("cpu-card", "draw");
                }

                render();
            }, 1000);
        } else if (state.phase === "round_result" && state.currentBet === 0) {
            // CPU folded
            flashCard("player-card", "win");
            flashCard("cpu-card", "lose");
            setTimeout(function () {
                state = checkWinCondition(state);
                if (state.phase !== "game_over") {
                    state = Object.assign({}, state, {phase: "choose_stat"});
                }
                render();
            }, 1800);
        }
    }, 1000);
});

el("btn-fold-after-bet").addEventListener("click", function () {
    state = playerFold(state);
    flashCard("player-card", "lose");
    flashCard("cpu-card", "win");
    render();
});

el("btn-restart").addEventListener("click", function () {
    state = initGame(getStartingDeck());
    render();
});

// ─── Start ────────────────────────────────────────────────────────────────────

render();