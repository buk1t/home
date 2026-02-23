// theme.js — theme editor with paired Light/Dark themes + scheme preview + categorized presets
// Presets loaded from /json/themes.json
// Presets PREVIEW on click (no save). Save commits the current draft to localStorage.
// Fixes dark-mode desync + fixes "can't apply" by using a draft layer that overrides saved values.
// Hides "Classic"/no-op presets (empty vars).
// Adds: last-clicked preset subtle ring (UI only, does NOT affect saving).

const THEME_KEY = "home.theme.v1";
const PRESETS_URL = "/json/themes.json";

const $ = (s) => document.querySelector(s);
const root = document.documentElement;

// -------------------------
// Editable fields
// -------------------------
const FIELD_GROUPS = [
  {
    title: "Core",
    hint: "Most of the vibe lives here.",
    fields: [
      { var: "--text", label: "Text", pick: true },
      { var: "--muted", label: "Muted", pick: true },
      { var: "--card", label: "Card", pick: true },
      { var: "--card2", label: "Card 2", pick: true },
      { var: "--stroke", label: "Stroke", pick: true },
      { var: "--stroke-strong", label: "Stroke strong", pick: true },
      { var: "--radius", label: "Radius", pick: false }
    ]
  },
  {
    title: "Background",
    hint: "Gradient + overlay glow. This is the atmosphere.",
    fields: [
      { var: "--bg-a", label: "BG A", pick: true },
      { var: "--bg-b", label: "BG B", pick: true },
      { var: "--bg-c", label: "BG C", pick: true },
      { var: "--bg-glow", label: "BG glow", pick: true },
      { var: "--ov-a", label: "Overlay glow", pick: true },
      { var: "--ov-b", label: "Overlay shade", pick: true }
    ]
  },
  {
    title: "Brand",
    hint: "Little details that change the feel.",
    fields: [{ var: "--favicon", label: "Favicon", pick: true }]
  },
  {
    title: "Advanced",
    hint: "Tweak if you’re being insane (compliment).",
    fields: [
      { var: "--shadow", label: "Shadow", pick: false },
      { var: "--icon-size", label: "Icon size", pick: false },
      { var: "--icon-stroke", label: "Icon stroke", pick: false }
    ]
  }
];

const MANAGED_VARS = Array.from(
  new Set(FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.var)))
);

// -------------------------
// State
// -------------------------
const state = {
  schemePreview: "auto", // "auto" | "light" | "dark"
  editingScheme: "light", // "light" | "dark"
  // Draft layer: what the user is previewing/editing right now (not yet saved)
  draft: {
    light: {},
    dark: {}
  },

  // UI-only: last clicked preset ring
  lastPresetId: null
};

// -------------------------
// Presets from JSON
// -------------------------
let PRESETS = [];

