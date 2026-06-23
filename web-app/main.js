/*jslint browser*/

import {
    newGame,
    chooseStat,
    placeLeadBet,
    cpuLead,
    respond,
    fold,
    cpuRespondDecision,
    nextRound,
    canFold,
    getStatKeys,
    MIN_BET,
    MAX_BET
} from "./Trumps.js";

const STAT_KEYS = getStatKeys();

let state = null;

// ── Small helpers ────────────────────────────────────────────────────────────

const el = function (id) {
    return document.getElementById(id);
};

const show = function (node) {
    node.removeAttribute("hidden");
};

const hide = function (node) {
    node.setAttribute("hidden", "");
};

/**
 * Builds the inner HTML for a card.
 * @param {object} card - The card to draw.
 * @param {object} opts - { hotStat, mini } display options.
 * @returns {string} HTML markup for the card.
 */
const cardHTML = function (card, opts) {
    const hot = opts.hotStat || null;
    const stats = STAT_KEYS.map(function (key) {
        const isHot = (key === hot);
        let hotClass = "";
        if (isHot) {
            hotClass = "hot";
        }

        return `<div class="c-stat ${hotClass}">
            <span class="v">${card.stats[key]}</span>
            <span class="k">${key}</span>
        </div>`;
    }).join("");

    return `<div class="card ${card.tier}">
        <div class="c-top">
            <div class="c-badge">
                <span class="c-rating">${card.rating}</span>
                <span class="c-flag">${card.flag}</span>
            </div>
            <div class="c-portrait">${card.flag}</div>
        </div>
        <div class="c-name">${card.name}</div>
        <div class="c-stats">${stats}</div>
    </div>`;
};

const cardBack = function (mini) {
    let miniClass = "";
    if (mini) {
        miniClass = "card-back-mini";
    }
    return `<div class="card-back ${miniClass}">
        <span class="mono">CT</span>
    </div>`;
};

/**
 * Outlines a card mount in green or red.
 * @param {string} mountId - The id of the card mount element.
 * @param {string} result - "win" or "lose".
 */
const flash = function (mountId, result) {
    const mount = el(mountId);
    if (!mount || !mount.firstElementChild) {
        return;
    }
    if (result === "win") {
        mount.classList.add("flash-win");
    } else {
        mount.classList.add("flash-lose");
    }
};

// ── Rendering ────────────────────────────────────────────────────────────────

/**
 * Draws the whole table from the current state and shows the right controls.
 */
const render = function () {
    const playerLeads = (state.turn === "player");
    let revealing = false;
    if (state.phase === "resolved" || state.phase === "game_over") {
        revealing = true;
    }

    let playerCard = state.playerDeck[0];
    let cpuCard = state.cpuDeck[0];
    let hotStat = state.chosenStat;

    if (revealing) {
        playerCard = state.revealPlayer;
        cpuCard = state.revealCpu;
        hotStat = state.revealStat;
    }

    el("player-card").classList.remove("flash-win", "flash-lose");
    el("cpu-card").classList.remove("flash-win", "flash-lose");

    el("player-coins").textContent = state.playerCoins;
    el("cpu-coins").textContent = state.cpuCoins;
    el("player-cards").textContent = state.playerDeck.length;
    el("cpu-cards").textContent = state.cpuDeck.length;
    el("player-folds").textContent = state.playerFolds;
    el("cpu-folds").textContent = state.cpuFolds;

    if (playerCard) {
        el("player-card").innerHTML = cardHTML(playerCard, {hotStat});
    } else {
        el("player-card").innerHTML = "";
    }

    if (state.playerDeck[1]) {
        el("player-next").innerHTML = cardHTML(
            state.playerDeck[1],
            {mini: true}
        );
    } else {
        el("player-next").innerHTML = cardBack(true);
    }

    if (cpuCard) {
        if (revealing) {
            el("cpu-card").innerHTML = cardHTML(cpuCard, {hotStat});
        } else {
            el("cpu-card").innerHTML = cardBack(false);
        }
    } else {
        el("cpu-card").innerHTML = "";
    }

    const banner = el("turn-banner");
    banner.classList.remove(
        "cpu-lead",
        "result-win",
        "result-lose",
        "result-draw"
    );

    if (state.phase === "resolved") {
        const labels = {
            won: ["Won", "result-win"],
            opp_folded: ["Opponent Folds", "result-win"],
            lost: ["Lost", "result-lose"],
            folded: ["Folded", "result-lose"],
            draw: ["Draw", "result-draw"]
        };
        const entry = labels[state.resultKind] || ["", ""];
        banner.textContent = entry[0];
        if (entry[1]) {
            banner.classList.add(entry[1]);
        }
    } else {
        if (playerLeads) {
            banner.textContent = "Your lead";
        } else {
            banner.textContent = "House leads";
        }
        banner.classList.toggle("cpu-lead", !playerLeads);
    }

    if (state.phase === "resolved" && state.pot > 0) {
        el("pot-amount").textContent = state.pot;
        show(el("pot"));
    } else if (state.chosenStat && (state.playerBet || state.cpuBet)) {
        el("pot-amount").textContent = state.playerBet + state.cpuBet;
        show(el("pot"));
    } else {
        hide(el("pot"));
    }

    el("message").textContent = state.message || "";

    hide(el("panel-choose"));
    hide(el("panel-bet"));
    hide(el("panel-over"));

    const playerChoosing = (state.phase === "choose" && playerLeads);
    let playerBetting = false;

    if (state.phase === "lead_bet" && playerLeads) {
        playerBetting = true;
    } else if (state.phase === "respond" && !playerLeads) {
        playerBetting = true;
    }

    if (playerChoosing) {
        el("choose-title").textContent = "Choose a stat to compare";
        renderStatButtons(state.playerDeck[0], null, true);
        show(el("panel-choose"));
    } else if (playerBetting) {
        const leading = (state.phase === "lead_bet");
        if (leading) {
            el("choose-title").textContent = "Stat in play";
        } else {
            el("choose-title").textContent = "House picked this stat";
        }

        renderStatButtons(state.playerDeck[0], state.chosenStat, false);
        show(el("panel-choose"));

        if (leading) {
            el("bet-prompt").textContent = "Your bet amount";
            el("bet-confirm").textContent = "Bet";
            show(el("bet-row"));
            setupBetPanel(state.playerCoins, canFold(state, "player"));
        } else {
            const leaderBet = state.cpuBet;
            const matched = Math.min(leaderBet, state.playerCoins);
            el("bet-prompt").textContent = "Match the bet or fold";

            if (matched < leaderBet) {
                el("bet-confirm").textContent = `All in (${matched})`;
            } else {
                el("bet-confirm").textContent = `Match (${matched})`;
            }

            hide(el("bet-row"));
            if (canFold(state, "player")) {
                el("fold-btn").style.display = "";
            } else {
                el("fold-btn").style.display = "none";
            }
        }
        show(el("panel-bet"));
    }

    if (state.phase === "game_over") {
        if (state.winner === "player") {
            el("over-title").textContent = "You Win The Table";
        } else {
            el("over-title").textContent = "The House Wins";
        }
        show(el("panel-over"));
    }
};

