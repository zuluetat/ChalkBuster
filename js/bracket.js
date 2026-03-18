// js/bracket.js
// Bracket renderer and click-to-pick handlers.
// Imports from state.js and analysis.js. NEVER imports from app.js (prevents circular deps).

import { state, setPick } from "./state.js";
import { openAnalysisCard } from "./analysis.js";

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
 * Returns a display label for an unresolved First Four source, e.g. "UMBC/Howard".
 * Returns "TBD" if the source is not a first_four type or data is missing.
 */
function ffLabel(source) {
  if (!source || source.type !== "first_four") return "TBD";
  const ff = state.firstFour[source.ff_id];
  if (!ff) return "TBD";
  const topName = state.teams[ff.team_top]?.name ?? ff.team_top;
  const botName = state.teams[ff.team_bot]?.name ?? ff.team_bot;
  return `${topName}/${botName}`;
}

/**
 * Returns the seed badge text for an unresolved First Four source.
 */
function ffSeed(source) {
  if (!source || source.type !== "first_four") return "";
  const ff = state.firstFour[source.ff_id];
  return ff ? String(ff.seed) : "";
}

/**
 * Resolves which team object occupies a slot source reference.
 * Returns the team object or null if unresolvable (TBD).
 * @param {object} source - { type: "seed"|"first_four"|"winner", ... }
 * @returns {object|null}
 */
