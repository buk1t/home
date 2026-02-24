import { $ } from "../lib/dom.js";
import { loadJSON } from "../lib/store.js";

const WEATHER_KEY = "home.weather.v1";

function defaultWeatherPrefs() {
  return { tz: "America/New_York" };
}

function getWeatherPrefs() {
  const prefs = loadJSON(WEATHER_KEY, null);
  if (prefs && typeof prefs === "object" && prefs.tz) return prefs;
  return defaultWeatherPrefs();
}

export function initSubtitleClock() {
  const el = $("#subtitle");
  if (!el) return;

  const prefs = getWeatherPrefs();
  const tz = prefs?.tz || "America/New_York";

  const render = () => {
    el.textContent = new Date().toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    });
  };

  render();
  const now = new Date();
  const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  setTimeout(() => {
    render();
    setInterval(render, 60 * 1000);
  }, msUntilNextMinute);
}