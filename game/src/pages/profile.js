// Profile page (/ru/profile on caser.one). The saved page provides the header
// cards (user, best drop, withdrawn, coupon), the tabs and the empty state;
// the tab contents are rebuilt from the original components in the saved
// bundles (0yxsmxhhay2h2: ProfileContent/ItemsList/inventory card,
// 0sd60r_7plt60: InventoryHistory, UpgradeList, BestDrop) with the same
// Tailwind classes, filled from the local DEMO store.
import { escape, image, rarityColor } from "../components/items.js";
import { openRatingDialog } from '../components/ratingDialog.js';
import { showToast, confirmItemSale, confirmSellAll, openReplaceItem, setCoin } from "../components/siteUi.js";

const CDN_ICON = {
  arrow: "./icons/profile/upgrades/arrowIcon.svg",
  copy: "./icons/profile/upgrades/copy.svg",
  bet: "./images/profile/upgrades/bet.webp",
  bgTop: "./images/profile/upgrades/bgTop.webp",
  bg: "./images/profile/upgrades/bg.webp",
  bgMystery: "./images/profile/upgrades/bgMistery.webp",
  mysterySmoke: "./video/mystery-smoke.webm",
  buy: "./icons/profile/buy.svg",
  steamWhite: "./icons/general/steamWhiteIcon.svg",
  upgradeWhite: "./icons/profile/upgrageSmallWhite.svg",
  upgraderSmall: "./icons/profile/history/upgraderSmall.svg",
  giveaway: "./images/profile/history/giveaway.webp",
  testCase: "./images/main/testCase.webp",
  bestDropEmpty: "./images/profile/bestDrop/empty.webp",
  change: "./icons/items/change.svg",
  changeSmall: "./icons/profile/history/changeSmall.svg",
  changeBig: "./icons/profile/history/changeBig.svg",
};
const BOT = {
  orange: "./images/profile/upgrades/bgBotOrange.webp",
  green: "./images/profile/upgrades/bgBotGreen.webp",
  purple: "./images/profile/upgrades/bgBotPurple.webp",
  blue: "./images/profile/upgrades/bgBotBlue.webp",
  lose: "./images/profile/upgrades/bgBotLose.webp",
};
// Inline stand-ins, used when an original icon is not downloaded yet.
const SVG = {
  arrow: '<svg viewBox="0 0 24 24" class="w-[2.4rem] h-[2.4rem]" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  upgrade: '<svg viewBox="0 0 24 24" class="w-[2rem] h-[2rem]" fill="none" aria-hidden="true"><path d="M5 12.5 12 6l7 6.5M5 18.5 12 12l7 6.5" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  upgradeBig: '<svg viewBox="0 0 46 46" class="absolute left-[0.5rem] bottom-[1.1rem] z-[2] w-[4.6rem] h-[4.6rem] drop-shadow-lg lg:bottom-auto lg:top-[0.5rem] lg:w-[3.2rem] lg:h-[3.2rem]" fill="none" aria-hidden="true"><path d="M5 22 23 6l18 16v9L23 15 5 31z" fill="#fff" fill-opacity=".85"/><path d="M5 35 23 19l18 16v8L23 27 5 43z" fill="#fff" fill-opacity=".6"/></svg>',
  sold: '<svg viewBox="0 0 24 24" class="w-[2rem] h-[2rem]" fill="none" aria-hidden="true"><ellipse cx="12" cy="6.5" rx="7" ry="3" stroke="#fff" stroke-width="1.8"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" stroke="#fff" stroke-width="1.8"/></svg>',
  steam: '<svg viewBox="0 0 24 24" class="w-[2.4rem] h-[2.4rem] lg:w-[2.25rem] lg:h-[2.25rem]" aria-hidden="true"><path fill="#fff" d="M12 2a10 10 0 0 0-9.96 9.2l5.36 2.2a2.8 2.8 0 0 1 1.6-.5h.16l2.38-3.45v-.05a3.77 3.77 0 1 1 3.77 3.77h-.09l-3.4 2.42v.13a2.83 2.83 0 0 1-5.6.6L2.4 14.8A10 10 0 1 0 12 2Zm-4.73 15.17-1.23-.5a2.12 2.12 0 1 0 1.16-2.9l1.27.52a1.56 1.56 0 1 1-1.2 2.88Zm9.57-7.78a2.51 2.51 0 1 0-2.51 2.5 2.51 2.51 0 0 0 2.5-2.5Zm-4.4 0a1.89 1.89 0 1 1 1.89 1.88 1.89 1.89 0 0 1-1.89-1.88Z"/></svg>',
  copy: '<svg viewBox="0 0 16 16" class="h-[1.6rem] w-[1.6rem]" fill="none" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/><path d="M11 3.5V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h.5" stroke="#fff" stroke-opacity=".7" stroke-width="1.4"/></svg>',
};
SVG.change = '<svg viewBox="0 0 24 24" class="w-[2.4rem] h-[2.4rem]" fill="none" aria-hidden="true"><path d="M19 8.5A7.5 7.5 0 0 0 5.6 7M5 15.5A7.5 7.5 0 0 0 18.4 17" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M19.5 4v4.8h-4.8M4.5 20v-4.8h4.8" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
SVG.changeBig = SVG.change.replace('class="w-[2.4rem] h-[2.4rem]"', 'class="absolute left-[0.5rem] bottom-[1.1rem] z-[2] w-[4.6rem] h-[4.6rem] drop-shadow-lg lg:bottom-auto lg:top-[0.5rem] lg:w-[3.2rem] lg:h-[3.2rem]"');
const EXTERIOR = { 1: "BS", 2: "FN", 3: "FT", 4: "MW", 5: "WW", 6: "NP" };
const PAGE = 21;
const GRAD = "bg-[linear-gradient(180deg,#454645_0%,#939393_100%)]";
const money = (n) => (Number(n) || 0).toFixed(2);
// Decorative original image: removed when the file is not available locally.
// (no inline handlers: the DEMO server's CSP forbids them; see onImageError)
const deco = (src, cls) => `<img src="${src}" class="${cls}" alt="" data-deco>`;
// Original icon with an inline fallback when the file is missing.
const icon = (src, fallback, cls) =>
  `<img src="${src}" class="${cls}" alt="" data-fallback="${escape(fallback)}">`;
function onImageError(e) {
  const t = e.target;
  if (t.tagName === "VIDEO" && t.dataset.deco !== undefined) t.remove();
  if (t.tagName !== "IMG") return;
  if (t.dataset.fallback) t.outerHTML = t.dataset.fallback;
  else if (t.dataset.deco !== undefined) t.remove();
}

