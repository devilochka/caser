// Checks once per page load whether an optional local asset exists (a 1-byte
// ranged GET, so the DEMO server still only sees GET requests).
const cache = new Map();
export function probe(url) {
  if (!cache.has(url))
    cache.set(
      url,
      fetch(url, { headers: { Range: "bytes=0-0" }, cache: "no-store" })
        .then((r) => r.ok)
        .catch(() => false),
    );
  return cache.get(url);
}
