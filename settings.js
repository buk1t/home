// settings.js

const STORE_KEY = "home.state.v1";
const LINKS_KEY = "home.links.v1";
const WEATHER_KEY = "home.weather.v1";

const $ = (sel) => document.querySelector(sel);

function uuid() {
  return (
    crypto?.randomUUID?.() ||
    `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  );
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalizeUrl(url) {
  const s = (url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("./") || s.startsWith("/")) return s;
  if (s.includes(".")) return "https://" + s;
  return s;
}

function iconSVG(iconId) {
  const icon = ICONS.find((i) => i.id === iconId) || ICONS[0];
  return `
    <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${icon.path}
    </svg>
  `;
}

// ----- Weather -----
function defaultWeatherPrefs() {
  return {
    name: "Seattle, WA, United States",
    lat: 47.6062,
    lon: -122.3321,
    tz: "America/Los_Angeles",
  };
}

function getWeatherPrefs() {
  const prefs = loadJSON(WEATHER_KEY, null);
  if (prefs && typeof prefs.lat === "number" && typeof prefs.lon === "number") {
    return {
      name: prefs.name || defaultWeatherPrefs().name,
      lat: prefs.lat,
      lon: prefs.lon,
      tz: prefs.tz || defaultWeatherPrefs().tz,
    };
  }
  return defaultWeatherPrefs();
}

function setCityPill() {
  const pill = $("#currentCityPill");
  if (!pill) return;
  const prefs = getWeatherPrefs();
  const label = (prefs.name || "Weather").split(",")[0].trim();
  pill.textContent = label || "Weather";
}

async function searchCities(q) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(q)}` +
    `&count=8&language=en&format=json`;

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

function renderCityResults(results) {
  const root = $("#cityResults");
  if (!root) return;

  if (!results.length) {
    root.innerHTML = `<div class="panel-sub">No results.</div>`;
    return;
  }

  root.innerHTML = results
    .map((r) => {
      const full =
        [r.name, r.admin1, r.country].filter(Boolean).join(", ") || "Unknown";
      const shown = (full || "Weather").split(",")[0].trim();

      return `
        <button class="ghostbtn" type="button" data-city='${esc(
          JSON.stringify({
            name: full,
            lat: r.latitude,
            lon: r.longitude,
            tz: r.timezone,
          })
        )}' style="width:100%; text-align:left; display:flex; justify-content:space-between; gap:10px; align-items:center; margin-bottom:10px;">
          <span style="font-weight:650;">${esc(shown)}</span>
          <span style="font-size:12px; color:var(--muted);">${esc(
            [r.admin1, r.country].filter(Boolean).join(", ")
          )}</span>
        </button>
      `;
    })
    .join("");

  root.querySelectorAll("button[data-city]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const data = JSON.parse(btn.getAttribute("data-city"));
      saveJSON(WEATHER_KEY, data);
      setCityPill();
      root.innerHTML = `<div class="panel-sub">Saved.</div>`;
    });
  });
}

// ----- Links -----
function getLinks() {
  const links = loadJSON(LINKS_KEY, []);
  return Array.isArray(links) ? links : [];
}
function setLinks(links) {
  saveJSON(LINKS_KEY, links);
}

