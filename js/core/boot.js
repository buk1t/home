// /js/core/boot.js
// Use: <script type="module" src="/js/core/boot.js"></script>

import "./style.js";         // ✅ NEW: load CSS bundle first
import "./favicon-live.js";  // must be before theme apply
import "./theme-apply.js";   // applies vars + sets favicon
import "./nav.js";           // global dock

function normalizePath(p) {
  return (p || "/").replace(/\/+$/, "") || "/";
}

function detectPage() {
  const hint =
    document.documentElement?.dataset?.page ||
    document.body?.dataset?.page ||
    "";

  if (hint) return hint.toLowerCase().trim();

  const path = normalizePath(window.location.pathname);

  if (path === "/" || path === "/index.html") return "home";
  if (path === "/settings" || path === "/settings/index.html") return "settings";
  if (path === "/theme" || path === "/theme/index.html") return "theme";
  if (path === "/changelog" || path === "/changelog/index.html") return "changelog";

  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/theme")) return "theme";
  if (path.startsWith("/changelog")) return "changelog";

  return "home";
}

async function boot() {
  const page = detectPage();

  const map = {
    home: "/js/pages/home.js",
    settings: "/js/pages/settings.js",
    theme: "/js/pages/theme.js",
    changelog: "/js/pages/changelog.js",
  };

  const entry = map[page];
  if (!entry) return;

  try {
    await import(entry);
  } catch (e) {
    console.error(`[boot] failed to load entry for "${page}"`, e);
  }
}

boot();