// js/app.js
// Entry point: fetches JSON data, hydrates state, calls render functions.

import {
  state,
  loadPicksFromStorage,
  setOnPicksChanged,
  resetAllPicks,
  resetRegionPicks,
} from "./state.js";
import { renderBracket, initBracketHandlers } from "./bracket.js";
import { renderRegionTabs } from "./regions.js";
import { renderFirstFour } from "./firstFour.js";
import { loadMatchups, initAnalysisHandlers } from "./analysis.js";
import {
  getSharedToken,
  loadSharedBracket,
  loadBracket,
  savePicks,
  resetBracket,
  getShareURL,
  getLocalShareToken,
} from "./supabase.js";

/**
 * Resolves team name for a slot source (seed, first_four, or winner).
 */
function resolveSlotTeam(source) {
  if (!source) return null;
  if (source.type === "seed") {
    return (
      Object.values(state.teams).find(
        (t) => t.seed === source.seed && t.region === source.region,
      ) || null
    );
  }
  if (source.type === "first_four") {
    const ff = state.firstFour[source.ff_id];
    if (!ff || !ff.resolved || !ff.winner) return null;
    return state.teams[ff.winner] || null;
  }
  if (source.type === "winner") {
    const winnerId = state.picks[source.game];
    if (!winnerId) return null;
    return state.teams[winnerId] || null;
  }
  return null;
}

/**
 * Builds a clean, single-page print bracket and injects it into the DOM.
 * NCAA-style: left regions flow right, right regions flow left, Final Four in center.
 */
