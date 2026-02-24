// /js/features/settings-city.js
import { $ } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/store.js";

const WEATHER_KEY = "home.weather.v1";

function defaultWeatherPrefs() {
  return {
    name: "Seattle, WA, United States",
    lat: 47.6062,
    lon: -122.3321,
    tz: "America/Los_Angeles",
  };
}

function getWeatherPrefs() {
  const prefs = loadJSON(WEATHER_KEY, null);
  if (prefs && typeof prefs === "object" && typeof prefs.lat === "number" && typeof prefs.lon === "number") {
    return {
      name: prefs.name || defaultWeatherPrefs().name,
      lat: prefs.lat,
      lon: prefs.lon,
      tz: prefs.tz || defaultWeatherPrefs().tz,
    };
  }
  return defaultWeatherPrefs();
}

function setCityPill() {
  const pill = $("#currentCityPill");
  if (!pill) return;
  const prefs = getWeatherPrefs();
  pill.textContent = (prefs.name || "Weather").split(",")[0].trim() || "Weather";
}

function escAttr(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function searchCities(q) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(q)}` +
    `&count=8&language=en&format=json`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

function renderCityResults(results) {
  const root = $("#cityResults");
  if (!root) return;

  if (!results.length) {
    root.innerHTML = `<div class="panel-sub">No results.</div>`;
    return;
  }

  root.innerHTML = results
    .map((r) => {
      const full = [r.name, r.admin1, r.country].filter(Boolean).join(", ") || "Unknown";
      const shown = full.split(",")[0].trim();
      const payload = JSON.stringify({
        name: full,
        lat: r.latitude,
        lon: r.longitude,
        tz: r.timezone,
      });

      return `
        <button class="ghostbtn" type="button" data-city="${escAttr(payload)}"
          style="width:100%; text-align:left; display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:10px;">
          <span style="font-weight:650;">${escAttr(shown)}</span>
          <span style="font-size:12px; color:var(--muted);">${escAttr([r.admin1, r.country].filter(Boolean).join(", "))}</span>
        </button>
      `;
    })
    .join("");

  root.querySelectorAll("button[data-city]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.getAttribute("data-city"));
      saveJSON(WEATHER_KEY, data);
      setCityPill();
      root.innerHTML = `<div class="panel-sub">Saved.</div>`;
    });
  });
}

export function initSettingsCity() {
  const form = $("#cityForm");
  const input = $("#cityInput");
  const results = $("#cityResults");

  if (!form || !input || !results) return;

  setCityPill();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = (input.value || "").trim();
    if (!q) return;

    results.innerHTML = `<div class="panel-sub">Searching…</div>`;

    try {
      const found = await searchCities(q);
      renderCityResults(found);
    } catch {
      results.innerHTML = `<div class="panel-sub">Search failed.</div>`;
    }
  });
}