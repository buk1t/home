// theme-apply.js

(() => {
  const THEME_KEY = "home.theme.v1";

  const root = document.documentElement;

  function isSystemDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function getForcedSchemeFromDom() {
    const s = (root.dataset.scheme || "").toLowerCase().trim();
    return s === "light" || s === "dark" ? s : null;
  }

  function getActiveScheme() {
    // If your UI forces a scheme via <html data-scheme="dark">, honor it
    const forced = getForcedSchemeFromDom();
    if (forced) return forced;

    // Otherwise, use system preference
    return isSystemDark() ? "dark" : "light";
  }

  function safeParse(raw) {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getSavedTheme() {
    return safeParse(localStorage.getItem(THEME_KEY));
  }

  function clearInlineVarsFromTheme(themeObj) {
    // If you previously applied vars inline, we need to remove old ones
    // before applying the new scheme to avoid ghost values.
    const all = new Set([
      ...Object.keys(themeObj?.light?.vars || {}),
      ...Object.keys(themeObj?.dark?.vars || {})
    ]);

    for (const k of all) root.style.removeProperty(k);
  }

  function applyVars(vars) {
    for (const [k, v] of Object.entries(vars || {})) {
      const s = String(v ?? "").trim();
      if (s) root.style.setProperty(k, s);
    }
  }

  function updateFaviconFromCss() {
    // Your favicon.js watches --favicon and exposes window.BUK1T_FAVICON.set()
    // We’ll set it explicitly so it updates immediately.
    const val = (getComputedStyle(root).getPropertyValue("--favicon") || "").trim();
    if (val) window.BUK1T_FAVICON?.set?.(val);
  }

  function applyTheme() {
    const saved = getSavedTheme();
    if (!saved) {
      // No saved theme: still try to sync favicon to whatever CSS default is
      updateFaviconFromCss();
      return;
    }

    const scheme = getActiveScheme();
    const vars = (scheme === "dark" ? saved.dark?.vars : saved.light?.vars) || {};

    // important: clear old inline vars first, then apply new ones
    clearInlineVarsFromTheme(saved);
    applyVars(vars);

    // Hint browsers for built-in form controls, scrollbars, etc.
    root.style.setProperty("color-scheme", scheme);

    updateFaviconFromCss();
  }

  // Run ASAP
  applyTheme();

  // 1) Re-apply on OS scheme change (Auto)
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      // Only matters if we are not forcing scheme via data-scheme
      if (!getForcedSchemeFromDom()) applyTheme();
    });
  } catch {}

  // 2) Re-apply if your app toggles html[data-scheme]
  //    (MutationObserver catches attribute changes)
  try {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-scheme") {
          applyTheme();
          break;
        }
      }
    });
    obs.observe(root, { attributes: true });
  } catch {}

  // 3) Re-apply if localStorage theme changes (another tab or settings)
  window.addEventListener("storage", (e) => {
    if (e.key === THEME_KEY) applyTheme();
  });

  // Optional: allow other code to force refresh
  window.BUK1T_THEME_APPLY = { apply: applyTheme };
})();