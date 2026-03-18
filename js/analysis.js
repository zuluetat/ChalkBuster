// js/analysis.js
// Analysis card overlay: loads matchups.json, renders side-by-side analysis cards.
// Imports from state.js only. NEVER imports from app.js or bracket.js.

import { state, setPick } from "./state.js";

let matchups = {};
let scenarios = {};
let realStats = {};
let currentSlotId = null;
let roundSlotIds = [];

/** Metric definitions: name, description, why it matters */
const METRIC_DEFS = {
  srs: {
    label: "SRS",
    def: "Simple Rating System — margin of victory adjusted for strength of schedule (Sports Reference verified).",
    why: "The single best number for overall team quality. A +30 team is elite; a negative team is weak.",
  },
  last_10: {
    label: "Last 10",
    def: "Win-loss record over the team's last 10 games entering the tournament.",
    why: "Shows recent momentum. A team peaking at the right time (8-2 or better) is dangerous regardless of seed.",
  },
  sos_sr: {
    label: "SOS",
    def: "Strength of Schedule — average opponent quality (Sports Reference). Higher = tougher schedule.",
    why: "Context for the record. A 25-6 team with a +12 SOS faced real competition; a team with -5 SOS did not.",
  },
  ortg: {
    label: "ORtg",
    def: "Offensive Rating — points scored per 100 possessions (raw, not opponent-adjusted).",
    why: "Measures pure offensive firepower. Elite offenses (120+) can outscore anyone on a good night.",
  },
  pace: {
    label: "Pace",
    def: "Estimated possessions per 40 minutes.",
    why: "Tempo defines style. Fast teams (72+) push transition; slow teams (65-) grind halfcourt. Mismatches in pace create upsets.",
  },
  efg_pct: {
    label: "eFG%",
    def: "Effective Field Goal % — adjusts FG% to account for 3-pointers being worth 50% more than 2s.",
    why: "The #1 Four Factor. Shot quality matters more than volume — this tells you if a team makes good shots.",
  },
  tov_pct: {
    label: "TO%",
    def: "Turnover Rate — turnovers committed per 100 possessions. Lower is better.",
    why: "You can't score if you give it away. High TO% teams (20%+) are vulnerable to pressure defense.",
  },
  orb_pct: {
    label: "OR%",
    def: "Offensive Rebound % — percentage of missed shots the team rebounds on offense.",
    why: "Second chances extend possessions. Elite rebounding teams (35%+) get extra shots others don't.",
  },
  ftr: {
    label: "FTR",
    def: "Free Throw Rate — free throw attempts per field goal attempt.",
    why: "Getting to the line means drawing fouls and getting easy points. Also puts opponents in foul trouble.",
  },
};

/** Format a metric value for display */
function fmtMetric(key, value) {
  if (value == null || value === "UNVERIFIED") return "—";
  switch (key) {
    case "efg_pct":
      return (value * 100).toFixed(1) + "%";
    case "ftr":
      return value.toFixed(3);
    case "srs":
      return (value >= 0 ? "+" : "") + value.toFixed(1);
    case "sos_sr":
      return (value >= 0 ? "+" : "") + value.toFixed(1);
    case "pace":
    case "ortg":
      return value.toFixed(1);
    default:
      return String(value);
  }
}

export async function loadMatchups() {
  const [matchupData, scenarioData, statsData] = await Promise.all([
    fetch("./data/matchups.json").then((r) => r.json()),
    fetch("./data/scenario_matchups.json")
      .then((r) => r.json())
      .catch(() => ({})),
    fetch("./data/real_stats_2026.json")
      .then((r) => r.json())
      .catch(() => ({ teams: {} })),
  ]);
  matchups = matchupData.matchups;
  // Index scenarios by key for O(1) lookup
  if (Array.isArray(scenarioData)) {
    scenarioData.forEach((s) => {
      scenarios[s.key] = s;
    });
  } else if (scenarioData.scenarios) {
    scenarioData.scenarios.forEach((s) => {
      scenarios[s.key] = s;
    });
  }
  realStats = statsData.teams || {};
}