function buildPrintBracket() {
  // Remove previous print bracket if any
  const old = document.getElementById("print-bracket");
  if (old) old.remove();

  const ROUNDS = ["R64", "R32", "S16", "E8"];
  const ROUND_NAMES = {
    R64: "1st Round",
    R32: "2nd Round",
    S16: "Sweet 16",
    E8: "Elite 8",
    F4: "Final Four",
    CHM: "Championship",
  };

  function slotLabel(slot) {
    const team = resolveSlotTeam(slot.top ? { ...slot.top } : null);
    // Try resolving from picks
    const topTeam = resolveSlotTeam(slot.top);
    const botTeam = resolveSlotTeam(slot.bot);
    const pick = state.picks[slot.id];
    return { topTeam, botTeam, pick };
  }

  function teamCell(team, isPick) {
    if (!team) return `<div class="pb-team pb-tbd">TBD</div>`;
    const cls = isPick ? "pb-team pb-picked" : "pb-team";
    const logo = team.espn_id
      ? `<img class="pb-logo" src="https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/${team.espn_id}.png&h=24&w=24" alt="">`
      : "";
    return `<div class="${cls}">${logo}<span class="pb-seed">${team.seed}</span> ${team.name}</div>`;
  }

  function buildRegionHTML(region, rounds, side) {
    const regionSlots = Object.values(state.slots).filter(
      (s) => s.region === region,
    );
    let html = `<div class="pb-region" data-side="${side}"><div class="pb-region-name">${region}</div><div class="pb-rounds">`;

    rounds.forEach((round, ri) => {
      const roundSlots = regionSlots
        .filter((s) => s.round === round)
        .sort((a, b) => a.position - b.position);
      const isLast = ri === rounds.length - 1;
      html += `<div class="pb-round">`;
      html += `<div class="pb-round-name">${ROUND_NAMES[round]}</div>`;

      // Group matchups in pairs for bracket connectors
      for (let i = 0; i < roundSlots.length; i += 2) {
        html += `<div class="pb-pair${isLast ? " pb-pair--last" : ""}">`;
        for (let j = i; j < Math.min(i + 2, roundSlots.length); j++) {
          const slot = roundSlots[j];
          const topTeam = resolveSlotTeam(slot.top);
          const botTeam = resolveSlotTeam(slot.bot);
          const pick = state.picks[slot.id];
          html += `<div class="pb-matchup">`;
          html += teamCell(topTeam, pick && topTeam && pick === topTeam.id);
          html += teamCell(botTeam, pick && botTeam && pick === botTeam.id);
          html += `</div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    });

    html += `</div></div>`;
    return html;
  }

  // Final Four + Championship
  function buildFinalHTML() {
    let html = `<div class="pb-final">`;

    // Final Four
    const f4Slots = Object.values(state.slots)
      .filter((s) => s.region === "FinalFour" && s.round === "F4")
      .sort((a, b) => a.position - b.position);
    html += `<div class="pb-round"><div class="pb-round-name">${ROUND_NAMES.F4}</div>`;
    f4Slots.forEach((slot) => {
      const topTeam = resolveSlotTeam(slot.top);
      const botTeam = resolveSlotTeam(slot.bot);
      const pick = state.picks[slot.id];
      html += `<div class="pb-matchup">`;
      html += teamCell(topTeam, pick && topTeam && pick === topTeam.id);
      html += teamCell(botTeam, pick && botTeam && pick === botTeam.id);
      html += `</div>`;
    });
    html += `</div>`;

    // Championship
    const chmSlots = Object.values(state.slots)
      .filter((s) => s.region === "Championship" && s.round === "CHM")
      .sort((a, b) => a.position - b.position);
    html += `<div class="pb-round"><div class="pb-round-name">${ROUND_NAMES.CHM}</div>`;
    chmSlots.forEach((slot) => {
      const topTeam = resolveSlotTeam(slot.top);
      const botTeam = resolveSlotTeam(slot.bot);
      const pick = state.picks[slot.id];
      html += `<div class="pb-matchup">`;
      html += teamCell(topTeam, pick && topTeam && pick === topTeam.id);
      html += teamCell(botTeam, pick && botTeam && pick === botTeam.id);
      html += `</div>`;
    });
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  const printDiv = document.createElement("div");
  printDiv.id = "print-bracket";
  printDiv.innerHTML = `
    <div class="pb-header">
      <h1>TZ's CHALKBUSTER <span>2026</span></h1>
      ${state.bracketName ? `<div class="pb-bracket-name">${state.bracketName}</div>` : ""}
    </div>
    <div class="pb-body">
      <div class="pb-left">
        ${buildRegionHTML("East", ROUNDS, "left")}
        ${buildRegionHTML("South", ROUNDS, "left")}
      </div>
      <div class="pb-center">
        ${buildFinalHTML()}
      </div>
      <div class="pb-right">
        ${buildRegionHTML("Midwest", [...ROUNDS].reverse(), "right")}
        ${buildRegionHTML("West", [...ROUNDS].reverse(), "right")}
      </div>
    </div>
  `;

  document.body.appendChild(printDiv);
}

function renderToolbar() {
  const existing = document.getElementById("toolbar");
  if (existing) existing.remove();

  const toolbar = document.createElement("div");
  toolbar.id = "toolbar";
  toolbar.className = "toolbar";

  const nav = document.getElementById("region-tabs");

  if (state.readOnly) {
    toolbar.innerHTML = `
      <span class="toolbar-label">Viewing shared bracket (read-only)</span>
      <button id="btn-own" class="toolbar-btn">Make your own</button>
    `;
    if (nav) nav.appendChild(toolbar);
    document.getElementById("btn-own").addEventListener("click", () => {
      window.location.href = window.location.pathname;
    });
    return;
  }

  const showRegionReset =
    state.activeRegion && state.activeRegion !== "FinalFour";
  toolbar.innerHTML = `
    <button id="btn-export" class="toolbar-btn">Export</button>
    ${showRegionReset ? `<button id="btn-reset-region" class="toolbar-btn toolbar-btn--secondary">Reset ${state.activeRegion}</button>` : ""}
    <button id="btn-share" class="toolbar-btn toolbar-btn--primary">Share</button>
    <button id="btn-reset" class="toolbar-btn toolbar-btn--danger">Reset All</button>
  `;
  if (nav) nav.appendChild(toolbar);

  document.getElementById("btn-export").addEventListener("click", () => {
    buildPrintBracket();
    setTimeout(() => {
      window.print();
      // Remove print bracket after printing
      const pb = document.getElementById("print-bracket");
      if (pb) pb.remove();
    }, 100);
  });

  document.getElementById("btn-share").addEventListener("click", async () => {
    // Ensure we have a bracket saved before sharing
    if (!getLocalShareToken()) {
      await savePicks(state.picks);
    }
    const url = getShareURL();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied!");
    } catch {
      // Fallback: prompt
      prompt("Copy this link to share your bracket:", url);
    }
  });

  document.getElementById("btn-reset").addEventListener("click", async () => {
    if (!confirm("Reset all picks? This cannot be undone.")) return;
    await resetBracket();
    resetAllPicks();
    renderBracket();
    renderFirstFour();
    showToast("Bracket reset");
  });

  const regionResetBtn = document.getElementById("btn-reset-region");
  if (regionResetBtn) {
    regionResetBtn.addEventListener("click", () => {
      if (!confirm(`Reset all ${state.activeRegion} picks?`)) return;
      resetRegionPicks(state.activeRegion);
      renderBracket();
      showToast(`${state.activeRegion} picks reset`);
    });
  }
}

/**
 * Shows a bracket name popup. Returns a promise that resolves with the name.
 * Easily dismissed — pressing Enter, clicking Start, or clicking the backdrop.
 */
function showNamePopup() {
  return new Promise((resolve) => {
    const saved = localStorage.getItem("chalkbuster-bracket-name");
    if (saved) {
      state.bracketName = saved;
      resolve(saved);
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "name-overlay";
    overlay.innerHTML = `
      <div class="name-popup">
        <h2>Name Your Bracket</h2>
        <p>Give your bracket a name so you can tell it apart from the pack.</p>
        <input type="text" id="bracket-name-input" class="name-input" placeholder="e.g. TZ's Chalk Destroyer" maxlength="40" autofocus>
        <button id="bracket-name-go" class="name-btn">Let's Go</button>
        <p class="name-skip">Press Enter or click anywhere outside to skip</p>
      </div>
    `;

    function finish() {
      const input = document.getElementById("bracket-name-input");
      const name = input ? input.value.trim() : "";
      state.bracketName = name || "My Bracket";
      localStorage.setItem("chalkbuster-bracket-name", state.bracketName);
      overlay.remove();
      resolve(state.bracketName);
    }

    document.body.appendChild(overlay);

    // Focus input after animation
    requestAnimationFrame(() => {
      overlay.classList.add("visible");
      document.getElementById("bracket-name-input").focus();
    });

    // Enter key
    document
      .getElementById("bracket-name-input")
      .addEventListener("keydown", (e) => {
        if (e.key === "Enter") finish();
      });

    // Button click
    document
      .getElementById("bracket-name-go")
      .addEventListener("click", finish);

    // Backdrop click dismisses
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) finish();
    });
  });
}

/**
 * Updates the bracket name in the page header.
 */
function updateHeaderName() {
  let wrapper = document.getElementById("hero-bracket-name-wrapper");
  if (!wrapper) {
    const hero = document.querySelector(".hero-text");
    if (!hero) return;
    wrapper = document.createElement("div");
    wrapper.id = "hero-bracket-name-wrapper";
    wrapper.className = "hero-bracket-name-wrapper";
    hero.appendChild(wrapper);
  }
  const nameText = state.bracketName || "My Bracket";
  wrapper.innerHTML = `
    <span class="hero-bracket-name">${nameText}</span>
    ${!state.readOnly ? '<button class="rename-btn" id="btn-rename" title="Rename bracket">&#9998;</button>' : ""}
  `;
  const renameBtn = document.getElementById("btn-rename");
  if (renameBtn) {
    renameBtn.addEventListener("click", () => {
      const newName = prompt("Rename your bracket:", state.bracketName);
      if (newName !== null) {
        state.bracketName = newName.trim() || "My Bracket";
        localStorage.setItem("chalkbuster-bracket-name", state.bracketName);
        updateHeaderName();
      }
    });
  }
}

function isTipoffReached() {
  // Tipoff: Thursday March 19, 2026 at 12:00 PM Eastern Time
  const tipoff = new Date("2026-03-19T16:00:00Z"); // noon ET = 16:00 UTC
  return Date.now() >= tipoff.getTime();
}

function showTipoffGate() {
  const overlay = document.createElement("div");
  overlay.id = "tipoff-gate";
  overlay.innerHTML = `
    <div class="tipoff-content">
      <div class="tipoff-icon">&#127936;</div>
      <h2>Picks Revealed at Tipoff</h2>
      <p>This bracket will be visible on<br><strong>Thursday, March 19 at 12:00 PM ET</strong></p>
      <p class="tipoff-sub">Check back when the games begin!</p>
    </div>
  `;
  document.getElementById("app").appendChild(overlay);
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

async function init() {
  try {
    const [teamsData, bracketData, ffData] = await Promise.all([
      fetch("./data/teams.json").then((r) => r.json()),
      fetch("./data/bracket.json").then((r) => r.json()),
      fetch("./data/first_four.json").then((r) => r.json()),
    ]);

    state.teams = teamsData.teams;
    state.slots = bracketData.slots;
    state.firstFour = ffData.first_four;

    // Check if this is a shared bracket view
    const sharedToken = getSharedToken();
    if (sharedToken) {
      const sharedPicks = await loadSharedBracket(sharedToken);
      if (sharedPicks) {
        if (!isTipoffReached()) {
          // Hide picks until tipoff -- show gate message
          state.readOnly = true;
          state.tipoffGated = true;
          // picks are NOT loaded into state -- bracket renders empty
        } else {
          state.picks = sharedPicks;
          state.readOnly = true;
        }
      } else {
        showToast("Shared bracket not found");
        loadPicksFromStorage();
      }
    } else {
      // Try loading from Supabase first, fall back to localStorage
      const saved = await loadBracket();
      if (saved) {
        state.picks = saved.picks;
        // Sync to localStorage as backup
        localStorage.setItem(
          "chalkbuster-picks-v1",
          JSON.stringify(saved.picks),
        );
      } else {
        loadPicksFromStorage();
      }

      // Wire up auto-save to Supabase on every pick change
      setOnPicksChanged((picks) => savePicks(picks));
    }

    // Show name popup on first visit (skips if name already saved)
    if (!state.readOnly) {
      await showNamePopup();
    }
    updateHeaderName();

    // Render UI — tabs first, then toolbar appends into the tab bar
    renderRegionTabs();
    renderToolbar();
    document.addEventListener("chalkbuster:regionchange", () =>
      renderToolbar(),
    );
    renderBracket();
    if (state.tipoffGated) {
      showTipoffGate();
    }
    renderFirstFour();
    initBracketHandlers();
    await loadMatchups();
    initAnalysisHandlers();
  } catch (err) {
    console.error("[ChalkBuster] init failed:", err);
    document.getElementById("app").textContent =
      "Failed to load bracket data. Is the dev server running? Try: python3 -m http.server 8000";
  }
}

init();