function renderLinksList() {
  const root = $("#linksList");
  if (!root) return;

  const links = getLinks();

  if (!links.length) {
    root.innerHTML = `<div class="panel-sub">No links yet. Click “Add link”.</div>`;
    return;
  }

  root.innerHTML = links
    .map((l, idx) => {
      const title = (l.title || "").trim() || "Untitled";
      const url = (l.url || "").trim() || "";
      const icon = l.icon || "link";
      return `
        <div class="archive-row" style="grid-template-columns: 44px 1fr auto auto auto;">
          <div class="icon" aria-hidden="true" style="width:40px;height:40px;border-radius:14px;">
            ${iconSVG(icon)}
          </div>
          <div style="display:flex; flex-direction:column; gap:2px; min-width:0;">
            <div style="font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(title)}</div>
            <div style="font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(url)}</div>
          </div>
          <button class="archive-btn" type="button" data-act="up" data-idx="${idx}">↑</button>
          <button class="archive-btn" type="button" data-act="down" data-idx="${idx}">↓</button>
          <button class="archive-btn" type="button" data-act="edit" data-idx="${idx}">Edit</button>
        </div>
      `;
    })
    .join("");

  root.querySelectorAll("button[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.getAttribute("data-act");
      const idx = Number(btn.getAttribute("data-idx"));
      const links = getLinks();

      if (act === "up" && idx > 0) {
        [links[idx - 1], links[idx]] = [links[idx], links[idx - 1]];
        setLinks(links);
        renderLinksList();
      }

      if (act === "down" && idx < links.length - 1) {
        [links[idx + 1], links[idx]] = [links[idx], links[idx + 1]];
        setLinks(links);
        renderLinksList();
      }

      if (act === "edit") openLinkModal(idx);
    });
  });
}

// ----- Archive (read-only + manage) -----
function loadChecklistState() {
  const st = loadJSON(STORE_KEY, null);
  if (!st || typeof st !== "object") return { active: [], archived: [] };
  return {
    active: Array.isArray(st.active) ? st.active : [],
    archived: Array.isArray(st.archived) ? st.archived : [],
  };
}

function saveChecklistState(st) {
  saveJSON(STORE_KEY, st);
}

function renderArchive() {
  const list = $("#archiveList");
  if (!list) return;

  const st = loadChecklistState();
  const archived = st.archived || [];

  if (!archived.length) {
    list.innerHTML = `<div class="archive-row">
      <div class="archive-text" style="text-decoration:none;opacity:.55;">No completed tasks yet.</div>
    </div>`;
    return;
  }

  list.innerHTML = "";
  archived
    .slice()
    .sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0))
    .forEach((t) => {
      const row = document.createElement("div");
      row.className = "archive-row";

      const text = document.createElement("div");
      text.className = "archive-text";
      text.textContent = t.text || "(empty)";

      const restore = document.createElement("button");
      restore.className = "archive-btn";
      restore.type = "button";
      restore.textContent = "Restore";
      restore.addEventListener("click", () => {
        const st = loadChecklistState();
        st.archived = st.archived.filter((x) => x.id !== t.id);
        st.active.unshift({
          id: t.id,
          text: t.text,
          created: t.created || Date.now(),
          checked: false,
          pendingArchiveAt: null,
        });
        saveChecklistState(st);
        renderArchive();
      });

      const del = document.createElement("button");
      del.className = "archive-btn";
      del.type = "button";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        const st = loadChecklistState();
        st.archived = st.archived.filter((x) => x.id !== t.id);
        saveChecklistState(st);
        renderArchive();
      });

      row.appendChild(text);
      row.appendChild(restore);
      row.appendChild(del);
      list.appendChild(row);
    });
}

// ----- Link Modal -----
let editingIndex = null;
let selectedIcon = "link";

function openModal() {
  const m = $("#linkModal");
  if (!m) return;
  m.setAttribute("aria-hidden", "false");

  // prevent backdrop click from instantly closing when clicking inside card
  const card = m.querySelector(".modal-card");
  if (card && !card.__wired) {
    card.__wired = true;
    card.addEventListener("click", (e) => e.stopPropagation());
  }
}

function closeModal() {
  $("#linkModal")?.setAttribute("aria-hidden", "true");
}

