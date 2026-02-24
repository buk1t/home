// /js/features/settings-archive.js
import { $ } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/store.js";

const STORE_KEY = "home.state.v1";

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
      text.style.textDecoration = "none";
      text.style.opacity = "0.9";
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

export function initSettingsArchive() {
  const list = $("#archiveList");
  if (!list) return;

  renderArchive();

  $("#archiveRefreshBtn")?.addEventListener("click", renderArchive);

  $("#archiveClearBtn")?.addEventListener("click", () => {
    const st = loadChecklistState();
    if (!st.archived?.length) return;

    const ok = confirm("Clear ALL archived tasks? This cannot be undone.");
    if (!ok) return;

    st.archived = [];
    saveChecklistState(st);
    renderArchive();
  });
}