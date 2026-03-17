// js/firstFour.js
// First Four panel renderer, resolve toggle, and winner propagation.
// Imports from state.js and bracket.js only. NEVER imports from app.js.

import { state, clearDownstream } from "./state.js";
import { updateSlotAndDownstream } from "./bracket.js";

/**
 * Renders all 4 First Four game cards into #first-four-panel.
 * Injects panel CSS on first call if not already present.
 */
export function renderFirstFour() {
  injectStyles();

  const panel = document.getElementById("first-four-panel");
  if (!panel) return;

  panel.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "First Four";
  heading.style.cssText = "padding: 0 0 12px 0; margin-bottom: 4px; font-size: 18px;";
  panel.appendChild(heading);

  const subtext = document.createElement("p");
  subtext.textContent = "Play-in games (Mar 17-18). Mark winners after games end to fill R64 slots.";
  subtext.style.cssText = "font-size: 13px; color: var(--color-muted); margin-bottom: 16px;";
  panel.appendChild(subtext);

  Object.values(state.firstFour).forEach(game => {
    const card = buildGameCard(game);
    panel.appendChild(card);
  });

  // Attach event delegation — single listener on the panel
  panel.addEventListener("click", handlePanelClick);
}

/**
 * Marks a First Four game as resolved with a winner and propagates to bracket.
 * @param {string} ffId - e.g. "FF_UMBC_HOWARD"
 * @param {string} winner - team id of the winner, e.g. "UMBC"
 */
export function setFirstFourResolved(ffId, winner) {
  if (!state.firstFour[ffId]) return;
  state.firstFour[ffId].resolved = true;
  state.firstFour[ffId].winner = winner;

  // Find the R64 slot that sources from this First Four game
  const affectedSlot = Object.values(state.slots).find(
    s => s.top?.ff_id === ffId || s.bot?.ff_id === ffId
  );

  if (affectedSlot) {
    updateSlotAndDownstream(affectedSlot.id);
  }

  // Re-render the First Four panel to reflect new resolved state
  rerenderPanel();
}

/**
 * Clears a resolved First Four game and cleans up any dependent bracket picks.
 * @param {string} ffId - e.g. "FF_UMBC_HOWARD"
 */
