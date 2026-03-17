// ChalkBuster bracket integrity validator
// Usage: import('./validate.js').then(m => m.validateBracketSlotGraph(state))
// Run from browser console after init() to verify schema integrity.

/**
 * Validates the bracket slot graph structure against known invariants.
 * @param {Object} state - App state with { slots, teams, firstFour }
 * @returns {boolean} true if all checks pass, false otherwise
 */
export function validateBracketSlotGraph(state) {
  const errors = [];

  // 1. Verify slot count
  const slotCount = Object.keys(state.slots).length;
  if (slotCount !== 63) {
    errors.push(`Expected 63 slots, found ${slotCount}`);
  }

  // 2. Verify Final Four pairings: East vs West (FF1), South vs Midwest (FF2)
  const ff1 = state.slots["FF1"];
  const ff2 = state.slots["FF2"];
  if (ff1?.top?.game !== "E15") errors.push("FF1 top should be E15 (East champ)");
  if (ff1?.bot?.game !== "W15") errors.push("FF1 bot should be W15 (West champ)");
  if (ff2?.top?.game !== "S15") errors.push("FF2 top should be S15 (South champ)");
  if (ff2?.bot?.game !== "M15") errors.push("FF2 bot should be M15 (Midwest champ)");

  // 3. Verify First Four destination slots use first_four source type (not seed)
  const ffSlots = ["M1", "M5", "S1", "W5"];
  ffSlots.forEach(id => {
    const slot = state.slots[id];
    const hasFF = slot?.top?.type === "first_four" || slot?.bot?.type === "first_four";
    if (!hasFF) errors.push(`${id} should have a first_four source`);
  });

  // 4. Verify R32 slots use winner sources (not seed or first_four)
  ["E9", "E10", "E11", "E12"].forEach(id => {
    const slot = state.slots[id];
    if (slot?.top?.type !== "winner") errors.push(`${id} top should be winner type`);
    if (slot?.bot?.type !== "winner") errors.push(`${id} bot should be winner type`);
  });

  // 5. Verify team count
  const teamCount = Object.keys(state.teams).length;
  if (teamCount !== 68) {
    errors.push(`Expected 68 teams, found ${teamCount}`);
  }

  // 6. Verify required fields on every team
  const requiredTeamFields = ["id", "name", "seed", "region", "record", "kenpom_adjEM", "sos_rank", "public_pick_pct", "spread"];
  const teamsWithMissingFields = Object.values(state.teams).filter(
    t => !requiredTeamFields.every(f => f in t)
  );
  if (teamsWithMissingFields.length > 0) {
    errors.push(`${teamsWithMissingFields.length} team(s) missing required fields: ${teamsWithMissingFields.map(t => t.id).join(", ")}`);
  }

  // 7. Verify First Four game count
  const ffCount = Object.keys(state.firstFour).length;
  if (ffCount !== 4) {
    errors.push(`Expected 4 First Four games, found ${ffCount}`);
  }

  if (errors.length === 0) {
    console.log("[ChalkBuster] Bracket slot graph validation: PASSED");
    return true;
  } else {
    console.error("[ChalkBuster] Bracket slot graph validation: FAILED");
    errors.forEach(e => console.error(" -", e));
    return false;
  }
}

/**
 * Runs full data integrity checks across all three data files.
 * Calls validateBracketSlotGraph and also cross-checks that every
 * first_four game's feeds_game value exists in state.slots.
 * @param {Object} state - App state with { slots, teams, firstFour }
 * @returns {boolean} true if all checks pass, false otherwise
 */
export function runDataIntegrityChecks(state) {
  const slotGraphValid = validateBracketSlotGraph(state);

  // Cross-check: every First Four feeds_game must reference a real slot
  const crossErrors = [];
  Object.values(state.firstFour).forEach(game => {
    if (!state.slots[game.feeds_game]) {
      crossErrors.push(`First Four game ${game.id} references feeds_game "${game.feeds_game}" which does not exist in slots`);
    }
  });

  if (crossErrors.length > 0) {
    console.error("[ChalkBuster] Data integrity cross-checks: FAILED");
    crossErrors.forEach(e => console.error(" -", e));
    return false;
  }

  if (slotGraphValid) {
    console.log("[ChalkBuster] All data integrity checks: PASSED");
  }

  return slotGraphValid && crossErrors.length === 0;
}