/**
 * Fills the stat list.
 * @param {object} card - The player's active card.
 * @param {?string} selectedStat - The stat to highlight, or null.
 * @param {boolean} interactive - Whether the buttons can be clicked.
 */
const renderStatButtons = function (card, selectedStat, interactive) {
    el("stat-buttons").innerHTML = STAT_KEYS.map(function (key) {
        let selected = "";
        if (key === selectedStat) {
            selected = "selected";
        }
        let disabled = "";
        if (!interactive) {
            disabled = "disabled";
        }
        return `<button class="stat-btn ${selected}"
                        data-stat="${key}" ${disabled}>
            <span class="label">${key}</span>
            <span class="val">${card.stats[key]}</span>
        </button>`;
    }).join("");

    if (interactive) {
        const buttons = Array.from(el("stat-buttons").children);
        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                apply(chooseStat(state, button.dataset.stat));
            });
        });
    }
};

/**
 * Configures the bet slider for the coins available.
 * @param {number} coins - Coins the player can spend.
 * @param {boolean} allowFold - Whether folding is permitted.
 */
const setupBetPanel = function (coins, allowFold) {
    const slider = el("bet-slider");
    const min = Math.min(MIN_BET, coins);
    const max = Math.min(MAX_BET, coins);
    slider.min = min;
    slider.max = max;
    slider.value = min;
    el("bet-value").textContent = min;

    if (allowFold) {
        el("fold-btn").style.display = "";
    } else {
        el("fold-btn").style.display = "none";
    }
};

// ── State transitions ────────────────────────────────────────────────────────

const apply = function (next) {
    state = next;
    render();
    scheduleCpu();
};

const scheduleCpu = function () {
    if (state.phase === "choose" && state.turn === "cpu") {
        setTimeout(function () {
            apply(cpuLead(state, Math.random()));
        }, 850);
    } else if (state.phase === "respond" && state.turn === "player") {
        setTimeout(cpuResponds, 850);
    } else if (state.phase === "resolved") {
        if (state.roundWinner === "player") {
            flash("player-card", "win");
            flash("cpu-card", "lose");
        } else if (state.roundWinner === "cpu") {
            flash("player-card", "lose");
            flash("cpu-card", "win");
        }
        setTimeout(function () {
            apply(nextRound(state));
        }, 2600);
    }
};

const cpuResponds = function () {
    const decision = cpuRespondDecision(state, Math.random());
    if (decision.action === "fold") {
        apply(fold(state, "cpu"));
    } else {
        apply(respond(state));
    }
};

// ── Static event wiring ──────────────────────────────────────────────────────

el("start-btn").addEventListener("click", function () {
    hide(el("start-screen"));
    show(el("table"));
    apply(newGame());
});

el("again-btn").addEventListener("click", function () {
    apply(newGame());
});

el("bet-slider").addEventListener("input", function () {
    el("bet-value").textContent = el("bet-slider").value;
});

el("bet-confirm").addEventListener("click", function () {
    if (state.phase === "lead_bet") {
        const amount = parseInt(el("bet-slider").value, 10);
        apply(placeLeadBet(state, amount));
    } else if (state.phase === "respond") {
        apply(respond(state));
    }
});

el("fold-btn").addEventListener("click", function () {
    apply(fold(state, "player"));
});