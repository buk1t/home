// /js/favicon-live.js
(() => {
  const STATE = {
    active: false,
    prev: null,   // cached original <link rel~="icon"> hrefs
    lastHref: ""
  };

  function iconLinks() {
    // rel can be "icon", "shortcut icon", etc.
    return Array.from(document.querySelectorAll('link[rel~="icon"]'));
  }

  function cacheOriginalLinks() {
    if (STATE.prev) return;
    const links = iconLinks();
    STATE.prev = links.map((l) => ({
      el: l,
      href: l.getAttribute("href") || "",
      type: l.getAttribute("type") || ""
    }));
  }

  function restoreOriginalLinks() {
    if (!STATE.prev) return;
    for (const item of STATE.prev) {
      if (!item.el.isConnected) continue;
      if (item.href) item.el.setAttribute("href", item.href);
      else item.el.removeAttribute("href");

      if (item.type) item.el.setAttribute("type", item.type);
      else item.el.removeAttribute("type");
    }
  }

  function ensureAtLeastOneIconLink() {
    let links = iconLinks();
    if (links.length) return links;

    const link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
    return [link];
  }

  function svgData(color) {
    const c = String(color || "").trim() || "#4c91b3";
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <defs>
          <radialGradient id="g" cx="30%" cy="28%" r="80%">
            <stop offset="0%" stop-color="#fff" stop-opacity=".55"/>
            <stop offset="45%" stop-color="#fff" stop-opacity=".10"/>
            <stop offset="100%" stop-color="#000" stop-opacity=".25"/>
          </radialGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="${c}"/>
        <rect width="64" height="64" rx="16" fill="url(#g)"/>
      </svg>
    `.trim();

    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");

    // Cache-buster so Safari actually updates
    return `data:image/svg+xml,${encoded}#t=${Date.now()}`;
  }

  function setAll(color) {
    const href = svgData(color);
    STATE.lastHref = href;

    const links = ensureAtLeastOneIconLink();
    for (const l of links) {
      l.setAttribute("href", href);
      l.setAttribute("type", "image/svg+xml");
    }
  }

  // This loop prevents favicon.js from “winning” after we set the icon.
  function enforceLoop() {
    if (!STATE.active) return;

    const links = ensureAtLeastOneIconLink();
    for (const l of links) {
      const cur = l.getAttribute("href") || "";
      if (cur !== STATE.lastHref) {
        l.setAttribute("href", STATE.lastHref);
        l.setAttribute("type", "image/svg+xml");
      }
    }

    requestAnimationFrame(enforceLoop);
  }

  window.BUK1T_FAVICON = {
    set(color) {
      cacheOriginalLinks();
      STATE.active = true;
      setAll(color);
      requestAnimationFrame(enforceLoop);
    },
    clear() {
      STATE.active = false;
      restoreOriginalLinks();
      STATE.prev = null;
      STATE.lastHref = "";
    }
  };
})();