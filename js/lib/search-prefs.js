import { loadJSON } from "./store.js";

export const SEARCH_KEY = "home.search.v1";

export function defaultSearchPrefs() {
  return { engine: "google", customTemplate: "https://www.google.com/search?q={q}" };
}

export function getSearchPrefs() {
  const prefs = loadJSON(SEARCH_KEY, null);
  if (!prefs || typeof prefs !== "object") return defaultSearchPrefs();

  const engine = String(prefs.engine || "").trim().toLowerCase() || "google";
  const customTemplate =
    String(prefs.customTemplate || "").trim() || defaultSearchPrefs().customTemplate;

  return { engine, customTemplate };
}

export function engineToTemplate(engine, customTemplate) {
  switch (engine) {
    case "ddg": return "https://duckduckgo.com/?q={q}";
    case "brave": return "https://search.brave.com/search?q={q}";
    case "bing": return "https://www.bing.com/search?q={q}";
    case "kagi": return "https://kagi.com/search?q={q}";
    case "perplexity": return "https://www.perplexity.ai/search?q={q}";
    case "custom": return customTemplate || defaultSearchPrefs().customTemplate;
    case "google":
    default: return "https://www.google.com/search?q={q}";
  }
}

export function buildSearchUrl(q) {
  const prefs = getSearchPrefs();
  const template = engineToTemplate(prefs.engine, prefs.customTemplate);
  if (!template.includes("{q}")) return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
  return template.replaceAll("{q}", encodeURIComponent(q));
}