function resolveTeam(source) {
  if (!source) return null;

  if (source.type === "seed") {
    return (
      Object.values(state.teams).find(
        (t) => t.seed === source.seed && t.region === source.region,
      ) ?? null
    );
  }

  if (source.type === "first_four") {
    const ff = state.firstFour[source.ff_id];
    if (!ff || !ff.resolved || !ff.winner) return null; // TBD — use ffLabel() for display
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
function buildTeamSlotEl(gameId, pos, team, source) {
  const div = document.createElement("div");
  div.className = "team-slot";
  div.dataset.pos = pos;
  div.dataset.team = team ? team.id : "";

  // Team logo
  if (team && team.espn_id) {
    const logo = document.createElement("img");
    logo.className = "team-logo";
    logo.src = `https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${team.espn_id}.png&h=40&w=40`;
    logo.alt = "";
    logo.loading = "lazy";
    logo.onerror = function () {
      this.style.display = "none";
    };
    div.appendChild(logo);
  }

  const seedBadge = document.createElement("span");
  seedBadge.className = "seed-badge";
  seedBadge.textContent = team ? team.seed : ffSeed(source);

  const nameSpan = document.createElement("span");
  nameSpan.className = "team-name";
  nameSpan.textContent = team ? team.name : ffLabel(source);

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

  card.appendChild(buildTeamSlotEl(slot.id, "top", topTeam, slot.top));
  card.appendChild(buildTeamSlotEl(slot.id, "bot", botTeam, slot.bot));

  const infoBtn = document.createElement("button");
  infoBtn.className = "analysis-trigger";
  infoBtn.dataset.game = slot.id;
  infoBtn.setAttribute("aria-label", "View matchup analysis");
  infoBtn.textContent = "i";
  card.appendChild(infoBtn);

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
  regions.forEach((region) => {
    const regionEl = buildRegionEl(region, REGION_ROUNDS);
    if (region === state.activeRegion) {
      regionEl.classList.add("active");
    }
    container.appendChild(regionEl);
  });

  // Render combined Final Four + Championship as pyramid
  const ff4El = buildFinalFourRegion();
  if (state.activeRegion === "Final Four") {
    ff4El.classList.add("active");
  }
  container.appendChild(ff4El);
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
  const regionSlots = Object.values(state.slots).filter(
    (s) => s.region === region,
  );

  rounds.forEach((round) => {
    const roundSlots = regionSlots
      .filter((s) => s.round === round)
      .sort((a, b) => a.position - b.position);

    if (roundSlots.length === 0) return;

    const col = document.createElement("div");
    col.className = "round-column";

    const label = document.createElement("div");
    label.className = "round-label";
    label.textContent = ROUND_LABELS[round] || round;
    col.appendChild(label);

    roundSlots.forEach((slot) => {
      col.appendChild(buildMatchupCard(slot));
    });

    regionEl.appendChild(col);
  });

  // Add "→ Final Four" callout after the E8 column
  const ff4Link = document.createElement("div");
  ff4Link.className = "final-four-link";
  ff4Link.innerHTML = `<span class="ff4-arrow">&rarr;</span><span class="ff4-text">Final Four</span>`;
  ff4Link.addEventListener("click", () => {
    const tabBtn = document.querySelector('[data-region="Final Four"]');
    if (tabBtn) tabBtn.click();
  });
  regionEl.appendChild(ff4Link);

  return regionEl;
}

/**
 * Predicts a final score based on team stats.
 * Uses ORtg, DRtg, and Pace to estimate points.
 */
function predictScore(teamA, teamB) {
  if (!teamA || !teamB) return null;
  // Look up metrics from matchups data (stored in state after loadMatchups)
  // Fall back to teams.json data
  const aORtg = teamA.kenpom_adjO || 110;
  const aDRtg = teamA.kenpom_adjD || 100;
  const bORtg = teamB.kenpom_adjO || 110;
  const bDRtg = teamB.kenpom_adjD || 100;
  const avgPace = ((teamA.kenpom_tempo || 68) + (teamB.kenpom_tempo || 68)) / 2;
  const avgORtg = 107; // D1 average

  // Log5-style: adjust each team's offense by opponent defense
  const aAdj = (aORtg * bDRtg) / avgORtg;
  const bAdj = (bORtg * aDRtg) / avgORtg;

  const aScore = Math.round((avgPace * aAdj) / 100);
  const bScore = Math.round((avgPace * bAdj) / 100);

  return { a: aScore, b: bScore };
}

/**
 * Builds the combined Final Four + Championship region as a pyramid.
 * F4 matchups on the left, Championship in the middle, predicted score on the right.
 */
function buildFinalFourRegion() {
  const regionEl = document.createElement("div");
  regionEl.className = "bracket-region bracket-region--ff";
  regionEl.dataset.region = "FinalFour";

  const regionSources = {
    FF1: { top: "East", bot: "West" },
    FF2: { top: "South", bot: "Midwest" },
    CH1: { top: "FF1 Winner", bot: "FF2 Winner" },
  };

  function buildColumn(regionName, round, label) {
    const slots = Object.values(state.slots)
      .filter((s) => s.region === regionName && s.round === round)
      .sort((a, b) => a.position - b.position);

    const col = document.createElement("div");
    col.className = "round-column";

    const roundLabel = document.createElement("div");
    roundLabel.className = "round-label";
    roundLabel.textContent = label;
    col.appendChild(roundLabel);

    slots.forEach((slot) => {
      const wrapper = document.createElement("div");
      wrapper.className = "ff-matchup-wrapper";

      const src = regionSources[slot.id];
      if (src) {
        const topLabel = document.createElement("div");
        topLabel.className = "ff-region-tag ff-region-tag--top";
        topLabel.innerHTML = `<span class="ff-region-link" data-region="${src.top}">&larr; ${src.top}</span>`;
        wrapper.appendChild(topLabel);
      }

      wrapper.appendChild(buildMatchupCard(slot));

      if (src) {
        const botLabel = document.createElement("div");
        botLabel.className = "ff-region-tag ff-region-tag--bot";
        botLabel.innerHTML = `<span class="ff-region-link" data-region="${src.bot}">&larr; ${src.bot}</span>`;
        wrapper.appendChild(botLabel);
      }

      wrapper.querySelectorAll(".ff-region-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.stopPropagation();
          const region = link.dataset.region;
          const tabBtn = document.querySelector(`[data-region="${region}"]`);
          if (tabBtn) tabBtn.click();
        });
      });

      col.appendChild(wrapper);
    });

    return col;
  }

  // F4 column (2 matchups)
  regionEl.appendChild(buildColumn("FinalFour", "F4", "Final Four"));

  // Championship column (1 matchup)
  const chmCol = buildColumn("Championship", "CHM", "Championship");

  // Add predicted score below championship
  const chSlot = Object.values(state.slots).find(
    (s) => s.region === "Championship" && s.round === "CHM",
  );
  if (chSlot) {
    const topTeam = resolveTeam(chSlot.top);
    const botTeam = resolveTeam(chSlot.bot);
    if (topTeam && botTeam) {
      const score = predictScore(
        state.teams[topTeam.id],
        state.teams[botTeam.id],
      );
      if (score) {
        const scoreEl = document.createElement("div");
        scoreEl.className = "predicted-score";
        scoreEl.innerHTML = `
          <div class="predicted-label">Predicted Score</div>
          <div class="predicted-teams">
            <span class="predicted-team">${topTeam.name} <strong>${score.a}</strong></span>
            <span class="predicted-vs">-</span>
            <span class="predicted-team"><strong>${score.b}</strong> ${botTeam.name}</span>
          </div>
        `;
        chmCol.appendChild(scoreEl);
      }
    }
  }

  regionEl.appendChild(chmCol);

  // Champion display column
  const champCol = document.createElement("div");
  champCol.className = "round-column champ-column";
  const champLabel = document.createElement("div");
  champLabel.className = "round-label";
  champLabel.textContent = "Champion";
  champCol.appendChild(champLabel);

  const champDisplay = document.createElement("div");
  champDisplay.className = "champ-display";
  const champPick = state.picks["CH1"];
  if (champPick && state.teams[champPick]) {
    const champ = state.teams[champPick];
    const logo = champ.espn_id
      ? `<img class="champ-logo" src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${champ.espn_id}.png&h=80&w=80" alt="">`
      : "";
    champDisplay.innerHTML = `${logo}<div class="champ-name">${champ.name}</div><div class="champ-seed">${champ.seed} seed</div>`;
  } else {
    champDisplay.innerHTML = `<div class="champ-name champ-tbd">TBD</div>`;
  }
  champCol.appendChild(champDisplay);
  regionEl.appendChild(champCol);

  return regionEl;
}