/** Build metrics object for a team from real_stats_2026 data */
function buildMetricsFromStats(teamId) {
  const sr = realStats[teamId];
  if (!sr) return null;
  return {
    srs: sr.srs,
    ortg: sr.ortg,
    pace: sr.pace,
    last_10: sr.last_10 || null,
    sos_sr: sr.sos,
    efg_pct: sr.efg_pct,
    tov_pct: sr.tov_pct,
    orb_pct: sr.orb_pct,
    ftr: sr.ftr,
  };
}

/** Generate template-based pros from verified stats */
function generatePros(teamId) {
  const sr = realStats[teamId];
  if (!sr)
    return ["No stats available", "No stats available", "No stats available"];
  const pros = [];
  if (sr.srs >= 25)
    pros.push(
      `Elite SRS of +${sr.srs.toFixed(1)} — championship-tier efficiency`,
    );
  else if (sr.srs >= 18)
    pros.push(`Strong SRS of +${sr.srs.toFixed(1)} — competitive at any level`);
  else pros.push(`SRS of +${sr.srs.toFixed(1)} — solid but not elite`);
  if (sr.efg_pct >= 0.55)
    pros.push(
      `Excellent shooting efficiency (${(sr.efg_pct * 100).toFixed(1)}% eFG)`,
    );
  else if (sr.ortg >= 115)
    pros.push(
      `Strong offense at ${sr.ortg.toFixed(1)} points per 100 possessions`,
    );
  else pros.push(`${sr.record} record shows consistency`);
  if (sr.orb_pct >= 35)
    pros.push(
      `Elite offensive rebounding at ${sr.orb_pct.toFixed(1)}% — second chances`,
    );
  else if (sr.ftr >= 0.35)
    pros.push(`Gets to the free throw line (${sr.ftr.toFixed(3)} FTR)`);
  else if (sr.tov_pct <= 13)
    pros.push(
      `Protects the ball well (${sr.tov_pct.toFixed(1)}% turnover rate)`,
    );
  else pros.push(`Balanced pace at ${sr.pace.toFixed(1)} possessions per game`);
  return pros;
}

/** Generate template-based cons from verified stats */
function generateCons(teamId) {
  const sr = realStats[teamId];
  if (!sr)
    return ["No stats available", "No stats available", "No stats available"];
  const cons = [];
  if (sr.sos < 5)
    cons.push(
      `Weak schedule (SOS ${sr.sos.toFixed(1)}) — untested against top competition`,
    );
  else if (sr.srs < 20)
    cons.push(`SRS of +${sr.srs.toFixed(1)} leaves a gap against elite teams`);
  else cons.push(`${sr.record} includes losses to quality opponents`);
  if (sr.tov_pct >= 16)
    cons.push(
      `High turnover rate (${sr.tov_pct.toFixed(1)}%) — vulnerable to pressure`,
    );
  else if (sr.efg_pct < 0.52)
    cons.push(`Below-average shooting (${(sr.efg_pct * 100).toFixed(1)}% eFG)`);
  else cons.push(`Pace of ${sr.pace.toFixed(1)} may create tempo mismatches`);
  if (sr.ftr < 0.28)
    cons.push(
      `Low free throw rate (${sr.ftr.toFixed(3)}) — doesn't draw fouls`,
    );
  else if (sr.orb_pct < 30)
    cons.push(
      `Weak offensive rebounding (${sr.orb_pct.toFixed(1)}%) — one-shot offense`,
    );
  else
    cons.push(`Schedule strength (SOS ${sr.sos.toFixed(1)}) may inflate stats`);
  return cons;
}