async function loadPresets() {
  const res = await fetch(PRESETS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load presets: ${PRESETS_URL}`);
  const json = await res.json();

  const list = Array.isArray(json.presets)
    ? json.presets
    : Array.isArray(json)
      ? json
      : [];

  const normalizeVars = (maybe) => {
    if (!maybe) return {};
    if (maybe.vars && typeof maybe.vars === "object") return maybe.vars;
    if (typeof maybe === "object") return maybe;
    return {};
  };

  const hasAnyVars = (o) =>
    o && typeof o === "object" && Object.keys(o).length > 0;

  PRESETS = list
    .filter(Boolean)
    .map((p) => ({
      id: p.id || p.name || crypto?.randomUUID?.() || String(Math.random()),
      name: p.name || "Untitled",
      category: (p.category || "Other").trim(),
      description: p.description || "",
      light: { vars: normalizeVars(p.light) },
      dark: { vars: normalizeVars(p.dark) }
    }))
    // Hide no-op presets
    .filter((p) => hasAnyVars(p.light.vars) || hasAnyVars(p.dark.vars))
    .filter((p) => !/^classic\b/i.test(p.name || ""));
}

// -------------------------
// Helpers
// -------------------------
function isSystemDark() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function currentScheme() {
  if (state.schemePreview === "light" || state.schemePreview === "dark")
    return state.schemePreview;
  return isSystemDark() ? "dark" : "light";
}

function getSaved() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSaved(obj) {
  localStorage.setItem(THEME_KEY, JSON.stringify(obj));
}

function updateStatus(text) {
  const pill = $("#statusPill");
  if (pill) pill.textContent = text;
}

function safeGetVar(varName) {
  try {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(varName) || ""
    ).trim();
  } catch {
    return "";
  }
}

function applyVars(vars) {
  for (const [k, v] of Object.entries(vars || {})) {
    const s = String(v ?? "").trim();
    if (s) root.style.setProperty(k, s);
  }
}

function clearManagedVars() {
  for (const v of MANAGED_VARS) root.style.removeProperty(v);
}

function toHexish(color) {
  const c = String(color || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) {
    return c.length === 4
      ? "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]
      : c;
  }
  const m = c.match(
    /rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i
  );
  if (m) {
    const r = Math.max(0, Math.min(255, Math.round(Number(m[1]))));
    const g = Math.max(0, Math.min(255, Math.round(Number(m[2]))));
    const b = Math.max(0, Math.min(255, Math.round(Number(m[3]))));
    const hex = (n) => n.toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  }
  return "#777777";
}

// -------------------------
// Preset selection ring (UI only)
// -------------------------
function esc(sel) {
  // CSS.escape fallback (super defensive)
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(sel);
  return String(sel).replace(/["\\#.;,[\]:()=]/g, "\\$&");
}

function markSelectedPreset(id) {
  state.lastPresetId = id || null;

  document.querySelectorAll(".presetbtn.is-selected").forEach((b) => {
    b.classList.remove("is-selected");
  });

  if (!id) return;

  const btn = document.querySelector(`.presetbtn[data-preset-id="${esc(id)}"]`);
  if (btn) btn.classList.add("is-selected");

  // Optional: persist selection while you stay in the tab/session
  try {
    sessionStorage.setItem("theme.lastPresetId", String(id));
  } catch {}
}

// -------------------------
// Favicon live preview (requires /js/favicon-live.js)
// -------------------------
function previewFavicon(color) {
  const c = String(color || "").trim();
  if (!c) return;
  window.BUK1T_FAVICON?.set?.(c);
}

function clearFaviconPreview() {
  window.BUK1T_FAVICON?.clear?.();
}

function getActiveFaviconColorFromDraftOrSavedOrCSS(scheme) {
  const sch = scheme === "light" || scheme === "dark" ? scheme : currentScheme();

  const draftVal = state.draft?.[sch]?.["--favicon"];
  if (draftVal && String(draftVal).trim()) return String(draftVal).trim();

  const saved = getSaved();
  const fromSaved =
    sch === "dark"
      ? saved?.dark?.vars?.["--favicon"]
      : saved?.light?.vars?.["--favicon"];
  if (fromSaved && String(fromSaved).trim()) return String(fromSaved).trim();

  return String(safeGetVar("--favicon") || "").trim();
}

// -------------------------
// Scheme preview (forces UI scheme for editor page)
// -------------------------
function setPreviewScheme(scheme) {
  const el = document.documentElement;

  if (scheme === "auto") {
    delete el.dataset.scheme;
    el.style.removeProperty("color-scheme");
  } else {
    el.dataset.scheme = scheme;
    el.style.setProperty("color-scheme", scheme);
  }
}

function applySavedToPage(saved, schemeOverride) {
  if (!saved) return;

  const scheme =
    schemeOverride === "dark" || schemeOverride === "light"
      ? schemeOverride
      : (isSystemDark() ? "dark" : "light");

  const vars = (scheme === "dark" ? saved.dark?.vars : saved.light?.vars) || {};
  applyVars(vars);
}

// -------------------------
// Draft + value resolution
// -------------------------
function getEditingValue(varName) {
  const sch = state.editingScheme;

  // 1) Draft wins (preview + live edits)
  const d = state.draft?.[sch]?.[varName];
  if (d && String(d).trim() !== "") return String(d).trim();

  // 2) Saved next
  const saved = getSaved();
  const bucket = sch === "dark" ? saved?.dark?.vars : saved?.light?.vars;
  const fromSaved = bucket?.[varName];
  if (fromSaved && String(fromSaved).trim() !== "") return String(fromSaved).trim();

  // 3) CSS computed fallback
  return safeGetVar(varName);
}

function setDraftVar(scheme, varName, value) {
  const sch = scheme === "dark" ? "dark" : "light";
  if (!state.draft[sch]) state.draft[sch] = {};
  const v = String(value ?? "").trim();
  if (!v) delete state.draft[sch][varName];
  else state.draft[sch][varName] = v;
}

// -------------------------
// Scheme controls
// -------------------------
function setSchemePreview(mode) {
  state.schemePreview = mode;

  setPreviewScheme(mode);

  updateStatus(mode === "auto" ? "Auto" : `Preview: ${mode}`);

  state.editingScheme = mode === "auto" ? (isSystemDark() ? "dark" : "light") : mode;

  // Re-apply saved + draft for correct scheme
  const scheme = currentScheme();
  clearManagedVars();

  const saved = getSaved();
  if (saved) applySavedToPage(saved, scheme);

  // Draft overlay (if any)
  applyVars(state.draft?.[scheme] || {});

  // Favicon reflect current scheme (draft > saved > css)
  const fav = getActiveFaviconColorFromDraftOrSavedOrCSS(scheme);
  if (fav) previewFavicon(fav);

  renderControls();
}

function buildSchemeRow(container) {
  const row = document.createElement("div");
  row.className = "scheme-row";

  const label = document.createElement("div");
  label.className = "panel-sub";
  label.style.marginTop = "0";
  label.textContent = "Preview scheme:";

  const mkBtn = (name, mode) => {
    const b = document.createElement("button");
    b.className = "ghostbtn";
    b.type = "button";
    b.textContent = name;
    b.addEventListener("click", () => setSchemePreview(mode));
    return b;
  };

  row.appendChild(label);
  row.appendChild(mkBtn("Auto", "auto"));
  row.appendChild(mkBtn("Light", "light"));
  row.appendChild(mkBtn("Dark", "dark"));

  container.appendChild(row);
}

// -------------------------
// UI sections
// -------------------------
function makeSection(title, hint, expandedByDefault = false) {
  const sec = document.createElement("div");
  sec.className = "theme-section";
  sec.setAttribute("aria-expanded", expandedByDefault ? "true" : "false");

  sec.innerHTML = `
    <div class="theme-section-head" role="button" tabindex="0">
      <div class="theme-section-title">
        <div class="name">${title}</div>
        <div class="hint">${hint}</div>
      </div>
      <div class="theme-caret" aria-hidden="true">
        <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
    </div>
    <div class="theme-section-body"></div>
  `;

  const head = sec.querySelector(".theme-section-head");
  const toggle = () => {
    const on = sec.getAttribute("aria-expanded") === "true";
    sec.setAttribute("aria-expanded", on ? "false" : "true");
  };

  head.addEventListener("click", toggle);
  head.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  return sec;
}

function renderControls() {
  const host = $("#controls");
  if (!host) return;

  host.innerHTML = "";
  buildSchemeRow(host);

  FIELD_GROUPS.forEach((group) => {
    const sec = makeSection(group.title, `${group.hint}  •  Editing: ${state.editingScheme}`);
    const body = sec.querySelector(".theme-section-body");

    const grid = document.createElement("div");
    grid.className = "theme-grid";

    group.fields.forEach((f) => {
      const tile = document.createElement("div");
      tile.className = "theme-tile";

      const currentVal = getEditingValue(f.var);

      tile.innerHTML = `
        <div class="theme-tile-top">
          <div class="theme-label">${f.label}</div>
          <div class="theme-var">${f.var}</div>
        </div>
        <div class="theme-inputrow">
          <input class="theme-text" type="text" value="${currentVal}">
          ${
            f.pick
              ? `<input class="theme-color" type="color" value="${toHexish(currentVal)}">`
              : `<div style="height:44px;"></div>`
          }
        </div>
      `;

      const text = tile.querySelector(".theme-text");
      const picker = tile.querySelector(".theme-color");

      const commitLive = () => {
        const v = text.value.trim();

        // update CSS immediately
        root.style.setProperty(f.var, v);

        // update draft so Save commits the real current UI
        setDraftVar(state.editingScheme, f.var, v);

        updateStatus("Live");
        if (picker) picker.value = toHexish(v);

        if (f.var === "--favicon") previewFavicon(v);
      };

      text.addEventListener("input", commitLive);

      if (picker) {
        picker.addEventListener("input", () => {
          const current = text.value.trim();
          const a = current.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)/i);

          if (a) {
            const hex = picker.value;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            text.value = `rgba(${r}, ${g}, ${b}, ${a[1]})`;
          } else {
            text.value = picker.value;
          }

          commitLive();
        });
      }

      grid.appendChild(tile);
    });

    body.appendChild(grid);
    host.appendChild(sec);
  });
}

// -------------------------
// Presets UI (categorized)
// Click = preview into draft + apply visually
// -------------------------
function buildPresets() {
  const host = $("#presetRow");
  if (!host) return;

  host.innerHTML = "";

  const order = [];
  const map = new Map();

  for (const p of PRESETS) {
    const cat = (p.category || "Other").trim() || "Other";
    if (!map.has(cat)) {
      map.set(cat, []);
      order.push(cat);
    }
    map.get(cat).push(p);
  }

  for (const cat of order) {
    const list = map.get(cat) || [];
    if (!list.length) continue;

    const group = document.createElement("div");
    group.className = "preset-group";

    const head = document.createElement("div");
    head.className = "preset-head";

    const title = document.createElement("div");
    title.className = "preset-title";
    title.textContent = cat;

    const count = document.createElement("div");
    count.className = "preset-count";
    count.textContent = `${list.length}`;

    head.appendChild(title);
    head.appendChild(count);

    const row = document.createElement("div");
    row.className = "preset-row";

    list.forEach((p) => {
      const b = document.createElement("button");
      b.className = "presetbtn";
      b.type = "button";
      b.textContent = p.name;
      b.title = p.description || p.name;

      // selection identity
      b.dataset.presetId = p.id;
      if (state.lastPresetId && state.lastPresetId === p.id) {
        b.classList.add("is-selected");
      }

      b.addEventListener("click", () => {
        previewPreset(p);
        markSelectedPreset(p.id);
      });

      row.appendChild(b);
    });

    group.appendChild(head);
    group.appendChild(row);
    host.appendChild(group);
  }
}

function previewPreset(p) {
  const scheme = currentScheme();
  const vars = scheme === "dark" ? (p.dark?.vars || {}) : (p.light?.vars || {});

  // Push preset vars into draft (for this scheme)
  state.draft[scheme] = { ...(vars || {}) };

  // Re-apply everything: saved baseline + draft overlay
  clearManagedVars();
  const saved = getSaved();
  if (saved) applySavedToPage(saved, scheme);
  applyVars(state.draft[scheme]);

  if (state.schemePreview !== "auto") setPreviewScheme(state.schemePreview);

  const fav = vars?.["--favicon"];
  if (fav) previewFavicon(fav);

  renderControls();
  updateStatus("Previewing preset");
}

// -------------------------
// Save / Reset
// -------------------------
function saveTheme() {
  const existing =
    getSaved() || { mode: "auto", light: { vars: {} }, dark: { vars: {} } };

  // Merge draft into saved for BOTH schemes (only changes where draft has keys)
  const nextLight = {
    ...(existing.light?.vars || {}),
    ...(state.draft.light || {})
  };
  const nextDark = {
    ...(existing.dark?.vars || {}),
    ...(state.draft.dark || {})
  };

  const next = {
    mode: "auto",
    light: { vars: nextLight },
    dark: { vars: nextDark }
  };

  setSaved(next);

  // After save, keep draft as-is (so user can keep tweaking without surprises)
  const scheme = currentScheme();
  clearManagedVars();
  applySavedToPage(next, scheme);
  applyVars(state.draft?.[scheme] || {});

  const fav = getActiveFaviconColorFromDraftOrSavedOrCSS(scheme);
  if (fav) previewFavicon(fav);

  renderControls();
  updateStatus("Saved");
}

function resetTheme() {
  const ok = confirm("Reset theme to defaults for this browser?");
  if (!ok) return;

  localStorage.removeItem(THEME_KEY);
  clearManagedVars();
  delete root.dataset.scheme;

  state.schemePreview = "auto";
  state.editingScheme = isSystemDark() ? "dark" : "light";
  state.draft.light = {};
  state.draft.dark = {};
  state.lastPresetId = null;

  try {
    sessionStorage.removeItem("theme.lastPresetId");
  } catch {}

  clearFaviconPreview();

  renderControls();
  updateStatus("Default");
}

// -------------------------
// Init
// -------------------------
(async function init() {
  window.renderVersionBadge?.();

  // restore last selected preset (session only)
  try {
    const id = sessionStorage.getItem("theme.lastPresetId");
    if (id) state.lastPresetId = id;
  } catch {}

  // init state
  state.editingScheme = currentScheme();

  // apply saved theme for current scheme
  const saved = getSaved();
  if (saved) applySavedToPage(saved, currentScheme());

  // favicon at boot
  const fav = getActiveFaviconColorFromDraftOrSavedOrCSS(currentScheme());
  if (fav) previewFavicon(fav);

  // load presets
  try {
    await loadPresets();
    buildPresets();
  } catch (e) {
    console.error(e);
    updateStatus("Preset load failed");
  }

  renderControls();

  $("#saveBtn")?.addEventListener("click", saveTheme);
  $("#resetBtn")?.addEventListener("click", resetTheme);

  // system scheme flip while auto
  try {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (state.schemePreview === "auto") {
        state.editingScheme = currentScheme();

        clearManagedVars();
        const s = getSaved();
        if (s) applySavedToPage(s, currentScheme());

        // overlay draft for whichever scheme is now active
        applyVars(state.draft?.[currentScheme()] || {});

        const f = getActiveFaviconColorFromDraftOrSavedOrCSS(currentScheme());
        if (f) previewFavicon(f);

        renderControls();
        updateStatus("Auto");
      }
    });
  } catch {}
})();