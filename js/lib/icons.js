// /js/lib/icons.js

const ICONS_URL = "/json/icons.json";

let _cache = null;

async function loadIcons() {
  if (_cache) return _cache;

  const res = await fetch(ICONS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load icons: ${ICONS_URL}`);

  const json = await res.json();
  const list = Array.isArray(json?.icons) ? json.icons : Array.isArray(json) ? json : [];

  _cache = list
    .filter(Boolean)
    .map((i) => ({
      id: String(i.id || "").trim(),
      label: String(i.label || i.name || i.id || "").trim() || "Icon",
      path: String(i.path || "").trim()
    }))
    .filter((i) => i.id && i.path);

  return _cache;
}

export async function listIconOptions() {
  const icons = await loadIcons();
  return icons.map((i) => ({ id: i.id, name: i.label }));
}

export async function renderIconById(id, opts = {}) {
  const icons = await loadIcons();
  const hit = icons.find((i) => i.id === id) || icons.find((i) => i.id === "link") || icons[0];

  const size = Number(opts.size || 20);
  const stroke = String(opts.strokeWidth || "1.8");

  return `
    <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"
      width="${size}" height="${size}" aria-hidden="true">
      ${hit?.path || ""}
    </svg>
  `;
}

function escHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createPickerModal() {
  const overlay = document.createElement("div");
  overlay.className = "iconpicker-overlay";
  overlay.innerHTML = `
    <div class="iconpicker" role="dialog" aria-modal="true" aria-label="Choose an icon">
      <div class="iconpicker-top">
        <div class="iconpicker-title">Choose an icon</div>
        <button class="iconpicker-close" type="button" aria-label="Close">✕</button>
      </div>

      <input class="iconpicker-search" type="search" placeholder="Search icons… (name or id)">

      <div class="iconpicker-grid" role="list"></div>
    </div>
  `;
  return overlay;
}

export async function openIconPicker({ currentId = "link" } = {}) {
  const icons = await loadIcons();

  return new Promise((resolve) => {
    const overlay = createPickerModal();
    const modal = overlay.querySelector(".iconpicker");
    const grid = overlay.querySelector(".iconpicker-grid");
    const search = overlay.querySelector(".iconpicker-search");
    const closeBtn = overlay.querySelector(".iconpicker-close");

    const cleanup = (value) => {
      overlay.remove();
      resolve(value);
    };

    const render = async (q = "") => {
      const query = String(q || "").trim().toLowerCase();
      const filtered = !query
        ? icons
        : icons.filter((i) => {
            const a = (i.label || "").toLowerCase();
            const b = (i.id || "").toLowerCase();
            return a.includes(query) || b.includes(query);
          });

      grid.innerHTML = "";

      for (const i of filtered) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "iconpick";
        btn.setAttribute("role", "listitem");
        btn.setAttribute("data-id", i.id);
        if (i.id === currentId) btn.classList.add("is-current");

        btn.innerHTML = `
          <div class="iconpick-ico">
            ${await renderIconById(i.id, { size: 22 })}
          </div>
          <div class="iconpick-meta">
            <div class="iconpick-label">${escHtml(i.label)}</div>
            <div class="iconpick-id">${escHtml(i.id)}</div>
          </div>
        `;

        btn.addEventListener("click", () => cleanup(i.id));
        grid.appendChild(btn);
      }
    };

    // close interactions
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) cleanup(null);
    });

    closeBtn.addEventListener("click", () => cleanup(null));

    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") cleanup(null);
      },
      { once: true }
    );

    search.addEventListener("input", () => render(search.value));

    document.body.appendChild(overlay);

    // initial
    render("");
    requestAnimationFrame(() => search.focus());
    requestAnimationFrame(() => modal.scrollTo({ top: 0 }));
  });
}