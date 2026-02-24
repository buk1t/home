// /js/pages/changelog.js

function $(id) {
  return document.getElementById(id);
}

function formatDate(iso) {
  const s = String(iso || "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

(async function init() {
  const list = $("changelogList");
  const note = $("updatedNote");
  if (!list) return;

  list.innerHTML = `<div class="panel-sub">Loading…</div>`;

  try {
    const res = await fetch("/json/changelog.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`changelog.json failed: ${res.status}`);
    const json = await res.json();

    const entries = Array.isArray(json?.entries) ? json.entries : [];
    list.innerHTML = "";

    const latest = entries[0]?.version || "";
    if (note) note.textContent = latest ? `Latest: ${latest}` : "Latest: —";

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i] || {};
      const card = el("article", "entry");

      const top = el("div", "entry-top");
      const left = el("div", "entry-ver");
      left.textContent = e.version || "—";

      const badge = el("span", "badge");
      badge.textContent = i === 0 ? "latest" : "major";
      left.appendChild(badge);

      const date = el("div", "entry-date");
      date.textContent = formatDate(e.date);

      top.appendChild(left);
      top.appendChild(date);

      const body = el("div", "entry-body");
      const title = el("div");
      title.textContent = e.title || "";
      body.appendChild(title);

      if (Array.isArray(e.bullets) && e.bullets.length) {
        const ul = el("ul");
        for (const b of e.bullets) {
          const li = el("li");
          li.textContent = String(b || "");
          ul.appendChild(li);
        }
        body.appendChild(ul);
      }

      card.appendChild(top);
      card.appendChild(body);
      list.appendChild(card);
    }
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="panel-sub">Changelog unavailable.</div>`;
    if (note) note.textContent = "Latest: —";
  }
})();