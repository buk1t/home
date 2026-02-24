// sw.js
// Folder-route aware service worker for buk1t home
// - Precache core app shell + page routes
// - Stale-while-revalidate for same-origin GET
// - Navigation fallback to cached index.html when offline

const CACHE = "home-6.0.0"; // bump this whenever you move/rename core files

const CORE = [
  // Routes / HTML
  "/",
  "/index.html",
  "/settings/",
  "/settings/index.html",
  "/theme/",
  "/theme/index.html",
  "/changelog/",
  "/changelog/index.html",
  "/404.html",

  // Service worker
  "/sw.js",

  // CSS (new structure)
  "/css/tokens.css",
  "/css/app.css",
  "/css/pages/home.css",
  "/css/pages/settings.css",
  "/css/pages/theme.css",
  "/css/pages/changelog.css",
  "/css/features/panels.css",
  "/css/features/buttons.css",
  "/css/features/modal.css",
  "/css/features/iconpicker.css",

  // JS core
  "/js/core/boot.js",
  "/js/core/style.js",
  "/js/core/theme-apply.js",
  "/js/core/favicon-live.js",
  "/js/core/nav.js",
  "/js/core/version.js",

  // JS pages
  "/js/pages/home.js",
  "/js/pages/settings.js",
  "/js/pages/theme.js",
  "/js/pages/changelog.js",

  // JS features
  "/js/features/subtitle-clock.js",
  "/js/features/searchbar.js",
  "/js/features/links-grid.js",
  "/js/features/checklist.js",
  "/js/features/weather.js",
  "/js/features/theme-editor.js",
  "/js/features/settings-links.js",
  "/js/features/settings-search.js",
  "/js/features/settings-city.js",
  "/js/features/settings-archive.js",
  "/js/features/settings-import.js",

  // JS libs
  "/js/lib/dom.js",
  "/js/lib/store.js",
  "/js/lib/ids.js",
  "/js/lib/url.js",
  "/js/lib/search-prefs.js",
  "/js/lib/icons.js",

  // JSON
  "/json/themes.json",
  "/json/icons.json",
  "/json/changelog.json",

  // Fonts
  "/assets/fonts/Inter-roman.ttf",
  "/assets/fonts/Inter-italic.ttf",
];

// Install: precache core, activate immediately
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      // if any single item 404s, addAll fails hard — so do a resilient add
      await Promise.all(
        CORE.map(async (url) => {
          try {
            await c.add(url);
          } catch (err) {
            // keep install alive even if an optional file is missing
            // (common during refactors)
            // console.warn("[sw] precache failed:", url, err);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

function isHTMLNavigation(req) {
  // true for normal page loads (not JS/CSS fetches)
  return req.mode === "navigate";
}

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Cross-origin requests (open-meteo, etc.) -> network only
  if (!isSameOrigin(url)) return;

  // Navigation requests: network-first, fallback to cached app shell
  // This prevents “blank page offline” and handles folder routes.
  if (isHTMLNavigation(req)) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);

        try {
          const res = await fetch(req);
          // Cache successful navigations (helps keep routes fresh)
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          // Try exact match first (e.g. /theme/), then fall back to app shell
          const cached =
            (await cache.match(req, { ignoreSearch: true })) ||
            (await cache.match("/index.html")) ||
            (await cache.match("/"));

          return (
            cached ||
            new Response("Offline", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
      })()
    );
    return;
  }

  // Assets/API (same-origin GET): stale-while-revalidate
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);

      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            cache.put(req, res.clone());
          }
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })()
  );
});