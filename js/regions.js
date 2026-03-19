// js/regions.js
// Region tab renderer and switcher.
// Imports state only.

import { state } from "./state.js";

const REGIONS = [
  "East",
  "South",
  "West",
  "Midwest",
  "Final Four",
  "First Four",
  "How To",
];

export function renderRegionTabs() {
  const nav = document.getElementById("region-tabs");
  if (!nav) return;
  nav.innerHTML = "";

  REGIONS.forEach((region, i) => {
    // Insert a spacer before the utility tabs
    if (region === "First Four") {
      const sep = document.createElement("div");
      sep.className = "tab-separator";
      nav.appendChild(sep);
    }

    const btn = document.createElement("button");
    btn.className = "tab-btn";
    if (region === "First Four" || region === "How To")
      btn.classList.add("tab-btn--subtle");
    btn.dataset.region = region;
    btn.textContent = region;

    if (region === state.activeRegion) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      if (state.activeRegion === region) return;
      state.activeRegion = region;

      document.dispatchEvent(new CustomEvent("chalkbuster:regionchange"));

      nav.querySelectorAll(".tab-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.region === region);
      });

      const container = document.getElementById("bracket-container");
      const ffPanel = document.getElementById("first-four-panel");
      const howTo = document.getElementById("instructions-panel");

      // Hide all panels first
      if (container) {
        container
          .querySelectorAll(".bracket-region")
          .forEach((el) => el.classList.remove("active"));
      }
      if (ffPanel) ffPanel.style.display = "none";
      if (howTo) howTo.style.display = "none";

      // Show the right one
      if (region === "Final Four") {
        container
          .querySelectorAll(
            '[data-region="FinalFour"], [data-region="Championship"]',
          )
          .forEach((el) => el.classList.add("active"));
      } else if (region === "First Four") {
        if (ffPanel) ffPanel.style.display = "block";
      } else if (region === "How To") {
        if (howTo) howTo.style.display = "block";
      } else {
        const target = container.querySelector(`[data-region="${region}"]`);
        if (target) target.classList.add("active");
      }
    });

    nav.appendChild(btn);
  });
}
