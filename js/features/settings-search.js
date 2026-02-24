// /js/features/settings-search.js
import { $ } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/store.js";
import { SEARCH_KEY, defaultSearchPrefs } from "../lib/search-prefs.js";

function prettyEngineName(engine) {
  switch (engine) {
    case "ddg": return "DuckDuckGo";
    case "brave": return "Brave";
    case "bing": return "Bing";
    case "kagi": return "Kagi";
    case "perplexity": return "Perplexity";
    case "custom": return "Custom";
    case "google":
    default: return "Google";
  }
}

function getPrefs() {
  const prefs = loadJSON(SEARCH_KEY, null);
  if (!prefs || typeof prefs !== "object") return defaultSearchPrefs();

  return {
    engine: String(prefs.engine || "google").trim().toLowerCase() || "google",
    customTemplate:
      String(prefs.customTemplate || "").trim() ||
      defaultSearchPrefs().customTemplate,
  };
}

function setPrefs(next) {
  const engine = String(next?.engine || "google").trim().toLowerCase() || "google";
  const customTemplate =
    String(next?.customTemplate || "").trim() ||
    defaultSearchPrefs().customTemplate;

  saveJSON(SEARCH_KEY, { engine, customTemplate });
}

export function initSettingsSearch() {
  const sel = $("#searchEngine");
  const wrap = $("#customSearchWrap");
  const inp = $("#searchCustom");
  const pill = $("#currentSearchPill");

  if (!sel) return;

  const sync = () => {
    const prefs = getPrefs();
    sel.value = prefs.engine || "google";
    if (inp) inp.value = prefs.customTemplate;

    const showCustom = prefs.engine === "custom";
    if (wrap) wrap.style.display = showCustom ? "block" : "none";
    if (pill) pill.textContent = prettyEngineName(prefs.engine);
  };

  sel.addEventListener("change", () => {
    const prefs = getPrefs();
    setPrefs({ engine: sel.value, customTemplate: prefs.customTemplate });
    sync();
  });

  inp?.addEventListener("input", () => {
    const prefs = getPrefs();
    setPrefs({ engine: prefs.engine, customTemplate: inp.value });
  });

  sync();
}