function renderIconPicker() {
  const root = $("#iconPicker");
  if (!root) return;

  root.innerHTML = ICONS.map((ic) => {
    const on = ic.id === selectedIcon;
    return `
      <button type="button" class="iconbtn" data-icon="${ic.id}"
        style="width:44px;height:44px;border-radius:14px;${on ? `border-color: var(--stroke-strong); background: var(--surface);` : ""}"
        title="${esc(ic.label)}">
        ${iconSVG(ic.id)}
      </button>
    `;
  }).join("");

  root.querySelectorAll("button[data-icon]").forEach((b) => {
    b.addEventListener("click", () => {
      selectedIcon = b.getAttribute("data-icon");
      renderIconPicker();
    });
  });
}

function openLinkModal(idx = null) {
  const titleEl = $("#linkModalTitle");
  const delBtn = $("#deleteLinkBtn");
  const t = $("#linkTitle");
  const u = $("#linkUrl");

  editingIndex = typeof idx === "number" ? idx : null;

  if (editingIndex === null) {
    if (titleEl) titleEl.textContent = "Add link";
    if (delBtn) delBtn.style.display = "none";
    if (t) t.value = "";
    if (u) u.value = "";
    selectedIcon = "link";
  } else {
    const links = getLinks();
    const link = links[editingIndex];
    if (titleEl) titleEl.textContent = "Edit link";
    if (delBtn) delBtn.style.display = "inline-flex";
    if (t) t.value = link?.title || "";
    if (u) u.value = link?.url || "";
    selectedIcon = link?.icon || "link";
  }

  renderIconPicker();
  openModal();

  // focus title
  requestAnimationFrame(() => {
    $("#linkTitle")?.focus?.({ preventScroll: true });
  });
}

function saveLinkFromModal() {
  const t = ($("#linkTitle")?.value || "").trim();
  const uRaw = ($("#linkUrl")?.value || "").trim();
  const u = normalizeUrl(uRaw);
  const links = getLinks();

  if (!u) {
    alert("Please enter a URL.");
    return;
  }

  const linkObj = {
    id: editingIndex === null ? uuid() : (links[editingIndex]?.id || uuid()),
    title: t || "Untitled",
    url: u,
    icon: selectedIcon || "link",
  };

  if (editingIndex === null) links.push(linkObj);
  else links[editingIndex] = linkObj;

  setLinks(links);
  renderLinksList();
  closeModal();
}

function deleteLinkFromModal() {
  if (editingIndex === null) return;
  const links = getLinks();
  links.splice(editingIndex, 1);
  setLinks(links);
  renderLinksList();
  closeModal();
}

// ----- Init -----
(function init() {
  window.renderVersionBadge?.();
  setCityPill();
  renderLinksList();
  renderArchive();


  // weather search
  $("#cityForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = ($("#cityInput")?.value || "").trim();
    if (!q) return;
    $("#cityResults").innerHTML = `<div class="panel-sub">Searching…</div>`;
    try {
      const results = await searchCities(q);
      renderCityResults(results);
    } catch {
      $("#cityResults").innerHTML = `<div class="panel-sub">Search failed.</div>`;
    }
  });

  // link modal wiring
  $("#addLinkBtn")?.addEventListener("click", () => openLinkModal(null));

  // clicking backdrop closes (but modal-card stops propagation)
  $("#linkModalClose")?.addEventListener("click", closeModal);

  // "Done" should not silently discard edits: if URL field has something, save; else close
  $("#linkModalDone")?.addEventListener("click", () => {
    const url = ($("#linkUrl")?.value || "").trim();
    const title = ($("#linkTitle")?.value || "").trim();
    // If user typed anything, save; otherwise just close
    if (url || title) saveLinkFromModal();
    else closeModal();
  });

  $("#saveLinkBtn")?.addEventListener("click", saveLinkFromModal);
  $("#deleteLinkBtn")?.addEventListener("click", deleteLinkFromModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    // Enter inside modal saves if focused on URL/title field
    if (e.key === "Enter") {
      const active = document.activeElement;
      if (active && (active.id === "linkTitle" || active.id === "linkUrl")) {
        e.preventDefault();
        saveLinkFromModal();
      }
    }
  });
})();