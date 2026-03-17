// js/analysis.js
// Analysis card overlay: loads matchups.json, renders side-by-side analysis cards.
// Imports from state.js only. NEVER imports from app.js or bracket.js.

import { state } from "./state.js";

let matchups = {};

export async function loadMatchups() {
  const data = await fetch("./data/matchups.json").then(r => r.json());
  matchups = data.matchups;
}

/**
 * Builds the full card HTML for a resolved matchup with both teams known.
 * @param {object} matchup - matchup entry from matchups.json
 * @param {object} topTeam - team object from state.teams
 * @param {object} botTeam - team object from state.teams
 * @returns {string} HTML string
 */
function buildCardHTML(matchup, topTeam, botTeam) {
  const upsetFlag = matchup.upset_alert
    ? `<span class="flag flag--upset">UPSET ALERT</span>`
    : "";
  const contrarianFlag = matchup.contrarian
    ? `<span class="flag flag--contrarian">CONTRARIAN</span>`
    : "";
  const confidenceLower = matchup.recommendation.confidence.toLowerCase();
  const recTeamName = matchup.recommendation.team === topTeam.id
    ? topTeam.name
    : botTeam.name;

  return `
    <div class="card-header">
      <button class="analysis-close" aria-label="Close">&times;</button>
      <span class="card-round">${matchup.round} &middot; ${matchup.region}</span>
      <div class="card-flags">${upsetFlag}${contrarianFlag}</div>
    </div>
    <div class="card-teams">
      <div class="team-col">
        <div class="team-title">
          <span class="seed-badge">${topTeam.seed}</span>
          <span class="team-name">${topTeam.name}</span>
        </div>
        <div class="metrics">
          <div class="metric"><span class="label">AdjEM</span><span class="value">${matchup.metrics.top.kenpom_adjEM}</span></div>
          <div class="metric"><span class="label">Last 10</span><span class="value">${matchup.metrics.top.last_10}</span></div>
          <div class="metric"><span class="label">SOS</span><span class="value">#${matchup.metrics.top.sos_rank}</span></div>
        </div>
        <ul class="pros">${matchup.pros.top.map(p => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.top.map(c => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="team-col">
        <div class="team-title">
          <span class="seed-badge">${botTeam.seed}</span>
          <span class="team-name">${botTeam.name}</span>
        </div>
        <div class="metrics">
          <div class="metric"><span class="label">AdjEM</span><span class="value">${matchup.metrics.bot.kenpom_adjEM}</span></div>
          <div class="metric"><span class="label">Last 10</span><span class="value">${matchup.metrics.bot.last_10}</span></div>
          <div class="metric"><span class="label">SOS</span><span class="value">#${matchup.metrics.bot.sos_rank}</span></div>
        </div>
        <ul class="pros">${matchup.pros.bot.map(p => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.bot.map(c => `<li>${c}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="card-recommendation">
      <span class="confidence-badge confidence--${confidenceLower}">${matchup.recommendation.confidence} Confidence</span>
      <span class="rec-pick">Pick: ${recTeamName}</span>
      <p class="reasoning">${matchup.reasoning}</p>
    </div>
  `;
}

/**
 * Builds placeholder HTML for matchups where teams are not yet known (TBD).
 * @returns {string} HTML string
 */
function buildPlaceholderHTML() {
  return `
    <div class="card-header">
      <button class="analysis-close" aria-label="Close">&times;</button>
    </div>
    <div class="card-placeholder">
      <p>Pick both teams to see analysis</p>
    </div>
  `;
}

/**
 * Opens the analysis card overlay for a given slot.
 * If no matchup data exists for the slot, no-ops.
 * If either team is TBD (null), shows placeholder message.
 * @param {string} slotId - slot id (e.g. "E1")
 */
export function openAnalysisCard(slotId) {
  const matchup = matchups[slotId];
  if (!matchup) return;

  const panel = document.getElementById("analysis-panel");
  if (!panel) return;

  const topTeam = matchup.team_top ? state.teams[matchup.team_top] : null;
  const botTeam = matchup.team_bot ? state.teams[matchup.team_bot] : null;

  if (!topTeam || !botTeam) {
    panel.innerHTML = buildPlaceholderHTML();
  } else {
    panel.innerHTML = buildCardHTML(matchup, topTeam, botTeam);
  }

  document.getElementById("analysis-overlay").classList.add("visible");
}

/**
 * Closes the analysis card overlay.
 */
export function closeAnalysisCard() {
  const overlay = document.getElementById("analysis-overlay");
  if (overlay) overlay.classList.remove("visible");
}

/**
 * Registers all analysis overlay event handlers.
 * Call ONCE after DOM is ready. Do NOT call on each card open.
 * - Escape key closes the overlay
 * - Backdrop (overlay div) click closes the overlay
 * - Close button (event delegation on panel) closes the overlay
 */
export function initAnalysisHandlers() {
  // Escape key listener
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeAnalysisCard();
  });

  // Backdrop click (click on overlay div itself, not on panel)
  const overlay = document.getElementById("analysis-overlay");
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === e.currentTarget) closeAnalysisCard();
    });
  }

  // Close button via event delegation on panel (panel innerHTML is rebuilt on each open)
  const panel = document.getElementById("analysis-panel");
  if (panel) {
    panel.addEventListener("click", e => {
      if (e.target.closest(".analysis-close")) closeAnalysisCard();
    });
  }
}
