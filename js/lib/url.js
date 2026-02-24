export function isLikelyUrl(text) {
  const s = String(text || "").trim();
  if (!s) return false;
  if (/^https?:\/\//i.test(s)) return true;
  return !/\s/.test(s) && /\.[a-z]{2,}([/:?#]|$)/i.test(s);
}

export function normalizeUrl(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/") || s.startsWith("./")) return s;
  return `https://${s}`;
}