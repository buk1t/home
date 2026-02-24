import { $ } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/store.js";
import { uuid } from "../lib/ids.js";

const STORE_KEY = "home.state.v1";

function defaultState() {
  const now = Date.now();
  return {
    active: [
      { id: uuid(), text: "Do laundry", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Go grocery shopping", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Buy valentines gift", created: now, checked: false, pendingArchiveAt: null },
      { id: uuid(), text: "Walk dog", created: now, checked: false, pendingArchiveAt: null },
    ],
    archived: [],
  };
}

function loadState() {
  const st = loadJSON(STORE_KEY, null);
  if (!st || typeof st !== "object") return defaultState();
  return {
    active: Array.isArray(st.active) ? st.active : defaultState().active,
    archived: Array.isArray(st.archived) ? st.archived : [],
  };
}

function saveState(state) {
  saveJSON(STORE_KEY, state);
}

function focusInputByTaskId(id) {
  const inp = document.querySelector(`input[data-task-id="${id}"]`);
  if (!inp) return;
  inp.focus({ preventScroll: true });
  const v = inp.value || "";
  try { inp.setSelectionRange(v.length, v.length); } catch {}
}

function renderActive(state) {
  const root = $("#todo");
  if (!root) return;
  root.innerHTML = "";

  state.active.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = "todo-item" + (t.checked ? " done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!t.checked;

    cb.addEventListener("change", () => {
      t.checked = cb.checked;
      t.pendingArchiveAt = t.checked ? Date.now() + 5000 : null;
      saveState(state);
      renderActive(state);
    });

    const textWrap = document.createElement("div");
    textWrap.className = "todo-text";

    const input = document.createElement("input");
    input.type = "text";
    input.value = t.text ?? "";
    input.placeholder = "New task…";
    input.setAttribute("data-task-id", t.id);

    input.addEventListener("input", () => {
      t.text = input.value;
      saveState(state);
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const newTask = { id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null };
        state.active.splice(idx + 1, 0, newTask);
        saveState(state);
        renderActive(state);
        requestAnimationFrame(() => focusInputByTaskId(newTask.id));
        return;
      }

      if (e.key === "Backspace" && (input.value || "").length === 0) {
        if (state.active.length === 1) return;
        e.preventDefault();
        state.active.splice(idx, 1);
        saveState(state);
        renderActive(state);
        const target = state.active[Math.max(0, idx - 1)] || state.active[0];
        requestAnimationFrame(() => focusInputByTaskId(target.id));
        return;
      }

      if (e.key === "ArrowUp") {
        const prev = state.active[idx - 1];
        if (prev) { e.preventDefault(); focusInputByTaskId(prev.id); }
      }

      if (e.key === "ArrowDown") {
        const next = state.active[idx + 1];
        if (next) { e.preventDefault(); focusInputByTaskId(next.id); }
      }
    });

    textWrap.appendChild(input);
    row.appendChild(cb);
    row.appendChild(textWrap);
    root.appendChild(row);
  });
}

function tickArchive(state) {
  const now = Date.now();
  let moved = false;

  const remaining = [];
  for (const t of state.active) {
    if (t.checked && t.pendingArchiveAt && now >= t.pendingArchiveAt) {
      state.archived.push({ id: t.id, text: t.text, created: t.created, archivedAt: now });
      moved = true;
    } else {
      remaining.push(t);
    }
  }

  if (moved) {
    state.active = remaining.length
      ? remaining
      : [{ id: uuid(), text: "", created: Date.now(), checked: false, pendingArchiveAt: null }];

    saveState(state);
    renderActive(state);
  }
}

export function initChecklist() {
  const root = $("#todo");
  if (!root) return;

  const state = loadState();
  saveState(state);
  renderActive(state);

  setInterval(() => tickArchive(state), 500);
}