export function clearFirstFourResolution(ffId) {
  if (!state.firstFour[ffId]) return;
  state.firstFour[ffId].resolved = false;
  state.firstFour[ffId].winner = null;

  // Find the R64 slot that sources from this First Four game
  const affectedSlot = Object.values(state.slots).find(
    s => s.top?.ff_id === ffId || s.bot?.ff_id === ffId
  );

  if (affectedSlot) {
    // Clear the pick for this slot and all downstream picks
    delete state.picks[affectedSlot.id];
    clearDownstream(affectedSlot.id);
    updateSlotAndDownstream(affectedSlot.id);
  }

  // Re-render the First Four panel to reflect cleared state
  rerenderPanel();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Re-renders only the game cards in the panel without re-attaching the
 * heading or event listener. Replaces all .ff-game-card elements.
 */
function rerenderPanel() {
  const panel = document.getElementById("first-four-panel");
  if (!panel) return;

  // Remove existing game cards
  panel.querySelectorAll(".ff-game-card").forEach(el => el.remove());

  // Re-add updated cards
  Object.values(state.firstFour).forEach(game => {
    const card = buildGameCard(game);
    panel.appendChild(card);
  });
}

/**
 * Builds a single First Four game card element.
 * @param {object} game - entry from state.firstFour
 * @returns {HTMLElement}
 */
function buildGameCard(game) {
  const topTeamName = state.teams[game.team_top]?.name ?? game.team_top;
  const botTeamName = state.teams[game.team_bot]?.name ?? game.team_bot;

  const card = document.createElement("div");
  card.className = "ff-game-card" + (game.resolved ? " resolved" : "");
  card.dataset.ffId = game.id;

  // Game header: region, seed, date
  const header = document.createElement("div");
  header.className = "ff-game-header";
  header.innerHTML = `
    <span class="ff-region">${game.region} — Seed ${game.seed}</span>
    <span class="ff-date">${formatDate(game.date)}</span>
  `;
  card.appendChild(header);

  // Matchup label
  const matchup = document.createElement("div");
  matchup.className = "ff-matchup-label";
  matchup.textContent = `${topTeamName} vs ${botTeamName}`;
  card.appendChild(matchup);

  if (game.resolved && game.winner) {
    // Resolved state: show winner and clear button
    const winnerName = state.teams[game.winner]?.name ?? game.winner;

    const resolvedBadge = document.createElement("div");
    resolvedBadge.className = "ff-resolved-badge";
    resolvedBadge.textContent = "RESOLVED";
    card.appendChild(resolvedBadge);

    const winnerDisplay = document.createElement("div");
    winnerDisplay.className = "ff-winner-display";
    winnerDisplay.textContent = `Winner: ${winnerName}`;
    card.appendChild(winnerDisplay);

    const clearBtn = document.createElement("button");
    clearBtn.className = "ff-clear-btn";
    clearBtn.textContent = "Clear Result";
    clearBtn.dataset.ffId = game.id;
    clearBtn.dataset.action = "clear";
    card.appendChild(clearBtn);
  } else {
    // Unresolved state: show pick buttons for each team
    const btnRow = document.createElement("div");
    btnRow.className = "ff-btn-row";

    const topBtn = document.createElement("button");
    topBtn.className = "ff-resolve-btn";
    topBtn.textContent = `Pick ${topTeamName} wins`;
    topBtn.dataset.ffId = game.id;
    topBtn.dataset.winner = game.team_top;
    topBtn.dataset.action = "resolve";
    btnRow.appendChild(topBtn);

    const botBtn = document.createElement("button");
    botBtn.className = "ff-resolve-btn";
    botBtn.textContent = `Pick ${botTeamName} wins`;
    botBtn.dataset.ffId = game.id;
    botBtn.dataset.winner = game.team_bot;
    botBtn.dataset.action = "resolve";
    btnRow.appendChild(botBtn);

    card.appendChild(btnRow);
  }

  return card;
}

/**
 * Event delegation handler for #first-four-panel clicks.
 * Routes to setFirstFourResolved or clearFirstFourResolution.
 * @param {MouseEvent} event
 */
function handlePanelClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el) return;

  const action = el.dataset.action;
  const ffId = el.dataset.ffId;

  if (!ffId) return;

  if (action === "resolve") {
    const winner = el.dataset.winner;
    if (winner) setFirstFourResolved(ffId, winner);
  } else if (action === "clear") {
    clearFirstFourResolution(ffId);
  }
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to a short display string.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const [, month, day] = dateStr.split("-");
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10)]} ${parseInt(day, 10)}`;
  } catch {
    return dateStr;
  }
}

/**
 * Injects First Four panel CSS into the document head once.
 * Skipped if already injected.
 */
function injectStyles() {
  if (document.getElementById("ff-styles")) return;

  const style = document.createElement("style");
  style.id = "ff-styles";
  style.textContent = `
    #first-four-panel {
      padding: 16px;
      border-top: 1px solid var(--color-border);
      margin-top: 24px;
    }

    .ff-game-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 12px;
      max-width: 480px;
    }

    .ff-game-card.resolved {
      opacity: 0.7;
    }

    .ff-game-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--color-muted);
      margin-bottom: 6px;
    }

    .ff-matchup-label {
      font-size: 15px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .ff-resolved-badge {
      display: inline-block;
      background: #2a6e3a;
      color: #7dffb0;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 8px;
      border-radius: 3px;
      margin-bottom: 6px;
    }

    .ff-winner-display {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text);
      margin-bottom: 8px;
    }

    .ff-btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ff-resolve-btn {
      background: var(--color-accent);
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .ff-resolve-btn:hover {
      opacity: 0.85;
    }

    .ff-clear-btn {
      background: transparent;
      color: var(--color-muted);
      border: 1px solid var(--color-border);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .ff-clear-btn:hover {
      color: var(--color-text);
      border-color: var(--color-accent);
    }
  `;
  document.head.appendChild(style);
}