export function displayNames(item) {
  const full = item?.marketName || item?.name || "";
  const [type, ...rest] = full.split("|");
  const name = rest
    .join("|")
    .trim()
    .replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, "");
  return { type: type.trim() || full || "—", name };
}
const plural = (n) => {
  const a = Math.abs(n) % 100,
    b = a % 10;
  return a > 10 && a < 20 ? "предметов" : b > 1 && b < 5 ? "предмета" : b === 1 ? "предмет" : "предметов";
};

export function profile(app) {
  const el = app.content;
  el.addEventListener("error", onImageError, true);
  const by = (id) => el.querySelector(`[data-testid="${id}"]`);
  const coin = by("profile-balance-value")?.nextElementSibling?.getAttribute("src") || "./src/fallback.svg";
  setCoin(coin);
  const coinImg = (cls) => `<img src="${escape(coin)}" class="${cls}" alt="">`;
  const caseBySlug = new Map(app.cases.map((c) => [c.slug, c]));
  const state = () => app.store.state;

  // ---- header cards -------------------------------------------------------
  function fillHeader() {
    const s = state();
    by("profile-balance-value").textContent = money(s.balance);
    by("profile-stat-cases-opened").textContent = s.openingHistory.reduce((n, o) => n + (o.count || 1), 0);
    by("profile-stat-upgrades-made").textContent = s.upgradeHistory.filter((h) => h.mode !== "mystery").length;
    by("profile-stat-mystery-upgrades").textContent = s.upgradeHistory.filter((h) => h.mode === "mystery").length;
    by("profile-withdrawn-total").textContent = money(0);
    by("profile-withdrawn-items-count").textContent = "0 " + plural(0);
    // Best drop: the most expensive item ever received.
    const best = [...(s.itemLog || []), ...s.inventory.map((i) => ({ item: i, price: i.price }))].reduce(
      (b, e) => (!b || Number(e.price) > Number(b.price) ? e : b),
      null,
    );
    const card = by("profile-best-drop");
    const [textCol, artCol] = card.children;
    const info = textCol.children[1];
    if (best) {
      const { type, name } = displayNames(best.item);
      info.innerHTML = `<div class="allow-text-select flex flex-col lg:gap-[0.5rem]"><span class="font-sofia-sans text-[1.6rem] text-white font-[400] leading-[1.9rem] opacity-50 [font-feature-settings:'ss01'_on] lg:text-[1.4rem] lg:leading-[1.7rem] truncate">${escape(type)}</span>${name ? `<span class="font-sofia-sans text-[2.4rem] text-white font-[600] leading-[2.9rem] [font-feature-settings:'ss01'_on] lg:text-[1.8rem] lg:leading-[2.2rem] truncate">${escape(name)}</span>` : ""}</div><div class="flex items-center gap-[0.5rem] lg:hidden"><span class="text-[2rem] text-white font-[400] leading-[2rem] font-oswald" data-testid="profile-best-drop-price">${money(best.price)}</span>${coinImg("w-[2.4rem] h-[2.4rem]")}</div>`;
      artCol.innerHTML = `<div class="flex items-center justify-center h-full w-full border-[0.1rem] border-solid border-black-100"><img src="${escape(image(best.item))}" class="w-[21.4rem] max-h-full object-contain lg:w-[10.568rem] lg:h-[7.926rem]" alt="${escape(best.item.marketName)}"></div><div class="absolute bottom-0 left-0 h-[0.6rem] w-full lg:h-[0.4rem]" style="background-color:${rarityColor(best.item)}"></div><div class="hidden lg:flex absolute top-[0.5rem] right-[0.5rem] items-center gap-[0.5rem]"><span class="text-[1.4rem] text-white font-[400] font-oswald leading-[1.4rem]">${money(best.price)}</span>${coinImg("w-[1.4rem] h-[1.4rem]")}</div>`;
    } else {
      info.innerHTML = `<span class="text-[1.6rem] text-white-550 font-[500] max-w-[13.5rem] lg:text-[1.4rem] lg:max-w-[11.8rem]" data-testid="profile-best-drop-empty">Откройте кейс, чтобы получить лучший дроп</span>`;
      artCol.innerHTML = `<div class="flex items-center justify-center h-full w-full border-[0.1rem] border-solid border-black-100">${deco(CDN_ICON.bestDropEmpty, "w-[21.4rem] max-h-full object-contain lg:w-[10.568rem] lg:h-[7.926rem]")}</div><div class="absolute bottom-0 left-0 h-[0.6rem] w-full lg:h-[0.4rem] bg-white-250"></div>`;
    }
  }

  // Coupon: same states as the original CouponInput; DEMO has no coupons.
  const couponBox = by("coupon-input-field").parentElement,
    couponInput = by("coupon-input-field"),
    couponButton = by("coupon-input-apply-button");
  const couponLabel = couponButton.querySelector("span");
  const syncCoupon = (status = "idle", message = "") => {
    const empty = !couponInput.value.trim();
    couponButton.disabled = empty;
    couponButton.classList.toggle("cursor-not-allowed", empty);
    couponButton.classList.toggle("cursor-pointer", !empty);
    couponLabel.classList.toggle("text-white/50", empty);
    couponLabel.classList.toggle("text-white", !empty);
    couponBox.classList.toggle("border-white/15", status === "idle");
    couponBox.classList.toggle("border-[#FF6666]", status === "error");
    couponBox.classList.toggle("bg-black/25", status === "error");
    couponBox.querySelector("[data-testid=coupon-input-error]")?.remove();
    if (status === "error")
      couponBox.insertAdjacentHTML(
        "beforeend",
        `<span class="shrink-0 max-w-[12rem] truncate font-sofia-sans text-[1.2rem] font-[400] text-[#FF6666] tracking-[-0.02em] [font-feature-settings:'ss01'_on]" data-testid="coupon-input-error">${escape(message)}</span>`,
      );
  };
  const applyCoupon = () => {};
  couponInput.oninput = () => syncCoupon();
  couponInput.onkeydown = (e) => e.key === "Enter" && (e.preventDefault(), applyCoupon());
  couponButton.onclick = applyCoupon;
  syncCoupon();

  by("profile-topup-button").dataset.action = "deposit";
  by("profile-settings-button").dataset.action = "settings";
  by("profile-logout-button").onclick = () => {};
  by("rating-bar").onclick = openRatingDialog;
  by("rating-bar").removeAttribute('aria-disabled');
  app.cleanup.push(() => document.querySelector('#caser-rating-dialog')?.remove());

  // ---- tabs, sort, sell all -------------------------------------------------
  const tabs = { items: by("profile-tab-items"), balance: by("profile-tab-balance"), upgrades: by("profile-tab-upgrades") };
  const lightClass = "border-0 bg-white-850 rounded-[0.2rem] text-black hover:bg-white-850",
    ghostClass = "border-0 bg-transparent text-white-500 hover:bg-white-80";
  const tabIcons = {
    items: ["blackItems.svg", "grayItems.svg"],
    balance: ["blackBalance.svg", "grayBalance.svg"],
    upgrades: ["blackUpgrade.svg", "grayUpgrade.svg"],
  };
  const activeSizing = "lg:flex-1 lg:min-w-0 lg:grow lg:!h-[4rem] lg:!justify-center lg:!py-[1rem] lg:!px-[2rem] lg:!gap-[1rem]",
    idleSizing = "lg:!h-[4rem] lg:!w-[6.4rem] lg:min-w-[6.4rem] lg:max-w-[6.4rem] lg:shrink-0 lg:grow-0 lg:!justify-center lg:!p-[1rem]";
  const setClasses = (node, remove, add) => {
    remove.split(" ").forEach((c) => c && node.classList.remove(c));
    add.split(" ").forEach((c) => c && node.classList.add(c));
  };
  const sellAll = by("profile-sell-all-button-desktop"),
    sellAllMobile = by("profile-sell-all-button-mobile"),
    sort = by("profile-sort-select"),
    content = by("profile-tab-content");
  const emptyTemplate = content.querySelector("[data-testid=inventory-items-empty]")?.outerHTML || "";

  let tab = "items",
    sortBy = "created_at",
    direction = "DESC",
    shown = PAGE,
    menuOpen = false;

  function syncTabs() {
    for (const [key, node] of Object.entries(tabs)) {
      const active = key === tab;
      setClasses(node, active ? `${ghostClass} ${idleSizing}` : `${lightClass} ${activeSizing}`, active ? `${lightClass} ${activeSizing}` : `${ghostClass} ${idleSizing}`);
      const img = node.querySelector("img");
      if (img) {
        // Saved with the page: blackItems / grayBalance / grayUpgrade; the
        // other states come from download-profile-assets.bat.
        img.dataset.saved ??= img.getAttribute("src");
        const want = tabIcons[key][active ? 0 : 1];
        img.setAttribute("src", img.dataset.saved.endsWith("/" + want) ? img.dataset.saved : "./icons/profile/tabs/" + want);
      }
      const label = node.querySelector("span");
      label?.classList.toggle("lg:inline", active);
      label?.classList.toggle("lg:hidden", !active);
    }
    sellAll.hidden = tab !== "items";
    if (sellAllMobile) sellAllMobile.hidden = tab !== "items";
    sort.hidden = tab === "upgrades";
  }

  function sorted(list, priceOf, timeOf) {
    const k = direction === "ASC" ? 1 : -1;
    return [...list].sort((a, b) => k * (sortBy === "price" ? priceOf(a) - priceOf(b) : timeOf(a) - timeOf(b)));
  }
  function syncSort(disabled) {
    sort.classList.toggle("opacity-40", disabled);
    sort.classList.toggle("pointer-events-none", disabled);
    const dir = by("profile-sort-select-direction"),
      trigger = by("profile-sort-select-trigger");
    dir.disabled = trigger.disabled = disabled;
    dir.querySelector("img").classList.toggle("rotate-180", direction === "ASC");
    trigger.classList.toggle("border-white-150", disabled);
    trigger.classList.toggle("border-white-550", !disabled);
    trigger.classList.toggle("border-b-transparent", menuOpen);
    trigger.parentElement.classList.toggle("bg-[#272727]", menuOpen);
    trigger.querySelector("span").textContent = sortBy === "price" ? "По цене" : "По новизне";
    trigger.querySelector("img").classList.toggle("rotate-180", menuOpen);
    trigger.parentElement.querySelector(".profile-sort-menu")?.remove();
    if (menuOpen && !disabled) {
      const other = sortBy === "price" ? { sortBy: "created_at", label: "По новизне" } : { sortBy: "price", label: "По цене" };
      trigger.insertAdjacentHTML(
        "afterend",
        `<div class="profile-sort-menu flex flex-col z-[9] w-full absolute top-[4.4rem] bg-[#272727] shadow-[2px_2px_6px_rgba(0,0,0,0.35)] rounded-b-[0.2rem]"><button type="button" class="w-full h-[4.4rem] text-left flex items-center px-[1rem] text-white transition-colors hover:bg-white/5" data-testid="profile-sort-select-option-${other.sortBy}" data-sort="${other.sortBy}"><span class="text-[1.6rem] font-[700] leading-[1.2rem]">${other.label}</span></button></div>`,
      );
      trigger.parentElement.querySelector("[data-sort]").onclick = () => {
        sortBy = other.sortBy;
        menuOpen = false;
        shown = PAGE;
        render();
      };
    }
  }
  by("profile-sort-select-direction").onclick = () => {
    direction = direction === "ASC" ? "DESC" : "ASC";
    shown = PAGE;
    render();
  };
  by("profile-sort-select-trigger").onclick = () => {
    menuOpen = !menuOpen;
    syncSort(false);
  };
  const closeMenu = (e) => {
    if (menuOpen && !sort.contains(e.target)) {
      menuOpen = false;
      syncSort(false);
    }
  };
  document.addEventListener("mousedown", closeMenu);
  app.cleanup.push(() => document.removeEventListener("mousedown", closeMenu));

  for (const [key, node] of Object.entries(tabs))
    node.onclick = () => {
      if (tab === key) return;
      tab = key;
      shown = PAGE;
      menuOpen = false;
      render();
    };
  by("profile-balance-history-button").onclick = () => tabs.balance.click();

  const sellAllAction = () => {
    const ids = state().inventory.map((i) => i.instanceId);
    if (!ids.length || app.store.busy) return;
    const total = state().inventory.reduce((n, i) => n + i.price, 0);
    confirmSellAll(ids.length, total).then((ok) => {
      if (!ok || app.store.busy) return;
      try {
        app.store.sell(ids);
      } catch (e) {
        return showToast(e.message);
      }
      app.updateBalance();
      showToast(`Все предметы обменены на ${money(total)}`, "success");
      render();
    });
  };
  sellAll.onclick = sellAllAction;
  if (sellAllMobile) sellAllMobile.onclick = sellAllAction;

  const loadMore = (testId) =>
    `<div class="flex justify-center w-full"><button type="button" data-testid="${testId}" data-load-more class="flex items-center justify-center gap-[1rem] pl-[2rem] pr-[1.2rem] h-[4.4rem] bg-black/45 rounded-[0.2rem] custom-transition"><span class="text-[1.6rem] font-[700] font-sofia-sans uppercase text-white [font-feature-settings:'ss01'_on]">Загрузить еще</span><img src="${escape(by("profile-sort-select-trigger").querySelector("img").getAttribute("src"))}" class="w-[2.4rem] h-[2.4rem]" alt=""></button></div>`;

  // ---- Items tab (ItemsList + inventory card) -------------------------------
  function itemCard(i) {
    const { type, name } = displayNames(i);
    const ext = EXTERIOR[Number(i.exterior)] || "";
    const actionButton = (testId, inner, action) =>
      `<button type="button" class="flex items-center justify-center w-[3.6rem] h-[3.6rem] bg-black/45 rounded-[0.2rem] hover:bg-black/55 transition-all lg:w-full lg:rounded-[0.1125rem] disabled:opacity-50 disabled:cursor-not-allowed" data-testid="inventory-item-${escape(i.instanceId)}-${testId}" data-${action}="${escape(i.instanceId)}">${inner}</button>`;
    const buttons = `<div class="absolute bottom-[1.1rem] right-[0.5rem] flex items-center justify-center gap-[0.409rem] lg:static lg:w-full lg:gap-[0.5rem]">${actionButton("replace-button", icon(CDN_ICON.change, SVG.change, "w-[2.4rem] h-[2.4rem] lg:w-[2.25rem] lg:h-[2.25rem]"), "replace")}${actionButton("withdraw-button", icon(CDN_ICON.steamWhite, SVG.steam, "w-[2.4rem] h-[2.4rem] lg:w-[2.25rem] lg:h-[2.25rem]"), "withdraw")}${actionButton("sell-button", icon(CDN_ICON.buy, SVG.sold.replace("w-[2rem] h-[2rem]", "w-[2.4rem] h-[2.4rem]"), "w-[2.4rem] h-[2.4rem] lg:w-[2.25rem] lg:h-[2.25rem]"), "sell")}</div>`;
    return `<div class="flex flex-col gap-[0.5rem] transition-all lg:gap-[0.5rem] lg:bg-black/15 lg:rounded-[0.2rem] lg:pb-[0.5rem]" data-testid="inventory-item-${escape(i.instanceId)}">
      <div class="relative">
        <div class="relative h-[15.556rem] w-full lg:h-[12.8rem]">
          <div class="absolute inset-0 flex items-center justify-center overflow-hidden ${GRAD} border-[0.1rem] border-solid border-black/10"><img src="${escape(image(i))}" alt="item-${escape(i.id)}" loading="lazy" class="w-[17.6rem] h-[13.689rem] object-contain m-auto lg:h-[10.4rem] lg:w-[13.5rem]"></div>
          <div class="absolute bottom-0 left-0 h-[0.6rem] w-full z-[1]" style="background-color:${rarityColor(i)}"></div>
        </div>
        <div class="absolute right-0 top-0 z-[5] flex flex-col items-end gap-[0.2rem] p-[0.5rem]"><div class="flex items-center gap-[0.2rem]"><span class="font-sofia-sans text-[1.6rem] font-[700] leading-[1.6rem] tabular-nums [font-feature-settings:'ss01'_on] text-white" data-testid="inventory-item-${escape(i.instanceId)}-price">${money(i.price)}</span>${coinImg("h-[2rem] w-[2rem]")}</div>${ext ? `<span class="font-sofia-sans text-[1.2rem] font-[600] leading-[1.4rem] text-white">${ext}</span>` : ""}</div>
        ${buttons}
      </div>
      <div class="allow-text-select flex flex-col"><span class="font-sofia-sans text-[1.6rem] font-[700] leading-[1.6rem] text-shadow text-white [font-feature-settings:'ss01'_on] lg:text-[1.2rem] truncate">${escape(type)}</span>${name ? `<span class="font-sofia-sans text-[1.6rem] font-[500] leading-[1.9rem] text-shadow text-white/55 [font-feature-settings:'ss01'_on] lg:text-[1.2rem] truncate">${escape(name)}</span>` : ""}</div>
    </div>`;
  }
  function renderItems() {
    const list = sorted(state().inventory, (i) => i.price, (i) => i.obtainedAt || 0);
    sellAll.disabled = !list.length || app.store.busy;
    if (sellAllMobile) sellAllMobile.disabled = sellAll.disabled;
    syncSort(!list.length);
    if (!list.length) {
      content.innerHTML = emptyTemplate;
      return;
    }
    content.innerHTML = `<div class="flex flex-col gap-[2rem] w-full lg:gap-[1rem]" data-testid="inventory-items-list"><div class="grid grid-cols-7 gap-y-[2rem] gap-x-[2rem] w-full lg:grid-cols-2 lg:gap-x-[1rem] lg:gap-y-[1rem]">${list.slice(0, shown).map(itemCard).join("")}</div>${list.length > shown ? loadMore("inventory-items-load-more") : ""}</div>`;
    content.querySelectorAll("[data-sell]").forEach(
      (b) =>
        (b.onclick = () => {
          if (app.store.busy) return;
          const item = state().inventory.find((i) => i.instanceId === b.dataset.sell);
          if (!item) return;
          confirmItemSale().then((ok) => {
            if (!ok || app.store.busy || !state().inventory.some((i) => i.instanceId === item.instanceId)) return;
            app.store.sell([item.instanceId]);
            app.updateBalance();
            showToast(`Предмет обменен на ${money(item.price)}`, "success");
            render();
          });
        }),
    );
    content.querySelectorAll("[data-replace]").forEach(
      (b) =>
        (b.onclick = () => {
          const item = state().inventory.find((i) => i.instanceId === b.dataset.replace);
          if (!item || app.store.busy) return;
          openReplaceItem({
            item,
            candidates: replacementsFor(item),
            balance: () => state().balance,
            onReplace: (target) => {
              const { diff } = app.store.replace(item.instanceId, target);
              app.updateBalance();
              showToast(diff > 0 ? `Предмет заменён, ${money(diff)} возвращено на баланс` : diff < 0 ? `Предмет заменён, доплата ${money(-diff)}` : "Предмет заменён", "success");
              render();
            },
          });
        }),
    );
    content.querySelectorAll("[data-withdraw]").forEach(
      (b) => (b.onclick = () => {}),
    );
  }

  // Replacement candidates: the original server offers up to 50 items of
  // about the same price (cheaper ones refund the difference). The DEMO picks
  // items within ±12% of the price, so some cost a little more (paid from
  // the balance) and some a little less (refunded), closest prices first.
  function replacementsFor(item) {
    const p = Number(item.price);
    return app.items
      .filter((c) => c.id !== item.id && c.price >= p * 0.88 && c.price <= p * 1.12)
      .sort((a, b) => Math.abs(a.price - p) - Math.abs(b.price - p))
      .slice(0, 48)
      .sort((a, b) => b.price - a.price);
  }

  // ---- History tab (InventoryHistory) ---------------------------------------
  const DISPOSITION = { sold: ["Продано", CDN_ICON.buy, SVG.sold], used_in_upgrade: ["В апгрейде", CDN_ICON.upgradeWhite, SVG.upgrade], replaced: ["Заменено", CDN_ICON.changeSmall, SVG.change.replace("w-[2.4rem] h-[2.4rem]", "w-[2rem] h-[2rem]")] };
  function sourceBadge(entry) {
    if (entry.source?.type === "replacement") return icon(CDN_ICON.changeBig, SVG.changeBig, "absolute left-[0.5rem] bottom-[1.1rem] z-[2] w-[4.6rem] h-[4.6rem] object-contain drop-shadow-lg lg:bottom-auto lg:top-[0.5rem] lg:w-[3.2rem] lg:h-[3.2rem]");
    if (entry.source?.type === "upgrade") return icon(CDN_ICON.upgraderSmall, SVG.upgradeBig, "absolute left-[0.5rem] bottom-[1.1rem] z-[2] w-[4.6rem] h-[4.6rem] object-contain drop-shadow-lg lg:bottom-auto lg:top-[0.5rem] lg:w-[3.2rem] lg:h-[3.2rem]");
    if (entry.source?.type === "giveaway") return deco(CDN_ICON.giveaway, "absolute left-[0.5rem] bottom-[-0.4rem] z-[2] w-[7.2rem] h-[7.2rem] object-contain drop-shadow-lg lg:bottom-auto lg:top-[-0.8rem]");
    const c = caseBySlug.get(entry.source?.caseSlug);
    return `<div class="absolute left-[0.5rem] bottom-[1.1rem] z-[2] lg:bottom-auto lg:top-[0.5rem]"><img src="${escape(c ? image(c) : CDN_ICON.testCase)}" class="w-[6.9rem] h-[4.2rem] object-cover drop-shadow-lg lg:w-[5.251rem] lg:h-[3.2rem]" alt="" data-deco></div>`;
  }
  function historyCard(e) {
    const { type, name } = displayNames(e.item);
    const disp = DISPOSITION[e.status];
    const caseLink = e.source?.type === "case" && caseBySlug.get(e.source.caseSlug) ? `#/cases/${e.source.caseSlug}` : e.source?.type === "upgrade" ? "#/upgrade" : null;
    const body = `<div class="flex flex-col gap-[0.5rem] lg:gap-[0.5rem] lg:bg-black/15 lg:rounded-[0.2rem] lg:pb-[0.5rem]" data-testid="inventory-history-item-${escape(e.instanceId)}">
      <div class="relative ${caseLink ? "cursor-pointer" : ""}">
        <div class="relative h-[15.556rem] w-full lg:h-[12.8rem] lg:!h-[16rem]"><div class="absolute inset-0 flex items-center justify-center overflow-hidden ${GRAD} border-[0.1rem] border-solid border-black/10"><img src="${escape(image(e.item))}" alt="${escape(e.item.marketName)}" loading="lazy" class="m-auto w-[17.6rem] h-[13.689rem] object-contain lg:h-[10.4rem] lg:w-[13.5rem]"></div><div class="absolute bottom-0 left-0 h-[0.6rem] w-full z-[1]" style="background-color:${rarityColor(e.item)}"></div></div>
        <div class="absolute right-0 top-0 z-[5] flex items-center justify-center gap-[0.2rem] p-[0.5rem]"><span class="font-sofia-sans text-[1.6rem] font-[700] leading-[100%] text-white tabular-nums [font-feature-settings:'ss01'_on]" data-testid="inventory-history-item-${escape(e.instanceId)}-price">${money(e.price)}</span>${coinImg("h-[2rem] w-[2rem]")}</div>
        ${sourceBadge(e)}
        ${disp ? `<div class="absolute right-[0.5rem] bottom-[1.1rem] z-[3] flex items-center gap-[0.5rem] h-[2.8rem] bg-black/55 rounded-[0.2rem] py-[0.2rem] pl-[0.7rem] pr-[0.2rem] lg:hidden"><span class="text-[1.2rem] font-[500] text-white whitespace-nowrap uppercase [font-feature-settings:'ss01'_on]">${disp[0]}</span><span class="flex shrink-0 items-center justify-center w-[2.4rem] h-[2.4rem] rounded-[0.2rem]">${icon(disp[1], disp[2], "w-[2rem] h-[2rem]")}</span></div>` : ""}
        <div class="hidden lg:flex absolute left-0 bottom-0 z-[2] flex-col p-[0.5rem] pb-[1.1rem] max-w-[calc(100%-1rem)]"><span class="text-[1.4rem] font-[700] leading-[100%] text-white truncate [font-feature-settings:'ss01'_on] [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)]">${escape(type)}</span>${name ? `<span class="text-[1.2rem] font-[500] leading-[1.4rem] text-white/55 truncate [font-feature-settings:'ss01'_on] [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)]">${escape(name)}</span>` : ""}</div>
      </div>
      <div class="flex flex-col lg:hidden"><span class="text-[1.6rem] font-[700] leading-[100%] text-shadow text-white truncate [font-feature-settings:'ss01'_on]">${escape(type)}</span>${name ? `<span class="text-[1.6rem] font-[500] leading-[1.9rem] text-shadow text-white/55 truncate [font-feature-settings:'ss01'_on]">${escape(name)}</span>` : ""}</div>
      ${disp ? `<div class="hidden lg:flex items-center justify-between pl-[1rem] pr-[0.5rem] h-[3.6rem]"><span class="text-[1.2rem] font-[500] text-white/50 [font-feature-settings:'ss01'_on] flex-1 truncate">${disp[0]}</span><div class="flex shrink-0 items-center justify-center w-[3.6rem] h-[3.6rem] rounded-[0.1125rem]">${icon(disp[1], disp[2], "w-[2.25rem] h-[2.25rem]")}</div></div>` : ""}
    </div>`;
    return caseLink ? `<a href="${caseLink}" class="block hover:opacity-90 transition-opacity">${body}</a>` : body;
  }
  const emptyBox = (testId, title, hint, button) =>
    `<div class="flex flex-col items-center justify-center gap-[2rem] h-[49.9rem] bg-black-250 rounded-[0.2rem] lg:h-[17.9rem]" data-testid="${testId}"><div class="flex flex-col items-center gap-[0.5rem]"><span class="text-white text-[2rem] font-[600] lg:text-[1.8rem]">${title}</span><span class="text-white-550 text-[1.6rem] font-[500]">${hint}</span></div>${button}</div>`;
  const openCaseButton = (testId, label) => {
    const original = content.ownerDocument.querySelector("[data-testid=inventory-items-empty-open-case-button]");
    if (original) {
      const b = original.cloneNode(true);
      b.dataset.testid = testId;
      const span = b.querySelector("span:last-of-type") || b;
      if (label) span.textContent = label;
      return `<a href="#/cases">${b.outerHTML}</a>`;
    }
    return `<a href="#/cases" class="demo-primary">${label || "Открыть кейс"}</a>`;
  };
  let openCaseHTML = "";
  function renderHistory() {
    const list = sorted(state().itemLog || [], (e) => e.price, (e) => e.at || 0);
    syncSort(!list.length);
    if (!list.length) {
      content.innerHTML = emptyBox("inventory-history-empty", "История предметов пуста", "Открой свой первый кейс", openCaseHTML.replace("inventory-items-empty-open-case-button", "inventory-history-open-case-button"));
      return;
    }
    content.innerHTML = `<div class="flex flex-col gap-[2rem] w-full lg:gap-[1rem]" data-testid="inventory-history-list"><div class="grid grid-cols-7 gap-y-[2rem] gap-x-[2rem] w-full lg:grid-cols-2 lg:gap-x-[1rem] lg:gap-y-[1rem]">${list.slice(0, shown).map(historyCard).join("")}</div>${list.length > shown ? loadMore("inventory-history-load-more") : ""}</div>`;
  }

  // ---- Upgrades tab (UpgradeList) -------------------------------------------
  const VARIANT = {
    orange: { border: "border-[#DA6A27]", topBg: "bg-[#DA6A27]", shadow: "shadow-[0_-8px_26.3px_0_rgba(218,106,39,0.55)_inset]", footerBg: "bg-[linear-gradient(0deg,rgba(218,106,39,0.3),rgba(218,106,39,0.3)),linear-gradient(180deg,#1B1B1B_0%,#141414_100%)]" },
    green: { border: "border-[#2A735F]", topBg: "bg-[#076E58]", shadow: "shadow-[0_-8px_26.3px_0_rgba(42,115,95,0.55)_inset]", footerBg: "bg-[linear-gradient(0deg,rgba(42,115,95,0.3),rgba(42,115,95,0.3)),linear-gradient(180deg,#1B1B1B_0%,#141414_100%)]" },
    purple: { border: "border-[#802064]", topBg: "bg-[#802064]", shadow: "shadow-[0_-8px_26.3px_0_rgba(128,32,100,0.55)_inset]", footerBg: "bg-[linear-gradient(0deg,rgba(128,32,100,0.3),rgba(128,32,100,0.3)),linear-gradient(180deg,#1B1B1B_0%,#141414_100%)]" },
    blue: { border: "border-[#83D8FF]", shadow: "shadow-[0_-8px_13.7px_0_rgba(131,216,255,0.19)_inset]", footerBg: "bg-[linear-gradient(180deg,rgba(27,27,27,0.35)_0%,rgba(20,20,20,0.35)_100%)]" },
    lose: { shadow: "shadow-[0_-8px_26.3px_0_rgba(106,106,106,0.35)_inset]", footerBg: "bg-[linear-gradient(180deg,rgba(27,27,27,0.35)_0%,rgba(20,20,20,0.35)_100%)]" },
  };
  const CATEGORY = { clutch: ["orange", "Клатч"], best_profit: ["green", "Оправданный риск"], best_reward: ["purple", "Наибольшее вознаграждение"] };
  const entryOf = (h) => {
    const inputs = (h.inputs || [h.input]).flat().filter(Boolean);
    const isMystery = h.mode === "mystery";
    return {
      id: h.id,
      isMystery,
      betItems: inputs,
      wonItem: h.result || h.target,
      chance: isMystery ? 0 : Number(h.chance || 0) * 100,
      addedBalance: Number(h.addedBalance || 0),
      status: h.success ? "won" : "lost",
      stake: inputs.reduce((n, i) => n + Number(i.price || 0), 0) + Number(h.addedBalance || 0),
      at: h.at || 0,
    };
  };
  const previewCard = (item) => {
    const { type, name } = displayNames(item);
    return `<div class="relative flex-1 h-[17.319rem] min-w-0 lg:h-[11.4rem]"><div class="relative flex h-full w-full items-center justify-center overflow-hidden ${GRAD} border-[0.1rem] border-solid border-black/10"><div class="absolute bottom-0 left-0 h-[0.6rem] w-full z-[1] lg:h-[0.4rem]" style="background-color:${item ? rarityColor(item) : "#B0C3D9"}"></div>${item ? `<img src="${escape(image(item))}" alt="${escape(item.marketName)}" loading="lazy" class="m-auto h-[14.15rem] w-[18.05rem] object-contain lg:h-[10.7rem] lg:w-[13.8rem]">` : ""}<div class="absolute right-0 top-0 flex h-[3rem] items-center justify-center gap-[0.2rem] px-[0.5rem] lg:h-[2.2rem]"><span class="text-[1.4rem] font-[700] leading-[1.7rem] text-white [font-feature-settings:'ss01'_on]">${money(item?.price)}</span>${coinImg("h-[2rem] w-[2rem] lg:h-[1.6rem] lg:w-[1.6rem]")}</div><div class="allow-text-select absolute bottom-0 left-0 flex max-w-[calc(100%-1rem)] flex-col items-start gap-[0.5rem] p-[0.5rem] pb-[1.1rem]"><span class="w-full truncate text-[1.4rem] font-[700] leading-[1.4rem] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] [font-feature-settings:'ss01'_on]">${escape(type)}</span>${name ? `<span class="w-full truncate text-[1.2rem] font-[500] leading-[1.4rem] text-white/55 [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] [font-feature-settings:'ss01'_on] lg:text-[1.3rem] lg:leading-[1.6rem] lg:text-white/65">${escape(name)}</span>` : ""}</div></div></div>`;
  };
  const arrow = `<div class="flex shrink-0 items-center justify-center w-[2.4rem] self-stretch">${icon(CDN_ICON.arrow, SVG.arrow, "w-[2.4rem] h-[2.4rem]")}</div>`;
  const multiCell = (cell) => {
    if (cell.type === "item")
      return `<div class="relative flex-1 h-[6.159rem] overflow-hidden border-[0.02rem] border-black/10 ${GRAD} lg:h-[3.15rem]"><div class="absolute bottom-0 left-0 h-[0.2rem] w-full z-[1]" style="background-color:${rarityColor(cell.item)}"></div><img class="absolute top-[0.578rem] left-[0.672rem] w-[5.755rem] h-[5.156rem] object-contain lg:top-[0.4rem] lg:left-[0.5rem] lg:w-[3.8rem] lg:h-[3rem]" src="${escape(image(cell.item))}" alt=""></div>`;
    if (cell.type === "bet")
      return `<div class="relative flex-1 h-[6.159rem] flex items-center justify-center overflow-hidden border-[0.02rem] border-black/10 bg-white/5 lg:h-[3.15rem]">${deco(CDN_ICON.bet, "w-[3.841rem] h-[4.186rem] object-contain lg:w-[2.6rem] lg:h-[2.6rem]")}</div>`;
    return `<div class="flex-1 h-[6.159rem] bg-white/5 border-[0.02rem] border-black/10 lg:h-[3.15rem]"></div>`;
  };
  function multiBody(e) {
    const withBet = e.addedBalance > 0;
    const cells = e.betItems.slice(0, withBet ? 5 : 6).map((item) => ({ type: "item", item }));
    if (withBet) cells.push({ type: "bet" });
    while (cells.length < 6) cells.push({ type: "empty" });
    const won = e.wonItem,
      { type, name } = displayNames(won);
    return `<div class="z-[1] flex min-h-0 w-full flex-1 items-stretch gap-[0.2rem] p-[1rem]"><div class="flex min-h-0 flex-1 flex-col gap-[0.5rem]"><div class="flex gap-[0.5rem] lg:flex-1">${cells.slice(0, 3).map(multiCell).join("")}</div><div class="flex gap-[0.5rem] lg:flex-1">${cells.slice(3, 6).map(multiCell).join("")}</div><div class="flex items-center justify-between shrink-0 h-[4rem] px-[1rem] bg-white/5 lg:flex-col lg:h-[4.1rem] lg:items-center lg:justify-center lg:px-[1rem] lg:py-[0.5rem] lg:gap-[0.2rem]"><span class="text-[1.4rem] font-[500] leading-[1.7rem] text-white/55 [font-feature-settings:'ss01'_on] lg:text-[1rem] lg:leading-[1.2rem]">Сумма ставки</span><div class="flex items-center gap-[0.2rem]"><span class="text-[1.4rem] font-[700] leading-[1.7rem] text-white [font-feature-settings:'ss01'_on]">${money(e.stake)}</span>${coinImg("w-[2rem] h-[2rem] lg:w-[1.4rem] lg:h-[1.4rem]")}</div></div></div>${arrow}<div class="relative min-h-0 flex-1 h-[17.319rem] overflow-hidden border-[0.1rem] border-black/10 lg:h-[11.4rem] ${GRAD}"><div class="absolute bottom-0 left-0 h-[0.6rem] w-full z-[1] lg:h-[0.4rem]" style="background-color:${rarityColor(won)}"></div><img class="absolute top-[1.576rem] left-[2.111rem] w-[18.077rem] h-[14.048rem] object-contain lg:top-[0.5rem] lg:left-[0.5rem] lg:w-[13.8rem] lg:h-[10.7rem]" src="${escape(image(won))}" alt=""><div class="absolute right-0 top-0 flex items-center justify-center h-[3rem] px-[0.5rem] gap-[0.2rem] lg:h-[2.2rem] lg:px-[0.5rem]"><span class="text-[1.4rem] font-[700] leading-[1.7rem] text-white [font-feature-settings:'ss01'_on]">${money(won?.price)}</span>${coinImg("w-[2rem] h-[2rem] lg:w-[1.6rem] lg:h-[1.6rem]")}</div><div class="absolute left-0 bottom-0 flex flex-col items-start max-w-[calc(100%-1rem)] gap-[0.5rem] p-[0.5rem] pb-[1.1rem]"><span class="w-full truncate text-[1.4rem] font-[700] leading-[1.4rem] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] [font-feature-settings:'ss01'_on]">${escape(type)}</span><span class="w-full truncate text-[1.2rem] font-[500] leading-[1.4rem] text-white/55 [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] [font-feature-settings:'ss01'_on] lg:text-[1.3rem] lg:leading-[1.6rem] lg:text-white/65">${escape(name)}</span></div></div></div>`;
  }
  function upgradeCard(variant, e, category) {
    const v = VARIANT[variant],
      featured = !!category,
      mysteryFooter = e.isMystery && !featured;
    const footerBg = mysteryFooter ? "bg-[linear-gradient(0deg,#1D6A44_0%,#1F2E29_100%)]" : v.footerBg;
    const shadow = mysteryFooter ? "shadow-[0_-8px_13.7px_0_rgba(68,201,135,0.19)_inset]" : v.shadow;
    const topBorder = mysteryFooter ? "border-t-[0.1rem] border-solid border-[#44C987]" : featured && v.border ? `border-t-[0.1rem] border-solid ${v.border}` : "";
    const frame = mysteryFooter ? "bg-black/45 border-[0.1rem] border-solid border-[#44C987]" : featured ? `bg-black/75 border-[0.1rem] border-solid ${v.border}` : "bg-black/45";
    const weight = mysteryFooter ? "font-[600]" : "font-[700]";
    const color = mysteryFooter ? "text-[#44C987]" : variant === "lose" ? "text-white/50" : variant === "blue" ? "text-[#83D8FF]" : "text-white";
    const multi = e.betItems.length > 1 || e.addedBalance > 0;
    const body = multi ? multiBody(e) : `<div class="flex min-h-0 flex-1 items-center p-[1rem] gap-[0.2rem]">${previewCard(e.betItems[0])}<div class="flex shrink-0 items-center justify-center w-[2.4rem]">${icon(CDN_ICON.arrow, SVG.arrow, "w-[2.4rem] h-[2.4rem]")}</div>${previewCard(e.wonItem)}</div>`;
    const footer = mysteryFooter
      ? `<span class="flex-1 text-center text-[1.6rem] font-[600] leading-[1.6rem] [font-feature-settings:'ss01'_on]">Mystery</span>`
      : `${e.chance ? `<span class="text-[1.6rem] ${weight} leading-[1.6rem] [font-feature-settings:'ss01'_on]">Шанс ${e.chance.toFixed(2)}</span>` : ""}<span class="ml-auto text-[1.6rem] ${weight} leading-[1.6rem] [font-feature-settings:'ss01'_on]">${e.status === "won" ? "Выигрыш" : "Проигрыш"}</span>`;
    return `<div class="min-w-0 h-full flex"><div class="group relative flex h-full min-h-0 w-full min-w-0 flex-col rounded-[0.2rem] ${frame}" data-testid="upgrade-item-${escape(e.id)}">
      ${featured ? `<div class="relative flex shrink-0 items-center justify-center z-[3] w-full h-[2.6rem] px-[1rem] py-[0.5rem] ${v.topBg} shadow-[0_-8px_13.7px_0_rgba(255,255,255,0.11)_inset]"><span class="text-white text-[1.6rem] font-[600] leading-[1.6rem] [font-feature-settings:'ss01'_on] z-[1]">${category}</span>${deco(CDN_ICON.bgTop, "absolute right-0 top-0 w-full h-full z-[0]")}</div>${deco(e.isMystery ? CDN_ICON.bgMystery : CDN_ICON.bg, "absolute right-0 bottom-0 w-full h-full z-[0] mix-blend-screen pointer-events-none")}` : ""}
      ${mysteryFooter ? `<div class="absolute inset-x-0 top-0 bottom-[3.6rem] z-[0] bg-[#183526] shadow-[0_0_50px_0_rgba(68,201,135,0.5)_inset,0_0_10px_0_rgba(68,201,135,0.8)_inset]"></div><video src="${CDN_ICON.mysterySmoke}" autoplay muted loop playsinline preload="none" aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full object-cover !z-[2] rounded-[0.2rem] opacity-60" data-deco></video>` : ""}
      <div class="relative z-[3] flex min-h-0 flex-1 flex-col">${body}</div>
      <div class="relative flex shrink-0 z-[3] items-center justify-between w-full p-[1rem] ${color} z-[1] gap-[1rem] ${footerBg} ${topBorder} ${shadow}">${footer}${deco(mysteryFooter ? BOT.green : BOT[variant], "absolute right-0 top-0 w-full h-full pointer-events-none")}</div>
      <button type="button" aria-label="Copy round ${escape(e.id)}" data-copy="${escape(e.id)}" class="pointer-events-none absolute bottom-0 left-1/2 z-[4] flex min-h-[3.4rem] -translate-x-1/2 items-center justify-center gap-[1.5rem] rounded-t-[0.6rem] border-t border-white/10 bg-[#3b3b3b] px-[1rem] py-[0.5rem] opacity-0 drop-shadow-[0_4px_5px_rgba(0,0,0,0.45)] transition-[opacity,filter] group-hover:pointer-events-auto group-hover:opacity-100 hover:brightness-110 lg:pointer-events-auto lg:opacity-100" data-testid="upgrade-item-${escape(e.id)}-copy-button"><span class="flex items-center gap-[0.2rem] whitespace-nowrap font-sofia-sans text-[1.4rem] font-[500] leading-normal [font-feature-settings:'ss01'_on]"><span class="text-white/50">№</span><span class="text-white">${escape(String(e.id).slice(0, 8))}</span></span>${icon(CDN_ICON.copy, SVG.copy, "h-[1.6rem] w-[1.6rem]")}</button>
    </div></div>`;
  }
  function featuredOf(entries) {
    const won = entries.filter((e) => e.status === "won" && !e.isMystery);
    if (!won.length) return [];
    const pick = (score) => won.reduce((b, e) => (score(e) > score(b) ? e : b));
    return [
      ["clutch", pick((e) => -e.chance)],
      ["best_profit", pick((e) => Number(e.wonItem?.price || 0) - e.stake)],
      ["best_reward", pick((e) => Number(e.wonItem?.price || 0))],
    ];
  }
  function renderUpgrades() {
    const entries = state().upgradeHistory.map(entryOf).sort((a, b) => b.at - a.at);
    if (!entries.length) {
      content.innerHTML = emptyBox("upgrade-list-empty", "История апгрейдов пуста", "Сделай свой первый апгрейд", `<a href="#/upgrade">${openCaseHTML ? openCaseHTML.replace(/<\/?a[^>]*>/g, "").replace("inventory-items-empty-open-case-button", "upgrade-list-empty-open-case-button").replace(/Открыть кейс/i, "Сделать апгрейд") : "Сделать апгрейд"}</a>`);
      return;
    }
    const featured = featuredOf(entries);
    const hasMore = entries.length > shown;
    let list = entries.slice(0, shown);
    if (hasMore && list.length % 3) list = list.slice(0, list.length - (list.length % 3));
    const grid = "grid grid-cols-3 gap-[2rem] w-full items-stretch lg:grid-cols-1 lg:gap-[1rem]";
    content.innerHTML = `<div class="flex flex-col gap-[2rem] w-full lg:gap-[1rem]" data-testid="upgrade-list">${featured.length ? `<div class="${grid}">${featured.map(([cat, e]) => upgradeCard(CATEGORY[cat][0], e, CATEGORY[cat][1])).join("")}</div>` : ""}<div class="${grid}">${list.map((e) => upgradeCard(e.status === "lost" ? "lose" : "blue", e)).join("")}</div>${hasMore ? loadMore("upgrade-list-load-more") : ""}</div>`;
    content.querySelectorAll("[data-copy]").forEach(
      (b) =>
        (b.onclick = () => {
          navigator.clipboard?.writeText(b.dataset.copy).catch(() => {});
          showToast("Скопировано", "success");
        }),
    );
  }

  function render() {
    fillHeader();
    syncTabs();
    if (!openCaseHTML) {
      const b = content.querySelector("[data-testid=inventory-items-empty-open-case-button]");
      if (b) openCaseHTML = b.closest("a")?.outerHTML || b.outerHTML;
    }
    if (tab === "items") renderItems();
    else if (tab === "balance") renderHistory();
    else renderUpgrades();
    // Same entry animation as the original "animate-page-in" tab content.
    content.classList.remove("animate-page-in");
    void content.offsetWidth;
    content.classList.add("animate-page-in");
    const more = content.querySelector("[data-load-more]");
    if (more)
      more.onclick = () => {
        shown += PAGE;
        render();
      };
    content.querySelectorAll("[data-testid=inventory-items-empty-open-case-button]").forEach((b) => {
      const a = b.closest("a");
      if (a) a.href = "#/cases";
      else b.onclick = () => (location.hash = "#/cases");
    });
  }
  app.refreshInventory = render;
  const onBalance = () => fillHeader();
  document.addEventListener("demo-balance-updated", onBalance);
  app.cleanup.push(() => document.removeEventListener("demo-balance-updated", onBalance));
  render();
}
