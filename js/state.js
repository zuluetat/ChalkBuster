// js/state.js
// Single source of truth for all mutable state.
// This module imports NOTHING from other project modules.
// All state mutations route through the exported functions below.

export const state = {
  teams: {},       // keyed by team id, loaded from data/teams.json
  slots: {},       // keyed by slot id, loaded from data/bracket.json
  firstFour: {},   // keyed by ff game id, loaded from data/first_four.json
  picks: {},       // { [gameId]: teamId }
  activeRegion: "East",
};

/**
 * Record a pick for a game and clear all downstream picks that are now invalid.
 * @param {string} gameId - slot id (e.g. "E1")
 * @param {string} teamId - team id (e.g. "DUKE")
 */
export function setPick(gameId, teamId) {
  state.picks[gameId] = teamId;
  clearDownstream(gameId);
  savePicksToStorage();
}

/**
 * Clear all picks that depend on the result of gameId.
 * Finds all downstream slots referencing gameId as a winner source, deletes
 * their picks, and recurses so the entire chain is cleared.
 * @param {string} gameId
 */
export function clearDownstream(gameId) {
  // Find all slots whose top or bot source references gameId as a winner
  const downstream = Object.values(state.slots).filter(slot =>
    slot.top?.game === gameId || slot.bot?.game === gameId
  );
  downstream.forEach(slot => {
    if (state.picks[slot.id]) {
      delete state.picks[slot.id];
      clearDownstream(slot.id);
    }
  });
}

/**
 * Persist current picks to localStorage.
 * Silently swallows storage errors (private mode, quota exceeded).
 */
export function savePicksToStorage() {
  try {
    localStorage.setItem("chalkbuster-picks-v1", JSON.stringify(state.picks));
  } catch (e) {
    console.warn("[ChalkBuster] Could not save picks to localStorage:", e);
  }
}

/**
 * Restore picks from localStorage on page load.
 * Silently resets to empty on parse error.
 */
export function loadPicksFromStorage() {
  try {
    const saved = localStorage.getItem("chalkbuster-picks-v1");
    if (saved) {
      state.picks = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("[ChalkBuster] Could not load picks from localStorage:", e);
    state.picks = {};
  }
}

// state.js imports nothing -- enforced to prevent circular dependencies
