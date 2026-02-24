// /js/features/settings-links.js

import { $ } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/store.js";
import { renderIconById, openIconPicker } from "../lib/icons.js";
import { uuid } from "../lib/ids.js";

const LINKS_KEY = "home.links.v1";

function getLinks() {
  const links = loadJSON(LINKS_KEY, []);
  return Array.isArray(links) ? links : [];
}

function setLinks(links) {
  saveJSON(LINKS_KEY, links);
}

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  if (s.includes(".")) return "https://" + s;
  return s;
}

export async function initSettingsLinks() {
  const root = $("#linksList");
  if (!root) return;

  async function render() {
    const links = getLinks();
    root.innerHTML = "";

    if (!links.length) {
      root.innerHTML = `<div class="panel-sub">No links yet — add one.</div>`;
      return;
    }

    for (let i = 0; i < links.length; i++) {
      const l = links[i] || {};
      const card = document.createElement("div");
      card.className = "settings-link-card";

      card.innerHTML = `
        <button class="settings-link-iconbtn" type="button" aria-label="Pick icon"></button>

        <div class="settings-link-body">
          <input class="settings-input title" placeholder="Title">
          <input class="settings-input url" placeholder="https://example.com">
          <div class="settings-link-controls">
            <button class="settings-mini-btn up" type="button" title="Move up">↑</button>
            <button class="settings-mini-btn down" type="button" title="Move down">↓</button>
            <button class="settings-mini-btn del" type="button">Delete</button>
          </div>
        </div>
      `;

      const iconBtn = card.querySelector(".settings-link-iconbtn");
      const titleInp = card.querySelector(".title");
      const urlInp = card.querySelector(".url");
      const upBtn = card.querySelector(".up");
      const downBtn = card.querySelector(".down");
      const delBtn = card.querySelector(".del");

      titleInp.value = l.title || "";
      urlInp.value = l.url || "";

      const iconId = String(l.icon || "link").trim() || "link";
      iconBtn.innerHTML = await renderIconById(iconId, { size: 22 });

      titleInp.addEventListener("input", () => {
        const next = getLinks();
        next[i].title = titleInp.value;
        setLinks(next);
      });

      urlInp.addEventListener("input", () => {
        const next = getLinks();
        next[i].url = normalizeUrl(urlInp.value);
        setLinks(next);
      });

      iconBtn.addEventListener("click", async () => {
        const picked = await openIconPicker({ currentId: iconId });
        if (!picked) return;

        const next = getLinks();
        next[i].icon = picked;
        setLinks(next);

        iconBtn.innerHTML = await renderIconById(picked, { size: 22 });
      });

      upBtn.addEventListener("click", async () => {
        if (i === 0) return;
        const next = getLinks();
        [next[i - 1], next[i]] = [next[i], next[i - 1]];
        setLinks(next);
        await render();
      });

      downBtn.addEventListener("click", async () => {
        const next = getLinks();
        if (i >= next.length - 1) return;
        [next[i + 1], next[i]] = [next[i], next[i + 1]];
        setLinks(next);
        await render();
      });

      delBtn.addEventListener("click", async () => {
        const next = getLinks();
        next.splice(i, 1);
        setLinks(next);
        await render();
      });

      root.appendChild(card);
    }
  }

  async function addLink() {
    const next = getLinks();
    next.unshift({
      id: uuid(),
      title: "New Link",
      url: "",
      icon: "link"
    });
    setLinks(next);
    await render();
  }

  $("#addLinkBtn")?.addEventListener("click", addLink);

  await render();
}