/** Build a synthetic matchup from scenario data or template engine */
function buildSyntheticMatchup(slotId, topTeamId, botTeamId, round, region) {
  const key = [topTeamId, botTeamId].sort().join(":");
  const scenario = scenarios[key];

  const topMetrics = buildMetricsFromStats(topTeamId);
  const botMetrics = buildMetricsFromStats(botTeamId);
  const topSrs = topMetrics?.srs || 0;
  const botSrs = botMetrics?.srs || 0;
  const srsDiff = topSrs - botSrs;
  const topWinProb = Math.min(
    0.99,
    Math.max(0.01, 1 / (1 + Math.pow(10, -srsDiff / 10))),
  );

  if (scenario) {
    // Use AI-generated prose from scenario file
    const isFlipped = scenario.team_a !== topTeamId;
    return {
      slot_id: slotId,
      round,
      region,
      team_top: topTeamId,
      team_bot: botTeamId,
      metrics: { top: topMetrics, bot: botMetrics },
      pros: {
        top: isFlipped ? scenario.pros_b : scenario.pros_a,
        bot: isFlipped ? scenario.pros_a : scenario.pros_b,
      },
      cons: {
        top: isFlipped ? scenario.cons_b : scenario.cons_a,
        bot: isFlipped ? scenario.cons_a : scenario.cons_b,
      },
      recommendation: {
        team: scenario.recommendation,
        confidence: scenario.confidence,
      },
      reasoning: scenario.reasoning,
      win_prob: {
        top: isFlipped ? 1 - scenario.win_prob_a : scenario.win_prob_a,
        bot: isFlipped ? scenario.win_prob_a : 1 - scenario.win_prob_a,
      },
      upset_alert: scenario.upset_alert || false,
      contrarian: false,
      public_consensus_team: null,
    };
  }

  // Template fallback — no AI prose, computed from stats
  const topTeam = state.teams[topTeamId];
  const botTeam = state.teams[botTeamId];
  const topName = topTeam?.name || topTeamId;
  const botName = botTeam?.name || botTeamId;
  const gap = Math.abs(srsDiff).toFixed(1);
  const favName = srsDiff >= 0 ? topName : botName;
  const dogName = srsDiff >= 0 ? botName : topName;
  const confidence =
    Math.abs(topWinProb - 0.5) > 0.15
      ? Math.abs(topWinProb - 0.5) > 0.3
        ? "High"
        : "Medium"
      : "Low";

  return {
    slot_id: slotId,
    round,
    region,
    team_top: topTeamId,
    team_bot: botTeamId,
    metrics: { top: topMetrics, bot: botMetrics },
    pros: {
      top: generatePros(topTeamId),
      bot: generatePros(botTeamId),
    },
    cons: {
      top: generateCons(topTeamId),
      bot: generateCons(botTeamId),
    },
    recommendation: {
      team: srsDiff >= 0 ? topTeamId : botTeamId,
      confidence,
    },
    reasoning: `${favName} holds a +${gap} SRS edge over ${dogName}. ${Math.abs(topMetrics?.pace - botMetrics?.pace) > 4 ? "A significant pace differential (" + topMetrics?.pace?.toFixed(1) + " vs " + botMetrics?.pace?.toFixed(1) + ") could create tempo pressure." : "Similar pace profiles suggest a straight efficiency battle."}`,
    win_prob: {
      top: +topWinProb.toFixed(2),
      bot: +(1 - topWinProb).toFixed(2),
    },
    upset_alert: (topWinProb < 0.5 ? topWinProb : 1 - topWinProb) > 0.3,
    contrarian: false,
    public_consensus_team: null,
  };
}

function getRoundSlotIds(slotId) {
  const matchup = matchups[slotId];
  if (!matchup) return [slotId];
  const round = matchup.round;
  return Object.keys(matchups)
    .filter((id) => matchups[id].round === round)
    .sort();
}

function metricRow(key, value) {
  const def = METRIC_DEFS[key];
  if (!def) return "";
  return `
    <div class="metric">
      <span class="label">${def.label}
        <button class="metric-info-btn" data-metric="${key}" aria-label="What is ${def.label}?">?</button>
      </span>
      <span class="value">${fmtMetric(key, value)}</span>
    </div>`;
}

