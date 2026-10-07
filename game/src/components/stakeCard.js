// Left "stake" card of the Upgrade page, rebuilt from the original caser.one
// components (UpgradeUserItemsCard + ItemVisualCard variants "upgradeFeatured"
// and "upgradeMulti" + the balance tile). Class names are the original
// Tailwind classes, so geometry and decoration come from the saved reference
// stylesheet instead of local approximations.
import { image, escape, asset, rarityColor } from "./items.js";
import { names, exterior, itemImageScale } from "./referenceCards.js";

const GRADIENT = "bg-[linear-gradient(180deg,#454645_0%,#939393_100%)]";
const enUS = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const coin = (cls) =>
  `<img src="${escape(asset("coin.svg"))}" alt="" class="${cls}">`;

// Original ru strings (next-intl "upgrade" namespace from the saved page).
function plural(n, one, few, many) {
  const a = n % 10,
    b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}
export function stakeHeader(count, added) {
  if (count === 1 && added > 0) return "Выбран 1 предмет и баланс";
  if (count === 1) return "Выбран 1 предмет";
  const text = plural(
    count,
    `Выбран ${count} предмет`,
    `Выбрано ${count} предмета`,
    `Выбрано ${count} предметов`,
  );
  return added > 0 ? text + " и баланс" : text;
}

function texts(item) {
  const [type, skin] = names(item);
  return { type, skin: skin && skin !== type ? skin : "" };
}

// ItemVisualCard variant "upgradeFeatured".
// options.plain: the Mystery win card (hideGradientBackground + hideRarityBar,
// not clickable).
export function featuredStakeCard(item, options = {}) {
  const { type, skin } = texts(item);
  const ext = exterior(item);
  const attrs = options.plain
    ? `data-mystery-item="${escape(item.instanceId || item.id)}"`
    : `role="button" tabindex="0" data-stake-instance="${escape(item.instanceId)}"`;
  return `<div class="relative h-full w-full overflow-hidden rounded-b-[0.2rem]" ${attrs} aria-label="${escape(item.marketName)}"><div class="relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-b-[0.2rem]">${options.plain ? "" : `<div class="pointer-events-none absolute inset-0 z-0 rounded-b-[0.2rem] ${GRADIENT}"></div><div class="stake-rarity absolute bottom-0 left-0 z-[2] h-[1.2rem] w-full" style="background-color:${rarityColor(item)}"></div>`}<img class="relative z-[3] max-h-full max-w-full object-contain" style="scale:${itemImageScale(item, image(item))};transform-origin:center" src="${escape(image(item))}" alt="${escape(item.marketName || "Item")}"><div class="stake-price absolute right-0 top-0 z-[5] flex flex-col items-end gap-[0.3rem] p-[1rem]"><div class="flex items-center justify-center gap-[0.5rem]"><span class="tabular-nums font-sofia-sans text-[2.2rem] font-[700] leading-[2.6rem] text-white">${enUS.format(Number(item.price) || 0)}</span>${coin("size-[2.4rem] shrink-0")}</div>${ext ? `<span class="font-sofia-sans text-[1.4rem] font-[600] leading-[1.6rem] text-white">${ext}</span>` : ""}</div><div class="stake-names allow-text-select absolute bottom-[2.2rem] left-[1rem] z-[4] flex max-w-[17rem] flex-col items-start">${type ? `<span class="w-full truncate font-sofia-sans text-[2.2rem] font-[700] leading-[2.6rem] text-white">${escape(type)}</span>` : ""}${skin ? `<span class="w-full truncate font-sofia-sans text-[2.2rem] font-[700] leading-[2.6rem] text-white/55 [text-shadow:0_0.295rem_1.181rem_rgba(0,0,0,0.25)]">${escape(skin)}</span>` : ""}</div></div></div>`;
}

// ItemVisualCard variant "upgradeMulti".
export function multiStakeCard(item) {
  const { type, skin } = texts(item);
  const ext = exterior(item);
  return `<div class="stake-tile relative h-[13.222rem] w-full min-w-0 overflow-hidden rounded-[0.2rem] border border-solid border-black/10" role="button" tabindex="0" data-stake-instance="${escape(item.instanceId)}" aria-label="${escape(item.marketName)}"><div class="relative isolate flex h-full w-full items-center justify-center overflow-hidden ${GRADIENT}"><div class="absolute bottom-0 left-0 z-[3] h-[0.6rem] w-full" style="background-color:${rarityColor(item)}"></div><img class="stake-art relative z-[1] max-h-[11.978rem] max-w-full object-contain" style="scale:${itemImageScale(item, image(item))};transform-origin:center" src="${escape(image(item))}" alt="${escape(item.marketName || "Item")}"><div class="stake-price absolute right-0 top-0 z-[3] flex flex-col items-end gap-[0.2rem] px-[1rem] py-[0.5rem]"><div class="flex items-center justify-center gap-[0.5rem]"><span class="font-sofia-sans text-[1.6rem] font-[700] leading-[100%] text-white tabular-nums">${(Number(item.price) || 0).toFixed(2)}</span>${coin("size-[1.6rem] shrink-0")}</div>${ext ? `<span class="font-sofia-sans text-[1.2rem] font-[600] leading-[1.4rem] text-white">${ext}</span>` : ""}</div><div class="stake-names allow-text-select absolute bottom-[1.1rem] left-[0.5rem] z-[2] flex max-w-[65%] flex-col items-start">${type ? `<span class="w-full truncate font-sofia-sans text-[1.6rem] font-[700] leading-[100%] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)]">${escape(type)}</span>` : ""}${skin ? `<span class="w-full truncate font-sofia-sans text-[1.6rem] font-[700] leading-[100%] text-white/55 [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)]">${escape(skin)}</span>` : ""}</div></div></div>`;
}

