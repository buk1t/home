// /js/core/style.js
// Goal: guarantee /theme can look like /index by loading the same "home UI" styles.

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
  if (path === "/settings" || path.startsWith("/settings")) return "settings";
  if (path === "/theme" || path.startsWith("/theme")) return "theme";
  if (path === "/changelog" || path.startsWith("/changelog")) return "changelog";

  return "home";
}

function addStyles(hrefs) {
  // remove old injected styles
  document.querySelectorAll('link[data-stylejs="1"]').forEach((n) => n.remove());

  for (const href of hrefs) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-stylejs", "1");
    document.head.appendChild(link);
  }
}

export function loadPageStyles() {
  const page = detectPage();

  // Always loaded everywhere
  const base = [
    "/css/tokens.css",
    "/css/app.css",
  ];

  // This is the key: "home look" bundle
  // Put the stuff that makes /index feel like /index here.
  const homeUI = [
    "/css/pages/home.css",
  ];

  const pageCss = {
    home: [
      ...homeUI,
    ],

    // If settings should also share the same card system, you can include homeUI here too.
    settings: [
      ...homeUI,
      "/css/pages/settings.css",
    ],

    // ✅ Theme needs to look like home, so load homeUI + theme editor specifics
    theme: [
      ...homeUI,
      "/css/pages/theme.css",
    ],

    changelog: [
      ...homeUI, // optional — remove if you truly want changelog super minimal
      "/css/pages/changelog.css",
    ],
  };

  addStyles([...base, ...(pageCss[page] || [])]);
}

// Load immediately
loadPageStyles();