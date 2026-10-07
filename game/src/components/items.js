export const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const price = (n) =>
  Number(n || 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
let map = {},
  itemImages = {};
export function setItemImages(m) {
  itemImages = m;
}
export function setAssets(m) {
  map = m;
}
export function image(i) {
  if (itemImages[i?.marketName] && !/\/100fx/.test(itemImages[i.marketName])) return itemImages[i.marketName];
  const s = i?.image || "";
  const name = s.split("/").at(-1);
  if (map[name] && !/^(100|360)fx/.test(name)) return map[name];
  try {
    const u = new URL(
      s,
      s.startsWith("/") ? "https://caser.one" : location.origin,
    );
    return [
      "https://caser.one",
      "https://cs2-cdn.pricempire.com",
      "https://community.akamai.steamstatic.com",
      "https://cdn.pricempire.com",
    ].includes(u.origin)
      ? u.href
      : "./src/fallback.svg";
  } catch {
    return "./src/fallback.svg";
  }
}
export const asset = name => map[name] || "./src/fallback.svg";
export function rarityColor(i) {
  const name = i.marketName || i.title || "Предмет";
  const color =
    name.includes("★") || name.includes("M4A4 | Howl")
      ? "#FFAE39"
      : name.startsWith("Sticker")
        ? "#8847FF"
        : {
            1: "#B0C3D9",
            2: "#4B69FF",
            3: "#8847FF",
            4: "#EB4B4B",
            5: "#D32CE6",
            6: "#D32CE6",
            7: "#EB4B4B",
            8: "#4B69FF",
            9: "#8847FF",
            10: "#EB4B4B",
            11: "#FFAE39",
            12: "#D32CE6",
            13: "#B0C3D9",
            14: "#5E98D9",
            15: "#4B69FF",
            16: "#8847FF",
          }[i.rarity] || "#B0C3D9";
  return color;
}
export function card(i, action = "", selected = false) {
  const name=i.marketName || i.title || "Предмет", color=rarityColor(i);
  return `<button class="demo-item ${selected ? "selected" : ""}" style="--rarity:${color}" data-action="${action}" data-id="${escape(i.instanceId || i.id)}" title="${escape(name)}"><div class="item-art"><span class="item-price">${price(i.price)} <img class="currency-icon" src="${map["coin.svg"]}" alt="DEMO"></span><img loading="lazy" src="${escape(image(i))}" alt="${escape(name)}"></div><b>${escape(name.split(" | ")[0])}</b><small>${escape(name.split(" | ").slice(1).join(" | ") || i.skin || "")}</small></button>`;
}
export function controls(prefix = "") {
  return `<div class="demo-controls"><input id="${prefix}search" placeholder="Поиск по названию"><select id="${prefix}sort"><option value="asc">Цена ↑</option><option value="desc">Цена ↓</option><option value="name">Название</option><option value="rarity">Редкость</option><option value="new">По новизне</option></select></div>`;
}
export function sortItems(items, mode) {
  return [...items].sort((a, b) =>
    mode === "name"
      ? a.marketName.localeCompare(b.marketName)
      : mode === "rarity"
        ? Number(b.rarity) - Number(a.rarity)
        : mode === "new"
          ? (b.obtainedAt || 0) - (a.obtainedAt || 0)
          : mode === "desc"
            ? Number(b.price) - Number(a.price)
            : Number(a.price) - Number(b.price),
  );
}