/**
 * Draws the Trapezoid of Excellence: scatterplot of Pace (x) vs SRS/AdjEM (y).
 * All 64 tournament teams shown as gray dots. The two matchup teams are highlighted.
 * The trapezoid zone is drawn showing the championship contender region.
 */
function drawTrapezoid(canvasId, topMetrics, botMetrics, topName, botName) {
  requestAnimationFrame(() => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 400 * dpr;
    canvas.height = 360 * dpr;
    canvas.style.width = "400px";
    canvas.style.height = "360px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = 400,
      H = 360;

    // Chart area with margins
    const margin = { top: 20, right: 20, bottom: 35, left: 45 };
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;

    // Data ranges for axes — tightened to actual tournament team range
    const paceMin = 62,
      paceMax = 76;
    const emMin = -12,
      emMax = 35;

    function xPos(pace) {
      return margin.left + ((pace - paceMin) / (paceMax - paceMin)) * cw;
    }
    function yPos(em) {
      return margin.top + ((emMax - em) / (emMax - emMin)) * ch;
    }

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#12122a";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = 0.5;
    for (let p = 62; p <= 76; p += 2) {
      ctx.beginPath();
      ctx.moveTo(xPos(p), margin.top);
      ctx.lineTo(xPos(p), H - margin.bottom);
      ctx.stroke();
    }
    for (let e = -10; e <= 35; e += 5) {
      ctx.beginPath();
      ctx.moveTo(margin.left, yPos(e));
      ctx.lineTo(W - margin.right, yPos(e));
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = "#888";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";
    for (let p = 62; p <= 76; p += 2) {
      ctx.fillText(p, xPos(p), H - margin.bottom + 14);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let e = -10; e <= 35; e += 5) {
      ctx.fillText(e >= 0 ? "+" + e : e, margin.left - 6, yPos(e));
    }

    // Axis titles
    ctx.fillStyle = "#aaa";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Pace (possessions/40 min)", W / 2, H - 3);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("SRS (Net Efficiency)", 0, 0);
    ctx.restore();

    // Draw the Trapezoid of Excellence zone (v3 model)
    // Calibrated to Hammer's 2026 data: ~8 teams inside, floor at SRS +25.
    // AdjEM is primary gate; tempo is secondary (wider at top, narrower at bottom).
    const trapTop = emMax + 2;
    const trapFloor = 25; // v3: Gonzaga (25.11) is lowest confirmed inside team
    ctx.beginPath();
    ctx.moveTo(xPos(60), yPos(trapTop));
    ctx.lineTo(xPos(78), yPos(trapTop));
    ctx.lineTo(xPos(73), yPos(trapFloor));
    ctx.lineTo(xPos(65), yPos(trapFloor));
    ctx.closePath();
    ctx.fillStyle = "rgba(34, 197, 94, 0.08)";
    ctx.fill();
    // Draw only the angled sides and bottom (no top edge — it's open)
    ctx.strokeStyle = "rgba(34, 197, 94, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xPos(65), yPos(trapFloor));
    ctx.lineTo(xPos(60), yPos(trapTop));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xPos(73), yPos(trapFloor));
    ctx.lineTo(xPos(78), yPos(trapTop));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(xPos(65), yPos(trapFloor));
    ctx.lineTo(xPos(73), yPos(trapFloor));
    ctx.stroke();
    ctx.setLineDash([]);

    // Label the trapezoid
    ctx.fillStyle = "rgba(34, 197, 94, 0.5)";
    ctx.font = "9px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TRAPEZOID OF EXCELLENCE", xPos(69), yPos(trapFloor + 1.5));

    // Plot all 64 tournament teams as gray dots
    for (const [sid, m] of Object.entries(matchups)) {
      if (m.round !== "R64") continue;
      for (const pos of ["top", "bot"]) {
        const met = m.metrics[pos];
        if (!met || met.pace == null || met.srs == null) continue;
        const px = xPos(met.pace);
        const py = yPos(met.srs);
        if (px < margin.left || px > W - margin.right) continue;
        if (py < margin.top || py > H - margin.bottom) continue;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(150, 150, 170, 0.3)";
        ctx.fill();
      }
    }

    // Highlight the two matchup teams
    function plotTeam(metrics, name, color) {
      if (!metrics || metrics.pace == null || metrics.srs == null) return;
      const px = Math.max(
        margin.left,
        Math.min(W - margin.right, xPos(metrics.pace)),
      );
      const py = Math.max(
        margin.top,
        Math.min(H - margin.bottom, yPos(metrics.srs)),
      );

      // Glow
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = color.replace("1)", "0.2)");
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = color;
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(name, px + 8, py + 3);
    }

    plotTeam(topMetrics, topName, "rgba(59, 130, 246, 1)");
    plotTeam(botMetrics, botName, "rgba(239, 68, 68, 1)");
  });
}

