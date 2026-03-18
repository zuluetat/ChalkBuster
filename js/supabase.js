// js/supabase.js
// Supabase persistence: auto-save picks, load on return, share links.
// Uses the REST API directly — no SDK needed.

const SUPABASE_URL = "https://osayanpbjyndsnyxdwzh.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zYXlhbnBianluZHNueXhkd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTA0MDcsImV4cCI6MjA4OTM2NjQwN30.e62mjOD4RrAemqbgMKwKJG__6SVDTBmJ4Y7x5D2-SBA";
const API = `${SUPABASE_URL}/rest/v1/brackets`;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

/** Get the bracket ID stored in localStorage (null if none). */
function getLocalBracketId() {
  return localStorage.getItem("chalkbuster-bracket-id");
}

/** Store the bracket ID in localStorage. */
function setLocalBracketId(id) {
  localStorage.setItem("chalkbuster-bracket-id", id);
}

/** Get the share token from localStorage. */
export function getLocalShareToken() {
  return localStorage.getItem("chalkbuster-share-token");
}

function setLocalShareToken(token) {
  localStorage.setItem("chalkbuster-share-token", token);
}

/**
 * Check if the current page is a shared read-only view.
 * Returns the share_token from the URL query param, or null.
 */
export function getSharedToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("share") || null;
}

/**
 * Load a shared bracket by share_token (read-only).
 * Returns the picks object or null if not found.
 */
export async function loadSharedBracket(shareToken) {
  try {
    const res = await fetch(
      `${API}?share_token=eq.${encodeURIComponent(shareToken)}&select=picks`,
      { headers },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows.length > 0 ? rows[0].picks : null;
  } catch (e) {
    console.warn("[ChalkBuster] Failed to load shared bracket:", e);
    return null;
  }
}

/**
 * Load the user's own bracket from Supabase.
 * Returns { picks, shareToken } or null if no saved bracket.
 */
export async function loadBracket() {
  const id = getLocalBracketId();
  if (!id) return null;

  try {
    const res = await fetch(
      `${API}?id=eq.${encodeURIComponent(id)}&select=picks,share_token`,
      { headers },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length === 0) return null;
    setLocalShareToken(rows[0].share_token);
    return { picks: rows[0].picks, shareToken: rows[0].share_token };
  } catch (e) {
    console.warn("[ChalkBuster] Failed to load bracket:", e);
    return null;
  }
}

/**
 * Create a new bracket in Supabase. Returns { id, shareToken }.
 */
async function createBracket(picks) {
  const res = await fetch(API, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ picks }),
  });
  const rows = await res.json();
  const row = rows[0];
  setLocalBracketId(row.id);
  setLocalShareToken(row.share_token);
  return { id: row.id, shareToken: row.share_token };
}

/**
 * Update the existing bracket's picks in Supabase.
 */
async function updateBracket(id, picks) {
  await fetch(`${API}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({ picks, updated_at: new Date().toISOString() }),
  });
}

/**
 * Save picks to Supabase (debounced externally).
 * Creates a new bracket if none exists, otherwise updates.
 */
export async function savePicks(picks) {
  try {
    const id = getLocalBracketId();
    if (!id) {
      await createBracket(picks);
    } else {
      await updateBracket(id, picks);
    }
  } catch (e) {
    console.warn("[ChalkBuster] Failed to save picks:", e);
  }
}

/**
 * Reset the bracket: delete from Supabase and clear localStorage.
 */
export async function resetBracket() {
  const id = getLocalBracketId();
  if (id) {
    try {
      await fetch(`${API}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers,
      });
    } catch (e) {
      console.warn("[ChalkBuster] Failed to delete bracket:", e);
    }
  }
  localStorage.removeItem("chalkbuster-bracket-id");
  localStorage.removeItem("chalkbuster-share-token");
  localStorage.removeItem("chalkbuster-picks-v1");
}

/**
 * Load a bracket by its Supabase ID and claim it on this device.
 * Sets localStorage so future saves go to this bracket.
 * Returns { picks, shareToken } or null if not found.
 */
export async function loadBracketById(bracketId) {
  try {
    const res = await fetch(
      `${API}?id=eq.${encodeURIComponent(bracketId)}&select=picks,share_token`,
      { headers },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length === 0) return null;
    // Claim this bracket on this device
    setLocalBracketId(bracketId);
    setLocalShareToken(rows[0].share_token);
    return { picks: rows[0].picks, shareToken: rows[0].share_token };
  } catch (e) {
    console.warn("[ChalkBuster] Failed to load bracket by ID:", e);
    return null;
  }
}

/**
 * Get the shareable URL for the current bracket.
 */
export function getShareURL() {
  const token = getLocalShareToken();
  if (!token) return null;
  const base = window.location.origin + window.location.pathname;
  return `${base}?share=${token}`;
}

/**
 * Get the edit URL for the current bracket (full edit access from any device).
 */
export function getEditURL() {
  const id = getLocalBracketId();
  if (!id) return null;
  const base = window.location.origin + window.location.pathname;
  return `${base}?edit=${id}`;
}
