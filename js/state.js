// js/state.js
// Single source of truth for all mutable state.
// This module imports NOTHING from other project modules.
// All state mutations route through the exported functions below.

export const state = {
  teams: {}, // keyed by team id, loaded from data/teams.json
  slots: {}, // keyed by slot id, loaded from data/bracket.json
  firstFour: {}, // keyed by ff game id, loaded from data/first_four.json
  picks: {}, // { [gameId]: teamId }
  activeRegion: "East",
  readOnly: false, // true when viewing a shared bracket
  tipoffGated: false, // true when shared bracket is hidden until tipoff
  bracketName: "", // user's bracket name
};

/** Callback for Supabase save — set by app.js after supabase.js is loaded */
let onPicksChanged = null;
export function setOnPicksChanged(fn) {
  onPicksChanged = fn;
}

/** Debounce timer for Supabase saves */
let saveTimer = null;
function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePicksToStorage();
    if (onPicksChanged) onPicksChanged(state.picks);
  }, 500);
}

/**
 * Record a pick for a game and clear all downstream picks that are now invalid.
 */
export function setPick(gameId, teamId) {
  if (state.readOnly) return; // block edits in shared view
  state.picks[gameId] = teamId;
  clearDownstream(gameId);
  debouncedSave();
}

/**
 * Clear all picks that depend on the result of gameId.
 */
export function clearDownstream(gameId) {
  const downstream = Object.values(state.slots).filter(
    (slot) => slot.top?.game === gameId || slot.bot?.game === gameId,
  );
  downstream.forEach((slot) => {
    if (state.picks[slot.id]) {
      delete state.picks[slot.id];
      clearDownstream(slot.id);
    }
  });
}

/**
 * Persist current picks to localStorage.
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

/**
 * Reset all picks and clear storage.
 */
export function resetAllPicks() {
  state.picks = {};
  savePicksToStorage();
}

/**
 * Reset picks for a single region.
 */
export function resetRegionPicks(region) {
  // Find all slots in this region and clear their picks
  const regionSlots = Object.values(state.slots).filter(
    (s) => s.region === region,
  );
  regionSlots.forEach((s) => {
    delete state.picks[s.id];
  });
  // Also clear Final Four / Championship slots that sourced from this region
  const ffSlots = Object.values(state.slots).filter(
    (s) => s.region === "FinalFour" || s.region === "Championship",
  );
  ffSlots.forEach((s) => {
    // Check if any upstream dependency leads to this region
    if (state.picks[s.id]) {
      delete state.picks[s.id];
    }
  });
  debouncedSave();
}
