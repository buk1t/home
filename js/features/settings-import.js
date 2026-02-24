// /js/features/settings-import.js
import { $ } from "../lib/dom.js";

const THEME_KEY = "home.theme.v1";
const EXPORT_PREFIX = "home.";

function setMsg(text) {
  const el = $("#importExportMsg");
  if (!el) return;
  el.textContent = text || "";
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function toB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromB64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

function listPrefixedKeys(prefix) {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) out.push(k);
  }
  return out.sort();
}

function exportSettingsPlainText() {
  const keys = Array.from(new Set([...listPrefixedKeys(EXPORT_PREFIX), THEME_KEY])).sort();

  const meta = [
    "# buk1t-home settings export",
    `# exportedAt: ${new Date().toISOString()}`,
    "",
  ].join("\n");

  if (!keys.length) {
    downloadText("home-settings.txt", meta + "# (no keys found)\n");
    setMsg("Exported (empty). No home.* settings found yet.");
    return;
  }

  let body = meta;
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw == null) continue;
    body += `[${k}]\n${toB64(raw)}\n\n`;
  }

  const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  downloadText(`home-settings-${stamp}.txt`, body);
  setMsg("Exported. (Check Downloads.)");
}

function parsePlainTextExport(text) {
  const lines = String(text || "").split(/\r?\n/);
  const data = {};
  let currentKey = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("[") && line.endsWith("]")) {
      currentKey = line.slice(1, -1).trim();
      continue;
    }
    if (currentKey) {
      data[currentKey] = line;
      currentKey = null;
    }
  }
  return data;
}

function validateImportedTextMap(map) {
  if (!map || typeof map !== "object") return { ok: false, reason: "Bad file format." };
  const keys = Object.keys(map).filter((k) => k.startsWith(EXPORT_PREFIX));
  if (!keys.length) return { ok: false, reason: "No home.* keys found in file." };

  for (const k of keys) {
    const v = map[k];
    if (typeof v !== "string" || v.length < 2) return { ok: false, reason: `Missing value for ${k}` };
  }
  return { ok: true, keys };
}

async function importSettingsPlainTextFile(file) {
  const text = await file.text();
  const map = parsePlainTextExport(text);
  const v = validateImportedTextMap(map);

  if (!v.ok) {
    setMsg(`Import failed: ${v.reason}`);
    return;
  }

  const existing = listPrefixedKeys(EXPORT_PREFIX);
  for (const k of existing) localStorage.removeItem(k);

  for (const k of v.keys) {
    try {
      localStorage.setItem(k, fromB64(map[k]));
    } catch {
      setMsg(`Import failed: Could not decode ${k}`);
      return;
    }
  }

  setMsg("Imported! Reloading…");
  setTimeout(() => window.location.reload(), 350);
}

export function initSettingsImport() {
  const exportBtn = $("#exportBtn");
  const importFile = $("#importFile");

  if (!exportBtn && !importFile) return;

  exportBtn?.addEventListener("click", exportSettingsPlainText);

  importFile?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ok = confirm("Importing will overwrite ALL current home.* settings. Continue?");
    if (!ok) return;

    try {
      await importSettingsPlainTextFile(file);
    } catch {
      setMsg("Import failed: Could not read the file.");
    }
  });
}