// js/bracket.js
// Bracket renderer and click-to-pick handlers.
// Imports from state.js only. NEVER imports from app.js (prevents circular deps).

import { state, setPick } from "./state.js";

// Round display order and labels per region
const REGION_ROUNDS = ["R64", "R32", "S16", "E8"];
const ROUND_LABELS = {
  R64: "Round of 64",
  R32: "Round of 32",
  S16: "Sweet 16",
  E8: "Elite 8",
  F4: "Final Four",
  CHM: "Championship",
};

/**
 * Resolves which team object occupies a slot source reference.
 * Returns the team object or null if unresolvable (TBD).
 * @param {object} source - { type: "seed"|"first_four"|"winner", ... }
 * @returns {object|null}
 */
function resolveTeam(source) {
  if (!source) return null;

  if (source.type === "seed") {
    return Object.values(state.teams).find(
      t => t.seed === source.seed && t.region === source.region
    ) ?? null;
  }

  if (source.type === "first_four") {
    const ff = state.firstFour[source.ff_id];
    if (!ff || !ff.resolved || !ff.winner) return null; // TBD
    return state.teams[ff.winner] ?? null;
  }

  if (source.type === "winner") {
    const winnerId = state.picks[source.game];
    if (!winnerId) return null; // TBD — upstream pick not made yet
    return state.teams[winnerId] ?? null;
  }

  return null;
}

/**
 * Builds the HTML for a single team slot row inside a matchup card.
 * Returns a div.team-slot element.
 * @param {string} gameId - slot id (e.g. "E1")
 * @param {string} pos - "top" or "bot"
 * @param {object|null} team - resolved team object or null for TBD
 * @returns {HTMLElement}
 */
function buildTeamSlotEl(gameId, pos, team) {
  const div = document.createElement("div");
  div.className = "team-slot";
  div.dataset.pos = pos;
  div.dataset.team = team ? team.id : "";

  const seedBadge = document.createElement("span");
  seedBadge.className = "seed-badge";
  seedBadge.textContent = team ? team.seed : "";

  const nameSpan = document.createElement("span");
  nameSpan.className = "team-name";
  nameSpan.textContent = team ? team.name : "TBD";

  div.appendChild(seedBadge);
  div.appendChild(nameSpan);

  if (!team) {
    div.classList.add("tbd");
  } else if (state.picks[gameId] === team.id) {
    div.classList.add("picked");
  }

  return div;
}

/**
 * Builds a matchup card element for a slot.
 * @param {object} slot - slot object from state.slots
 * @returns {HTMLElement}
 */
function buildMatchupCard(slot) {
  const card = document.createElement("div");
  card.className = "matchup-card";
  card.dataset.game = slot.id;

  const topTeam = resolveTeam(slot.top);
  const botTeam = resolveTeam(slot.bot);

  card.appendChild(buildTeamSlotEl(slot.id, "top", topTeam));
  card.appendChild(buildTeamSlotEl(slot.id, "bot", botTeam));

  return card;
}

/**
 * Renders all bracket regions into #bracket-container.
 * Clears the container first, then renders East, South, Midwest, West,
 * Final Four, and Championship regions.
 */
export function renderBracket() {
  const container = document.getElementById("bracket-container");
  if (!container) return;
  container.innerHTML = "";

  // Render the 4 main regions
  const regions = ["East", "South", "Midwest", "West"];
  regions.forEach(region => {
    const regionEl = buildRegionEl(region, REGION_ROUNDS);
    if (region === state.activeRegion) {
      regionEl.classList.add("active");
    }
    container.appendChild(regionEl);
  });

  // Render Final Four (F4 round only)
  const ff4El = buildSpecialRegionEl("FinalFour", ["F4"]);
  if (state.activeRegion === "Final Four") {
    ff4El.classList.add("active");
  }
  container.appendChild(ff4El);

  // Render Championship (CHM round only, same region element as FinalFour for simplicity)
  // Championship is displayed alongside Final Four when "Final Four" tab is active
  const chmEl = buildSpecialRegionEl("Championship", ["CHM"]);
  if (state.activeRegion === "Final Four") {
    chmEl.classList.add("active");
  }
  container.appendChild(chmEl);
}

/**
 * Builds a region element for one of the 4 main regions with 4 round columns.
 * @param {string} region - "East" | "South" | "Midwest" | "West"
 * @param {string[]} rounds - round codes to render in order
 * @returns {HTMLElement}
 */
