//nav.js


(() => {
  const DEFAULT_ITEMS = [
    { id: "home", label: "Home", href: "/", icon: "home" },
    { id: "settings", label: "Settings", href: "/settings", icon: "sliders" },
    { id: "theme", label: "Theme", href: "/theme", icon: "palette" },
    { id: "changelog", label: "Changelog", href: "/changelog", icon: "clock" },
    { id: "buk1t", label: "buk1t.com", href: "https://www.buk1t.com", icon: "arrow" }
  ];

  const ICONS = {
    home: `<path d="M4 11l8-7 8 7"></path><path d="M6 10v10h12V10"></path>`,
    sliders: `
      <path d="M4 6h10"></path><path d="M18 6h2"></path><circle cx="16" cy="6" r="2"></circle>
      <path d="M4 12h2"></path><path d="M10 12h10"></path><circle cx="8" cy="12" r="2"></circle>
      <path d="M4 18h14"></path><path d="M22 18h-2"></path><circle cx="20" cy="18" r="2"></circle>
    `,
    palette: `
      <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 0-4h-1a1 1 0 0 1 0-2h3a4 4 0 0 0 0-8h-1"></path>
      <circle cx="7.5" cy="10.5" r="1"></circle>
      <circle cx="9.5" cy="7.5" r="1"></circle>
      <circle cx="14.5" cy="7.5" r="1"></circle>
      <circle cx="16.5" cy="10.5" r="1"></circle>
    `,
    clock: `<circle cx="12" cy="12" r="9"></circle><path d="M12 7v6l4 2"></path>`,
    arrow: `
      <path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"></path>
      <path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path>
    `
  };

  const $ = (sel, root = document) => root.querySelector(sel);

  function svgFor(kind) {
    const p = ICONS[kind] || ICONS.home;
    return `
      <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${p}
      </svg>
    `;
  }

  function normalizePath(pathname) {
    return (pathname || "/").replace(/\/+$/, "") || "/";
  }

  function isActive(href, currentPath) {
    try {
      if (/^https?:\/\//i.test(href)) return false;
      return normalizePath(href) === currentPath;
    } catch {
      return false;
    }
  }

  function buildDock(items) {
    const currentPath = normalizePath(window.location.pathname);

    const wrap = document.createElement("div");
    wrap.className = "navdock-wrap";
    wrap.setAttribute("data-open", "false");

    // Launcher
    const launcher = document.createElement("button");
    launcher.className = "navdock-launch";
    launcher.type = "button";
    launcher.setAttribute("aria-label", "Open navigation");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    wrap.appendChild(launcher);

    // Tray (expands LEFT)
    const tray = document.createElement("nav");
    tray.className = "navdock-tray";
    tray.setAttribute("aria-label", "Page navigation");

    items.forEach((it) => {
      const a = document.createElement("a");
      a.className = "navbtn";
      a.href = it.href;
      a.setAttribute("data-nav", it.id);

      if (/^https?:\/\//i.test(it.href)) {
        a.target = "_blank";
        a.rel = "noopener";
      }

      if (isActive(it.href, currentPath)) a.classList.add("is-active");

      a.innerHTML = `
        <span class="navbtn-ico">${svgFor(it.icon)}</span>
        <span class="navbtn-label">${it.label}</span>
      `;

      tray.appendChild(a);
    });

    wrap.appendChild(tray);

    // Toggle logic
    const setOpen = (open) => {
      wrap.setAttribute("data-open", open ? "true" : "false");
      launcher.setAttribute("aria-expanded", open ? "true" : "false");
    };

    const toggle = () => setOpen(wrap.getAttribute("data-open") !== "true");

    launcher.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // click outside closes
    document.addEventListener("click", (e) => {
      if (wrap.getAttribute("data-open") !== "true") return;
      if (!wrap.contains(e.target)) setOpen(false);
    });

    // ESC closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    return wrap;
  }

  function mount() {
    const items =
      (window.BUK1T_NAV_ITEMS && Array.isArray(window.BUK1T_NAV_ITEMS))
        ? window.BUK1T_NAV_ITEMS
        : DEFAULT_ITEMS;

    // Optional host:
    // <div id="navDock"></div>
    let host = document.getElementById("navDock");

    if (!host) {
      host = document.createElement("div");
      host.id = "navDock";
      document.body.appendChild(host);
    }

    host.innerHTML = "";
    host.appendChild(buildDock(items));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();