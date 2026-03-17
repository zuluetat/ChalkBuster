// js/regions.js
// Region tab renderer and switcher.
// Imports state only.

import { state } from "./state.js";

const REGIONS = ["East", "South", "Midwest", "West", "Final Four"];

/**
 * Renders region tab buttons into #region-tabs and attaches click handlers.
 * Buttons control which .bracket-region div is visible.
 */
export function renderRegionTabs() {
  const nav = document.getElementById("region-tabs");
  if (!nav) return;
  nav.innerHTML = "";

  REGIONS.forEach(region => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    // Use the data-region value that matches bracket-region data-region attributes.
    // "Final Four" tab maps to the "FinalFour" and "Championship" region elements.
    btn.dataset.region = region;
    btn.textContent = region;

    if (region === state.activeRegion) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      if (state.activeRegion === region) return; // Already active

      // Update active region in state
      state.activeRegion = region;

      // Update tab button active states
      nav.querySelectorAll(".tab-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.region === region);
      });

      // Show/hide bracket region elements
      const container = document.getElementById("bracket-container");
      if (!container) return;

      container.querySelectorAll(".bracket-region").forEach(el => {
        el.classList.remove("active");
      });

      if (region === "Final Four") {
        // Show both FinalFour and Championship regions together
        container.querySelectorAll(
          '[data-region="FinalFour"], [data-region="Championship"]'
        ).forEach(el => el.classList.add("active"));
      } else {
        const target = container.querySelector(`[data-region="${region}"]`);
        if (target) target.classList.add("active");
      }
    });

    nav.appendChild(btn);
  });
}