// Added-balance tile. The original watermark file
// (/icons/upgrade/balance-card-watermark.svg) was not saved with the page;
// the saved currency icon is used in its place at low opacity.
export function balanceStakeCard(balance) {
  return `<div class="stake-tile relative h-[13.222rem] w-full min-w-0 overflow-hidden rounded-[0.2rem] border border-solid border-black/10" data-stake-balance="${balance}"><div class="relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden ${GRADIENT}"><div class="pointer-events-none absolute left-[calc(50%+0.2rem)] top-1/2 z-0 w-[65%] h-auto aspect-[103.926/118.322] -translate-x-1/2 -translate-y-1/2 stake-balance-watermark" aria-hidden="true">${coin("absolute inset-0 block size-full max-w-none")}</div><div class="stake-balance-body pl-[0.75rem] relative z-[1] flex shrink-0 flex-col items-center gap-[1rem]"><span class="shrink-0 font-sofia-sans text-[1.6rem] font-[700] leading-none text-white">Баланс</span><div class="flex h-[4.4rem] shrink-0 items-center gap-[0.5rem] overflow-hidden rounded-[0.2rem] border border-solid border-white/55 bg-black/15 px-[1rem] py-[1rem]"><span class="font-sofia-sans text-[2rem] font-[700] leading-[normal] text-white tabular-nums">${Number(balance).toFixed(2)}</span>${coin("size-[2.4rem] shrink-0")}</div></div><div class="pointer-events-none absolute bottom-0 left-0 z-[2] h-[0.6rem] w-full bg-[#E4AE39]" aria-hidden="true"></div></div></div>`;
}

function header(text, clearClass, busy) {
  return `<div class="stake-header flex h-[5.8rem] w-full shrink-0 items-center justify-between gap-[2rem] bg-black-450 px-[2rem] py-[0.7rem]"><span class="text-[1.6rem] font-[700] leading-[100%] text-white-550 font-sofia-sans" data-stake-header>${escape(text)}</span><button type="button" class="flex h-[4.4rem] min-w-[11.9rem] shrink-0 items-center justify-center rounded-[0.2rem] ${clearClass} px-[2rem] py-[1rem] text-[1.6rem] font-[700] leading-[100%] text-white font-sofia-sans transition-opacity hover:opacity-90" data-testid="upgrade-user-items-card-clear" ${busy ? "disabled" : ""}>Очистить</button></div>`;
}

// Renders the inside of [data-testid=upgrade-user-items-card].
// emptyHtml is the saved empty-state markup of the same card.
export function renderStakeCard(card, { items, added, busy, emptyHtml, onClear, onRemove }) {
  const count = items.length;
  const single = count === 1 && !(added > 0);
  const multi = count >= 2 || (count === 1 && added > 0);
  card.dataset.stakeMode = single ? "single" : multi ? "multi" : "empty";
  card.dataset.selectedCount = String(count);
  if (!single && !multi) {
    card.innerHTML = emptyHtml;
    return;
  }
  const bg = card.querySelector(":scope > img")?.getAttribute("src") || asset("bg.svg");
  let body;
  if (single) {
    body =
      header("Выбран 1 предмет", "bg-black-450", busy) +
      `<div class="flex h-[41.7rem] shrink-0 items-center justify-center" data-testid="upgrade-user-single-item-card">${featuredStakeCard(items[0])}</div>`;
  } else {
    const entries = items.map((item) => multiStakeCard(item));
    if (added > 0) entries.push(balanceStakeCard(added));
    const rows = [];
    for (let i = 0; i < entries.length; i += 3)
      rows.push(`<div class="stake-row grid w-full grid-cols-3 gap-[1rem]">${entries.slice(i, i + 3).join("")}</div>`);
    const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0) + Number(added || 0);
    body = `<div class="flex min-h-0 flex-1 flex-col pb-[0.5rem]">${header(stakeHeader(count, added), "bg-black-250", busy)}<div class="stake-body flex min-h-0 flex-1 flex-col justify-between gap-[1rem] px-[1rem]"><div class="flex min-h-0 flex-1 flex-col justify-start gap-[1rem] overflow-y-auto overflow-x-hidden no-scrollbar overflow-y-hidden pt-[1rem]" data-testid="upgrade-user-multi-items">${rows.join("")}</div><div class="stake-total flex shrink-0 items-center justify-center gap-[0.5rem] py-[1rem]"><span class="font-sofia-sans text-[2.2rem] font-[700] leading-[2.6rem] text-white tabular-nums" data-stake-total>${enUS.format(total)}</span>${coin("size-[2.4rem] shrink-0")}</div></div></div>`;
  }
  card.innerHTML = `<img alt="" class="pointer-events-none absolute inset-0 z-0 size-full object-cover" src="${escape(bg)}"><div class="relative z-[1] flex min-h-0 flex-1 flex-col">${body}</div>`;
  card.querySelector("[data-testid=upgrade-user-items-card-clear]").onclick = () => {
    if (!busy) onClear();
  };
  card.querySelectorAll("[data-stake-instance]").forEach((node) => {
    const remove = () => {
      if (!busy) onRemove(node.dataset.stakeInstance);
    };
    node.onclick = remove;
    node.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        remove();
      }
    };
  });
}
