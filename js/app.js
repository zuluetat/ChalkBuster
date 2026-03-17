// js/app.js
// Entry point: fetches JSON data, hydrates state, calls render functions.
// chalkbuster-picks-v1

import { state, loadPicksFromStorage } from "./state.js";
import { renderBracket, initBracketHandlers } from "./bracket.js";
import { renderRegionTabs } from "./regions.js";
import { renderFirstFour } from "./firstFour.js";

async function init() {
  try {
    const [teamsData, bracketData, ffData] = await Promise.all([
      fetch("./data/teams.json").then((r) => r.json()),
      fetch("./data/bracket.json").then((r) => r.json()),
      fetch("./data/first_four.json").then((r) => r.json()),
    ]);

    // Hydrate state from loaded JSON
    state.teams = teamsData.teams;
    state.slots = bracketData.slots;
    state.firstFour = ffData.first_four;

    // Restore picks from localStorage (pre-Supabase persistence)
    loadPicksFromStorage();

    // Render UI
    renderRegionTabs();
    renderBracket();
    renderFirstFour();
    initBracketHandlers();
  } catch (err) {
    console.error("[ChalkBuster] init failed:", err);
    document.getElementById("app").textContent =
      "Failed to load bracket data. Is the dev server running? Try: python3 -m http.server 8000";
  }
}

init();
