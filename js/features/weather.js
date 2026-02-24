import { $ } from "../lib/dom.js";
import { loadJSON } from "../lib/store.js";

const WEATHER_KEY = "home.weather.v1";

function defaultWeatherPrefs() {
  return { name: "Seattle, WA, United States", lat: 47.6062, lon: -122.3321, tz: "America/Los_Angeles" };
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

function wxFromCode(code) {
  if (code === 0) return { e: "☀️", d: "Clear" };
  if (code === 1 || code === 2) return { e: "🌤️", d: "Partly cloudy" };
  if (code === 3) return { e: "☁️", d: "Cloudy" };
  if (code === 45 || code === 48) return { e: "🌫️", d: "Fog" };
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { e: "🌧️", d: "Rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { e: "🌨️", d: "Snow" };
  if ([95, 96, 99].includes(code)) return { e: "⛈️", d: "Thunderstorms" };
  return { e: "⛅️", d: "Weather" };
}

export function initWeather() {
  const cityPill = $("#weatherCity");
  const tempEl = $("#wxTemp");
  const descEl = $("#wxDesc");
  const emojiEl = $("#wxEmoji");
  const miniEl = $("#wxMini");

  if (!cityPill && !tempEl && !descEl && !emojiEl && !miniEl) return;

  async function loadWeather() {
    const prefs = getWeatherPrefs();
    if (cityPill) {
      const label = (prefs.name || "Weather").split(",")[0].trim();
      cityPill.textContent = label || "Weather";
    }

    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${prefs.lat}&longitude=${prefs.lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
      `&timezone=${encodeURIComponent(prefs.tz || "America/Los_Angeles")}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();

      const cur = data.current;
      const daily = data.daily;

      const t = Math.round(cur.temperature_2m);
      const feels = Math.round(cur.apparent_temperature);
      const wind = Math.round(cur.wind_speed_10m);
      const wx = wxFromCode(cur.weather_code);

      const hi = Math.round(daily.temperature_2m_max?.[0]);
      const lo = Math.round(daily.temperature_2m_min?.[0]);

      if (tempEl) tempEl.textContent = `${t}°`;
      if (emojiEl) emojiEl.textContent = wx.e;
      if (descEl) descEl.textContent = `${wx.d} • Feels like ${feels}°`;

      if (miniEl) {
        miniEl.innerHTML = `
          <span class="weather-chip">H: ${hi}°</span>
          <span class="weather-chip">L: ${lo}°</span>
          <span class="weather-chip">Wind: ${wind} mph</span>
        `;
      }
    } catch {
      if (descEl) descEl.textContent = "Weather unavailable";
    }
  }

  loadWeather();
  setInterval(loadWeather, 20 * 60 * 1000);
}