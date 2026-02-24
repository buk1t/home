import { $ } from "../lib/dom.js";
import { isLikelyUrl, normalizeUrl } from "../lib/url.js";
import { buildSearchUrl } from "../lib/search-prefs.js";

export function initSearchBar() {
  const form = $("#searchForm");
  const input = $("#searchInput");
  if (!form || !input) return;

  const focusSearch = () => {
    input.focus({ preventScroll: true });
    const v = input.value || "";
    try { input.setSelectionRange(v.length, v.length); } catch {}
  };

  requestAnimationFrame(focusSearch);
  window.addEventListener("load", focusSearch, { once: true });

  window.addEventListener("keydown", (e) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const typing = tag === "input" || tag === "textarea" || tag === "select";
    if (e.key === "/" && !typing) {
      e.preventDefault();
      focusSearch();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = (input.value || "").trim();
    if (!text) return;

    window.location.href = isLikelyUrl(text)
      ? normalizeUrl(text)
      : buildSearchUrl(text);
  });
}