function buildRegionEl(region, rounds) {
  const regionEl = document.createElement("div");
  regionEl.className = "bracket-region";
  regionEl.dataset.region = region;

  // Get all slots for this region, sorted by round then position
  const regionSlots = Object.values(state.slots).filter(s => s.region === region);

  rounds.forEach(round => {
    const roundSlots = regionSlots
      .filter(s => s.round === round)
      .sort((a, b) => a.position - b.position);

    if (roundSlots.length === 0) return;

    const col = document.createElement("div");
    col.className = "round-column";

    const label = document.createElement("div");
    label.className = "round-label";
    label.textContent = ROUND_LABELS[round] || round;
    col.appendChild(label);

    roundSlots.forEach(slot => {
      col.appendChild(buildMatchupCard(slot));
    });

    regionEl.appendChild(col);
  });

  return regionEl;
}

/**
 * Builds a region element for Final Four or Championship.
 * @param {string} regionName - "FinalFour" | "Championship"
 * @param {string[]} rounds - round codes to render
 * @returns {HTMLElement}
 */
function buildSpecialRegionEl(regionName, rounds) {
  const regionEl = document.createElement("div");
  regionEl.className = "bracket-region";
  regionEl.dataset.region = regionName;

  const regionSlots = Object.values(state.slots).filter(s => s.region === regionName);

  rounds.forEach(round => {
    const roundSlots = regionSlots
      .filter(s => s.round === round)
      .sort((a, b) => a.position - b.position);

    if (roundSlots.length === 0) return;

    const col = document.createElement("div");
    col.className = "round-column";

    const label = document.createElement("div");
    label.className = "round-label";
    label.textContent = ROUND_LABELS[round] || round;
    col.appendChild(label);

    roundSlots.forEach(slot => {
      col.appendChild(buildMatchupCard(slot));
    });

    regionEl.appendChild(col);
  });

  return regionEl;
}

/**
 * Updates a single slot card in the DOM without re-rendering the full bracket.
 * Safely skips if slot is not in the current visible region.
 * @param {string} gameId - slot id (e.g. "E9")
 */
function updateSlotDOM(gameId) {
  const card = document.querySelector(`[data-game="${gameId}"]`);
  if (!card) return; // Slot not in current visible region — safe to skip

  const slot = state.slots[gameId];
  if (!slot) return;

  const topTeam = resolveTeam(slot.top);
  const botTeam = resolveTeam(slot.bot);
  const pick = state.picks[gameId];

  // Update top slot
  const topEl = card.querySelector("[data-pos='top']");
  if (topEl) {
    topEl.dataset.team = topTeam ? topTeam.id : "";
    topEl.querySelector(".seed-badge").textContent = topTeam ? topTeam.seed : "";
    topEl.querySelector(".team-name").textContent = topTeam ? topTeam.name : "TBD";
    topEl.classList.remove("picked", "tbd");
    if (!topTeam) {
      topEl.classList.add("tbd");
    } else if (pick === topTeam.id) {
      topEl.classList.add("picked");
    }
  }

  // Update bot slot
  const botEl = card.querySelector("[data-pos='bot']");
  if (botEl) {
    botEl.dataset.team = botTeam ? botTeam.id : "";
    botEl.querySelector(".seed-badge").textContent = botTeam ? botTeam.seed : "";
    botEl.querySelector(".team-name").textContent = botTeam ? botTeam.name : "TBD";
    botEl.classList.remove("picked", "tbd");
    if (!botTeam) {
      botEl.classList.add("tbd");
    } else if (pick === botTeam.id) {
      botEl.classList.add("picked");
    }
  }
}

/**
 * Targeted DOM update: updates this slot and recursively updates all downstream
 * slots that depend on this game's result.
 * @param {string} gameId
 */
export function updateSlotAndDownstream(gameId) {
  updateSlotDOM(gameId);

  // Find all downstream slots that source their team from this game's winner
  const downstream = Object.values(state.slots).filter(
    s => s.top?.game === gameId || s.bot?.game === gameId
  );
  downstream.forEach(s => updateSlotAndDownstream(s.id));
}

/**
 * Sets up click delegation on #bracket-container.
 * One listener handles all pick clicks across all regions.
 * TBD slots (empty data-team) are ignored — never picks null.
 */
export function initBracketHandlers() {
  const container = document.getElementById("bracket-container");
  if (!container) return;

  container.addEventListener("click", (event) => {
    // Find the clicked team-slot
    const teamSlot = event.target.closest(".team-slot");
    if (!teamSlot) return;

    // Get game id from the parent matchup card
    const card = teamSlot.closest(".matchup-card");
    if (!card) return;

    const gameId = card.dataset.game;
    const teamId = teamSlot.dataset.team;

    // TBD slot — do not pick
    if (!teamId) return;

    // Already the current pick — no-op
    if (state.picks[gameId] === teamId) return;

    // Record pick and update DOM
    setPick(gameId, teamId);
    updateSlotAndDownstream(gameId);
  });
}
