import { image, escape, price, asset, rarityColor } from "./items.js";
// ItemVisualCard / getItemImageStyle from the saved original components.
export function itemImageScale(item, src) {
  const source = String(src || '').toLowerCase();
  const original = /^https?:/.test(source) ? source : String(item?.image || source).toLowerCase();
  if (/pricempire\.(com|net)/.test(original)) return .82;
  return String(item?.marketName ?? item?.name ?? '').trim().includes('★') ? .9 : 1;
}
export const exterior = (item) =>
  ({
    "Factory New": "FN",
    "Minimal Wear": "MW",
    "Field-Tested": "FT",
    "Well-Worn": "WW",
    "Battle-Scarred": "BS",
  })[item?.exterior] ||
  /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/
    .exec(item?.marketName || "")?.[1]
    ?.replace("Factory New", "FN")
    .replace("Minimal Wear", "MW")
    .replace("Field-Tested", "FT")
    .replace("Well-Worn", "WW")
    .replace("Battle-Scarred", "BS") ||
  "";
export function names(item) {
  const [type, ...rest] = (item.marketName || item.title || "Предмет").split(
    " | ",
  );
  return [
    type,
    (rest.join(" | ") || item.skin || "").replace(
      /\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/,
      "",
    ),
  ];
}
// Clone saved DOM: decoration and geometry remain in the reference stylesheet.
export function referenceCard(
  template,
  item,
  action,
  selected = false,
  kind = "upgrade",
) {
  const node = template.cloneNode(true);
  node.querySelectorAll('.progressive-image-pending').forEach(img =>
    img.classList.remove('progressive-image-pending'));
  const [type, skin] = names(item);
  node.removeAttribute("data-testid");
  node.dataset.id = item.instanceId || item.id;
  node.dataset.action = action;
  node.classList.add("reference-item");
  node.classList.toggle("selected", selected);
  node.setAttribute("role", "button");
  node.tabIndex = 0;
  node.setAttribute("aria-label", item.marketName || item.title);
  node.setAttribute("aria-pressed", String(selected));
  if (kind === 'case') {
    delete node.dataset.action;
    node.removeAttribute('role');
    node.removeAttribute('tabindex');
    node.removeAttribute('aria-pressed');
  }
  node
    .querySelectorAll("[data-testid]")
    .forEach((n) => n.removeAttribute("data-testid"));
  const art = node.querySelector("img[alt]");
  // A cloned, decoded template can keep showing its previous sticker while
  // the replacement URL is pending. Reveal only this item's own decoded art.
  const artUrl = image(item);
  art.style.scale = String(itemImageScale(item, artUrl));
  art.style.transformOrigin = 'center';
  art.removeAttribute('srcset');
  art.classList.add('item-art-pending');
  art.dataset.itemArt = 'true';
  let retries = 0;
  art.onload = async () => {
    try { await art.decode(); } catch { return; }
    if (art.naturalWidth && art.getAttribute('src') === artUrl)
      art.classList.remove('item-art-pending');
  };
  art.onerror = () => {
    art.classList.add('item-art-pending');
    if (++retries <= 2) setTimeout(() => {
      if (art.isConnected) art.src = artUrl;
    }, retries * 1500);
  };
  art.src = artUrl;
  art.alt = item.marketName || item.title;
  art.loading = "lazy";
  const line = [...node.querySelectorAll("[style]")].find(
    (n) => n.style.backgroundColor,
  );
  if (line) line.style.backgroundColor = rarityColor(item);
  const texts = node.querySelectorAll(".allow-text-select span");
  if (texts[0]) texts[0].textContent = type;
  if (texts[1]) texts[1].textContent = skin;
  if (kind === "upgrade") {
    if (action === 'choose-input' || action === 'choose-target') {
      const marker = document.createElement('span');
      marker.className = 'upgrade-item-marker';
      marker.setAttribute('aria-hidden', 'true');
      marker.innerHTML = '<span class="upgrade-selection-dot"></span><svg class="upgrade-lock-icon" viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';
      node.append(marker);
    }
    const badge = node.querySelector(".tabular-nums");
    badge.textContent = Number(item.price).toFixed(2);
    const box = badge.parentElement.parentElement;
    const e = document.createElement("span");
    e.dataset.exterior = "";
    e.className = "reference-exterior font-sofia-sans text-[1.2rem] font-[600] leading-[1.4rem] text-white lg:text-[0.9rem] lg:leading-[1.1rem]";
    e.textContent = exterior(item);
    box.append(e);
  }
  return node;
}
export function featuredCard(item) {
  const [type, skin] = names(item);
  const formatted = Number(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `<div class="reference-featured" style="--rarity:${rarityColor(item)}"><div class="featured-price">${formatted} <img src="${asset("coin.svg")}" alt=""><small>${exterior(item)}</small></div><img class="featured-image" style="scale:${itemImageScale(item, image(item))};transform-origin:center" src="${escape(image(item))}" alt="${escape(item.marketName)}"><div class="featured-name"><b>${escape(type)}</b><span>${escape(skin)}</span></div><div class="featured-rarity"></div></div>`;
}