/**
 * Re-renders the Final Four region in place to update champion display and predicted score.
 */
function refreshFinalFour() {
  const container = document.getElementById("bracket-container");
  if (!container) return;
  const old = container.querySelector('[data-region="FinalFour"]');
  if (!old) return;
  const wasActive = old.classList.contains("active");
  const newEl = buildFinalFourRegion();
  if (wasActive) newEl.classList.add("active");
  old.replaceWith(newEl);
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

  const regionSlots = Object.values(state.slots).filter(
    (s) => s.region === regionName,
  );

  rounds.forEach((round) => {
    const roundSlots = regionSlots
      .filter((s) => s.round === round)
      .sort((a, b) => a.position - b.position);

    if (roundSlots.length === 0) return;

    const col = document.createElement("div");
    col.className = "round-column";

    const label = document.createElement("div");
    label.className = "round-label";
    label.textContent = ROUND_LABELS[round] || round;
    col.appendChild(label);

    // Region source labels for Final Four matchups
    const regionSources = {
      FF1: { top: "East", bot: "West" },
      FF2: { top: "South", bot: "Midwest" },
      CH1: { top: "FF1 Winner", bot: "FF2 Winner" },
    };

    roundSlots.forEach((slot) => {
      const wrapper = document.createElement("div");
      wrapper.className = "ff-matchup-wrapper";

      const src = regionSources[slot.id];
      if (src) {
        // Top team region link
        const topLabel = document.createElement("div");
        topLabel.className = "ff-region-tag ff-region-tag--top";
        topLabel.innerHTML = `<span class="ff-region-link" data-region="${src.top}">&larr; ${src.top}</span>`;
        wrapper.appendChild(topLabel);
      }

      wrapper.appendChild(buildMatchupCard(slot));

      if (src) {
        // Bottom team region link
        const botLabel = document.createElement("div");
        botLabel.className = "ff-region-tag ff-region-tag--bot";
        botLabel.innerHTML = `<span class="ff-region-link" data-region="${src.bot}">&larr; ${src.bot}</span>`;
        wrapper.appendChild(botLabel);
      }

      // Click handler for region links
      wrapper.querySelectorAll(".ff-region-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.stopPropagation();
          const region = link.dataset.region;
          const tabBtn = document.querySelector(`[data-region="${region}"]`);
          if (tabBtn) tabBtn.click();
        });
      });

      col.appendChild(wrapper);
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
    topEl.querySelector(".seed-badge").textContent = topTeam
      ? topTeam.seed
      : ffSeed(slot.top);
    topEl.querySelector(".team-name").textContent = topTeam
      ? topTeam.name
      : ffLabel(slot.top);
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
    botEl.querySelector(".seed-badge").textContent = botTeam
      ? botTeam.seed
      : ffSeed(slot.bot);
    botEl.querySelector(".team-name").textContent = botTeam
      ? botTeam.name
      : ffLabel(slot.bot);
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

  // If this is a Final Four or Championship slot, refresh the whole FF region
  // to update champion display and predicted score
  const slot = state.slots[gameId];
  if (slot && (slot.region === "FinalFour" || slot.region === "Championship")) {
    refreshFinalFour();
  }

  // Find all downstream slots that source their team from this game's winner
  const downstream = Object.values(state.slots).filter(
    (s) => s.top?.game === gameId || s.bot?.game === gameId,
  );
  downstream.forEach((s) => updateSlotAndDownstream(s.id));
}

/**
 * Sets up click delegation on #bracket-container.
 * One listener handles all pick clicks across all regions.
 * TBD slots (empty data-team) are ignored — never picks null.
 */
export function initBracketHandlers() {
  const container = document.getElementById("bracket-container");
  if (!container) return;

  // Listen for picks made from the analysis card overlay
  document.addEventListener("chalkbuster:pick", (e) => {
    updateSlotAndDownstream(e.detail.gameId);
  });

  // Analysis trigger handler -- must come BEFORE pick handler to allow stopPropagation
  container.addEventListener("click", (event) => {
    const trigger = event.target.closest(".analysis-trigger");
    if (!trigger) return;
    event.stopPropagation();
    openAnalysisCard(trigger.dataset.game);
  });

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
