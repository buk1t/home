// /js/features/links-grid.js
import { $ } from "../lib/dom.js";
import { loadJSON } from "../lib/store.js";
import { renderIconById } from "../lib/icons.js";

const LINKS_KEY = "home.links.v1";

function getLinks() {
  const links = loadJSON(LINKS_KEY, []);
  return Array.isArray(links) ? links : [];
}

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/") || s.startsWith("./")) return s;
  if (s.includes(".")) return "https://" + s;
  return s;
}

export async function initLinksGrid() {
  const root = $("#linksGrid");
  if (!root) return;

  const links = getLinks();
  root.innerHTML = "";

  if (!links.length) {
    root.innerHTML = `
      <a class="link-card" href="..." target="_blank" rel="noopener">
      <div class="link-ico">
        <!-- svg icon -->
      </div>

    <div class="link-meta">
      <div class="link-title">Title</div>
    <div class="link-sub">domain.com</div>
  </div>

  <div class="link-arrow" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 18l6-6-6-6"></path>
    </svg>
  </div>
</a>
    `;
    const iconSlot = root.querySelector(".icon");
    if (iconSlot) iconSlot.innerHTML = await renderIconById("link");
    return;
  }

  for (const l of links) {
    const title = String(l?.title || "").trim() || "Untitled";
    const url = normalizeUrl(l?.url || "/settings") || "/settings";
    const iconId = String(l?.icon || "link").trim() || "link";

    const a = document.createElement("a");
    a.className = "card";
    a.href = url;

    a.innerHTML = `
      <div class="card-top">
        <span class="icon" aria-hidden="true"></span>
        <div class="card-title"></div>
      </div>
    `;

    a.querySelector(".card-title").textContent = title;
    const iconSlot = a.querySelector(".icon");
    if (iconSlot) iconSlot.innerHTML = await renderIconById(iconId);

    root.appendChild(a);
  }
}