function buildCardHTML(matchup, topTeam, botTeam, slotId) {
  const upsetFlag = matchup.upset_alert
    ? `<span class="flag flag--upset">UPSET ALERT</span>`
    : "";
  const contrarianFlag = matchup.contrarian
    ? `<span class="flag flag--contrarian">CONTRARIAN</span>`
    : "";
  const confidenceLower = matchup.recommendation.confidence.toLowerCase();
  const recTeamName =
    matchup.recommendation.team === topTeam.id ? topTeam.name : botTeam.name;

  const currentPick = state.picks[slotId];
  const topActive = currentPick === topTeam.id ? " active-pick" : "";
  const botActive = currentPick === botTeam.id ? " active-pick" : "";

  const idx = roundSlotIds.indexOf(slotId);
  const total = roundSlotIds.length;
  const prevDisabled = idx <= 0 ? " disabled" : "";
  const nextDisabled = idx >= total - 1 ? " disabled" : "";
  const prevId = idx > 0 ? roundSlotIds[idx - 1] : "";
  const nextId = idx < total - 1 ? roundSlotIds[idx + 1] : "";

  const tm = matchup.metrics.top;
  const bm = matchup.metrics.bot;
  const canvasId = `trapezoid-${slotId}`;

  return `
    <div class="card-header">
      <button class="analysis-close" aria-label="Close">&times;</button>
      <span class="card-round">${matchup.round} &middot; ${matchup.region}</span>
      <div class="card-flags">${upsetFlag}${contrarianFlag}</div>
    </div>
    <div class="card-teams">
      <div class="team-col team-col--top">
        <div class="team-title">
          <span class="seed-badge">${topTeam.seed}</span>
          <span class="team-name">${topTeam.name}</span>
        </div>
        <div class="metrics">
          ${metricRow("srs", tm.srs)}
          ${metricRow("ortg", tm.ortg)}
          ${metricRow("pace", tm.pace)}
          ${metricRow("last_10", tm.last_10)}
          ${metricRow("sos_sr", tm.sos_sr)}
        </div>
        <div class="four-factors-label">Four Factors</div>
        <div class="metrics">
          ${metricRow("efg_pct", tm.efg_pct)}
          ${metricRow("tov_pct", tm.tov_pct)}
          ${metricRow("orb_pct", tm.orb_pct)}
          ${metricRow("ftr", tm.ftr)}
        </div>
        <ul class="pros">${matchup.pros.top.map((p) => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.top.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
      <div class="team-col team-col--bot">
        <div class="team-title">
          <span class="seed-badge">${botTeam.seed}</span>
          <span class="team-name">${botTeam.name}</span>
        </div>
        <div class="metrics">
          ${metricRow("srs", bm.srs)}
          ${metricRow("ortg", bm.ortg)}
          ${metricRow("pace", bm.pace)}
          ${metricRow("last_10", bm.last_10)}
          ${metricRow("sos_sr", bm.sos_sr)}
        </div>
        <div class="four-factors-label">Four Factors</div>
        <div class="metrics">
          ${metricRow("efg_pct", bm.efg_pct)}
          ${metricRow("tov_pct", bm.tov_pct)}
          ${metricRow("orb_pct", bm.orb_pct)}
          ${metricRow("ftr", bm.ftr)}
        </div>
        <ul class="pros">${matchup.pros.bot.map((p) => `<li>${p}</li>`).join("")}</ul>
        <ul class="cons">${matchup.cons.bot.map((c) => `<li>${c}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="card-trapezoid">
      <div class="trapezoid-title">Trapezoid of Excellence</div>
      <canvas id="${canvasId}" width="320" height="280"></canvas>
    </div>
    <div class="card-recommendation">
      <span class="confidence-badge confidence--${confidenceLower}">${matchup.recommendation.confidence} Confidence</span>
      <span class="rec-pick">Pick: ${recTeamName}</span>
      <p class="reasoning">${matchup.reasoning}</p>
    </div>
    <div class="card-pick-actions">
      <button class="card-pick-btn${topActive}" data-team="${topTeam.id}" data-game="${slotId}">
        Pick ${topTeam.name}
      </button>
      <button class="card-pick-btn${botActive}" data-team="${botTeam.id}" data-game="${slotId}">
        Pick ${botTeam.name}
      </button>
    </div>
    <div class="data-disclaimer">
      <p>* Upset alerts and contrarian flags are based on model-estimated win probabilities, not official sportsbook lines. Last-10 records are unverified estimates.</p>
    </div>
    <div class="card-nav">
      <button class="card-nav-btn" data-dir="prev" data-target="${prevId}"${prevDisabled}>&larr; Prev</button>
      <span class="card-nav-label">${idx + 1} / ${total}</span>
      <button class="card-nav-btn" data-dir="next" data-target="${nextId}"${nextDisabled}>Next &rarr;</button>
    </div>
  `;
}

function buildPlaceholderHTML(slotId) {
  const idx = roundSlotIds.indexOf(slotId);
  const total = roundSlotIds.length;
  const prevDisabled = idx <= 0 ? " disabled" : "";
  const nextDisabled = idx >= total - 1 ? " disabled" : "";
  const prevId = idx > 0 ? roundSlotIds[idx - 1] : "";
  const nextId = idx < total - 1 ? roundSlotIds[idx + 1] : "";

  return `
    <div class="card-header">
      <button class="analysis-close" aria-label="Close">&times;</button>
    </div>
    <div class="card-placeholder">
      <p>Pick both teams to see analysis</p>
    </div>
    <div class="card-nav">
      <button class="card-nav-btn" data-dir="prev" data-target="${prevId}"${prevDisabled}>&larr; Prev</button>
      <span class="card-nav-label">${idx + 1} / ${total}</span>
      <button class="card-nav-btn" data-dir="next" data-target="${nextId}"${nextDisabled}>Next &rarr;</button>
    </div>
  `;
}

export function openAnalysisCard(slotId) {
  let matchup = matchups[slotId];
  if (!matchup) return;

  currentSlotId = slotId;
  roundSlotIds = getRoundSlotIds(slotId);

  const panel = document.getElementById("analysis-panel");
  if (!panel) return;

  let topTeam = matchup.team_top ? state.teams[matchup.team_top] : null;
  let botTeam = matchup.team_bot ? state.teams[matchup.team_bot] : null;

  // For non-R64 matchups, teams come from picks, not matchup data
  if (!topTeam || !botTeam) {
    // Check if both teams are determined via picks in feeder games
    const slot = state.slots[slotId];
    if (slot) {
      const resolveWinner = (source) => {
        if (!source || source.type !== "winner") return null;
        const winnerId = state.picks[source.game];
        return winnerId ? state.teams[winnerId] : null;
      };
      if (!topTeam) topTeam = resolveWinner(slot.top);
      if (!botTeam) botTeam = resolveWinner(slot.bot);
    }
  }

  if (!topTeam || !botTeam) {
    panel.innerHTML = buildPlaceholderHTML(slotId);
  } else if (!matchup.metrics?.top || !matchup.metrics?.bot) {
    // Non-R64 matchup with both teams picked — use scenario or template
    const synthetic = buildSyntheticMatchup(
      slotId,
      topTeam.id,
      botTeam.id,
      matchup.round,
      matchup.region,
    );
    panel.innerHTML = buildCardHTML(synthetic, topTeam, botTeam, slotId);
    drawTrapezoid(
      `trapezoid-${slotId}`,
      synthetic.metrics.top,
      synthetic.metrics.bot,
      topTeam.name,
      botTeam.name,
    );
  } else {
    panel.innerHTML = buildCardHTML(matchup, topTeam, botTeam, slotId);
    drawTrapezoid(
      `trapezoid-${slotId}`,
      matchup.metrics.top,
      matchup.metrics.bot,
      topTeam.name,
      botTeam.name,
    );
  }

  document.getElementById("analysis-overlay").classList.add("visible");
}

export function closeAnalysisCard() {
  const overlay = document.getElementById("analysis-overlay");
  if (overlay) overlay.classList.remove("visible");
  currentSlotId = null;
}

function showMetricTooltip(metricKey, btnEl) {
  hideMetricTooltip();
  const def = METRIC_DEFS[metricKey];
  if (!def) return;

  const tip = document.createElement("div");
  tip.className = "metric-tooltip";
  tip.innerHTML = `
    <div class="metric-tooltip-title">${def.label}</div>
    <p class="metric-tooltip-def">${def.def}</p>
    <p class="metric-tooltip-why"><strong>Why it matters:</strong> ${def.why}</p>
  `;

  const metricDiv = btnEl ? btnEl.closest(".metric") : null;
  if (metricDiv) {
    metricDiv.insertAdjacentElement("afterend", tip);
  } else {
    const panel = document.getElementById("analysis-panel");
    panel.appendChild(tip);
  }
}

function hideMetricTooltip() {
  const existing = document.querySelector(".metric-tooltip");
  if (existing) existing.remove();
}

export function initAnalysisHandlers() {
  function notifyPickChanged(gameId) {
    document.dispatchEvent(
      new CustomEvent("chalkbuster:pick", { detail: { gameId } }),
    );
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const tip = document.querySelector(".metric-tooltip");
      if (tip) {
        hideMetricTooltip();
        return;
      }
      closeAnalysisCard();
    }
  });

  const overlay = document.getElementById("analysis-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeAnalysisCard();
    });
  }

  const panel = document.getElementById("analysis-panel");
  if (panel) {
    panel.addEventListener("click", (e) => {
      if (e.target.closest(".analysis-close")) {
        closeAnalysisCard();
        return;
      }

      const infoBtn = e.target.closest(".metric-info-btn");
      if (infoBtn) {
        e.stopPropagation();
        const key = infoBtn.dataset.metric;
        const existing = document.querySelector(".metric-tooltip");
        if (existing) {
          hideMetricTooltip();
          if (existing.dataset.metric === key) return;
        }
        showMetricTooltip(key, infoBtn);
        const tip = document.querySelector(".metric-tooltip");
        if (tip) tip.dataset.metric = key;
        return;
      }

      hideMetricTooltip();

      const pickBtn = e.target.closest(".card-pick-btn");
      if (pickBtn) {
        const gameId = pickBtn.dataset.game;
        const teamId = pickBtn.dataset.team;
        setPick(gameId, teamId);
        notifyPickChanged(gameId);
        openAnalysisCard(gameId);
        return;
      }

      const navBtn = e.target.closest(".card-nav-btn");
      if (navBtn && !navBtn.disabled) {
        const target = navBtn.dataset.target;
        if (target) openAnalysisCard(target);
        return;
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (!currentSlotId) return;
    if (e.key === "ArrowLeft") {
      const idx = roundSlotIds.indexOf(currentSlotId);
      if (idx > 0) openAnalysisCard(roundSlotIds[idx - 1]);
    } else if (e.key === "ArrowRight") {
      const idx = roundSlotIds.indexOf(currentSlotId);
      if (idx < roundSlotIds.length - 1)
        openAnalysisCard(roundSlotIds[idx + 1]);
    }
  });
}
