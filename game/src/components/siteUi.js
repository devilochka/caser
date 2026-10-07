// Original site UI pieces rebuilt from the saved bundles with the same
// Tailwind classes:
// - alert toasts (useAlertToastStore + toast list, 3_n-1blibw9rx): top right,
//   green "success" / red "error", 4 s, UI_Notification_Receive sound;
// - Modal / DialogOverlay shells (1g0qkvwx3ax78, 2j7rltviofies);
// - SaleAlertModal (one item, "don't show again" -> hide_sale_alert),
//   SaleConfirmationModal (sell all), ReplaceItemModal (item replacement).
import { escape, image, rarityColor } from "./items.js";

const CLOSE = "./icons/general/closeIcon3.svg";
const BASE_BTN = "relative h-[4.4rem] z-[1] px-[2rem] flex items-center overflow-hidden font-bold font-brand-body justify-center rounded-[0.2rem] custom-transition text-[1.6rem] uppercase disabled:cursor-not-allowed";
export const BTN_PRIMARY = `border-[0.1rem] border-solid border-brand-button-primary-border bg-brand-button-primary shadow-[var(--brand-button-primary-shadow)] rounded-[0.2rem] text-brand-button-primary-text hover:bg-brand-button-primary-hover hover:shadow-[var(--brand-button-primary-hover-shadow)] disabled:!border-[0.1rem] disabled:!border-solid disabled:!border-[rgba(255,255,255,0.15)] disabled:!bg-[#4B4B4F] disabled:!bg-none disabled:!text-[rgba(255,255,255,0.4)] disabled:!shadow-[inset_0_0_1.66rem_rgba(125,125,125,0.45)] ${BASE_BTN}`;
export const BTN_EMPHASIZED = `border-0 bg-black-450 text-white hover:bg-black-250 disabled:bg-black-350 disabled:text-white-400 disabled:hover:bg-black-350 ${BASE_BTN}`;
const EXTERIOR = { 1: "BS", 2: "FN", 3: "FT", 4: "MW", 5: "WW", 6: "NP" };
const fmt = (n) => (Number(n) || 0).toFixed(2);
const fmtUs = (n) => (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let coinSrc = "./src/fallback.svg";
export const setCoin = (src) => src && (coinSrc = src);
const coin = (cls) => `<img src="${escape(coinSrc)}" class="${cls}" alt="">`;
function names(item) {
  const full = item?.marketName || "";
  const [type, ...rest] = full.split("|");
  return { type: type.trim() || full, name: rest.join("|").trim().replace(/\s*\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)$/, "") };
}

// ---- toasts -----------------------------------------------------------------
let toastId = 0,
  audio = null;
export const setToastAudio = (a) => (audio = a);
export function showToast(message, variant = "error") {
  let list = document.querySelector("[data-testid=error-toast-list]");
  if (!list) {
    list = document.createElement("div");
    list.dataset.testid = "error-toast-list";
    list.className = "fixed z-[999999] right-[1rem] flex flex-col gap-[0.5rem] lg:left-0 lg:right-0 lg:px-0 top-[6.8rem] lg:top-[5rem]";
    document.body.append(list);
  }
  const id = String(++toastId);
  const node = document.createElement("div");
  node.dataset.testid = `error-toast-${id}`;
  node.setAttribute("role", "alert");
  node.className = `flex min-h-[3.7rem] items-stretch justify-between w-[34rem] pr-[1rem] animate-toast-slide-in lg:w-full ${variant === "success" ? "bg-[#40B635]" : "bg-[#EB4B4B]"}`;
  node.innerHTML = `<div class="flex items-center flex-1 px-[1rem] min-w-0 py-[0.6rem]"><span class="text-[1.4rem] text-white font-[400] leading-[1.7rem] font-sofia-sans break-words">${escape(message)}</span></div><div class="flex items-center self-stretch gap-[1rem] shrink-0"><div class="w-0 h-full border-l-[0.1rem] border-solid border-[rgba(255,255,255,0.2)]"></div><button type="button" data-testid="error-toast-${id}-dismiss" data-action="toast-dismiss" class="flex items-center justify-center w-[2.4rem] h-[2.4rem] opacity-50"><svg viewBox="0 0 13 13" class="w-[1.3rem] h-[1.3rem]" aria-hidden="true"><path d="M1 1l11 11M12 1 1 12" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>`;
  list.append(node);
  const remove = () => {
    clearTimeout(timer);
    node.remove();
    if (!list.children.length) list.remove();
  };
  const timer = setTimeout(remove, 4000);
  node.querySelector("button").onclick = remove;
  audio?.play("UI_Notification_Receive");
}

// ---- modal shells -------------------------------------------------------------
// Overlay + content; returns { root, close }. Escape / backdrop click close it
// unless `locked()` says otherwise.
function openDialog({ overlayClass, contentClass, testId, html, onClose, locked = () => false }) {
  document.querySelectorAll("[data-site-modal]").forEach((n) => n.__close?.());
  const root = document.createElement("div");
  root.dataset.siteModal = "";
  root.className = overlayClass;
  root.innerHTML = `<div class="${contentClass}" role="dialog" aria-modal="true" data-testid="${testId}">${html}</div>`;
  const close = () => {
    if (!root.isConnected) return;
    root.remove();
    document.removeEventListener("keydown", onKey);
    onClose?.();
  };
  const onKey = (e) => e.key === "Escape" && !locked() && close();
  root.__close = close;
  root.addEventListener("mousedown", (e) => {
    if (e.target === root && !locked()) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.append(root);
  return { root, content: root.firstElementChild, close };
}
const DIALOG_OVERLAY = "fixed inset-0 z-[99999] flex items-center justify-center !overflow-hidden !bg-[rgba(0,0,0,0.55)] !p-0";

// SaleAlertModal: one item. Resolves true (sell) / false; remembers the
// "don't show again" choice like the original (localStorage hide_sale_alert).
export function confirmItemSale() {
  let hidden = false;
  try {
    hidden = localStorage.getItem("hide_sale_alert") === "true";
  } catch {}
  if (hidden) return Promise.resolve(true);
  return new Promise((resolve) => {
    let checked = false,
      result = false;
    const { content, close } = openDialog({
      overlayClass: DIALOG_OVERLAY,
      contentClass: "relative flex !m-0 !w-[55.2rem] flex-col items-stretch border border-solid border-[#474747] !bg-[#151515] !p-0 shadow-[0_1rem_4rem_rgba(0,0,0,0.45)] outline-hidden lg:!mx-[1rem] lg:!w-[34rem]",
      testId: "sale-alert-modal",
      onClose: () => resolve(result),
      html: `<div class="flex items-center justify-between w-full px-[2rem] py-[2rem] bg-[#272727] lg:py-[1rem]"><span class="font-oswald text-[2.2rem] font-[400] leading-[3.2rem] text-white uppercase [font-feature-settings:'ss01'_on] lg:text-[2rem]">Подтверждение обмена</span><button type="button" data-close class="flex size-[3.2rem] shrink-0 items-center justify-center opacity-50 hover:opacity-100 transition-opacity" aria-label="Close"><img src="${CLOSE}" alt=""></button></div>
        <div class="flex flex-col items-center justify-center w-full px-[4rem] py-[4rem] lg:px-[2rem]"><span class="font-sofia-sans text-[1.8rem] font-[500] leading-[140%] text-white/80 uppercase text-center [font-feature-settings:'ss01'_on,'ss02'_on] lg:text-[1.6rem]">Вы точно хотите обменять предмет?</span></div>
        <div class="flex flex-col items-stretch w-full p-[2rem] gap-[2rem] bg-[#272727]"><label class="flex items-center w-full gap-[1.2rem] cursor-pointer select-none"><span data-box class="flex shrink-0 items-center justify-center size-[1.6rem] rounded-[0.1rem] border border-solid transition-colors bg-transparent border-white/30"></span><input type="checkbox" class="sr-only" data-testid="sale-alert-modal-dont-show-again-checkbox"><span class="font-sofia-sans text-[1.4rem] font-[400] leading-[100%] text-white/80 [font-feature-settings:'ss01'_on]">Больше не показывать данное окно</span></label>
        <div class="flex items-stretch w-full gap-[1rem]"><button type="button" data-close data-testid="sale-alert-modal-cancel-button" class="!flex-1 !h-[4.8rem] !bg-white/[0.05] !font-oswald !font-[400] !text-[2rem] lg:!h-[4.4rem] lg:!text-[1.6rem] ${BTN_EMPHASIZED}">Отменить</button><button type="button" data-confirm data-testid="sale-alert-modal-confirm-button" class="!flex-1 !h-[4.8rem] !font-oswald !font-[400] !text-[2rem] lg:!h-[4.4rem] lg:!text-[1.6rem] ${BTN_PRIMARY}"><span class="relative z-[2]">Обменять</span></button></div></div>`,
    });
    const box = content.querySelector("[data-box]");
    content.querySelector("input").onchange = (e) => {
      checked = e.target.checked;
      box.className = `flex shrink-0 items-center justify-center size-[1.6rem] rounded-[0.1rem] border border-solid transition-colors ${checked ? "bg-[#44C987] border-[rgba(32,32,34,0.2)]" : "bg-transparent border-white/30"}`;
      box.innerHTML = checked ? '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 3.5L3.8 6.5L9 1" stroke="#13432C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : "";
    };
    content.querySelectorAll("[data-close]").forEach((b) => (b.onclick = close));
    content.querySelector("[data-confirm]").onclick = () => {
      if (checked)
        try {
          localStorage.setItem("hide_sale_alert", "true");
        } catch {}
      result = true;
      close();
    };
  });
}

// SaleConfirmationModal: sell everything. Resolves true / false.
export function confirmSellAll(count, total) {
  return new Promise((resolve) => {
    let result = false;
    const { content, close } = openDialog({
      overlayClass: "fixed inset-0 z-[99999] !overflow-hidden flex items-center justify-center !bg-[rgba(0,0,0,0.65)] !p-0",
      contentClass: "relative flex w-fit p-[1rem] outline-hidden !bg-[#272727] border-[0.1rem] border-solid border-white-150 shadow-[0_10px_40px_0_rgba(0,0,0,0.45)] lg:!w-fit lg:max-w-[calc(100vw-2rem)] lg:max-h-[calc(100vh-5rem)] lg:overflow-auto !w-[40rem] !p-[2rem] lg:!w-full",
      testId: "sale-confirmation-modal",
      onClose: () => resolve(result),
      html: `<div class="flex flex-col items-center gap-[2rem] w-full"><span class="text-[1.8rem] text-white font-[400] leading-[3.2rem] uppercase font-oswald">Подтверждение обмена</span><span class="text-[1.6rem] text-white-550 font-[400] leading-[1.92rem] max-w-[20rem] text-center">Вы действительно хотите обменять <span class="text-[#44C987] font-[600]">${count}</span> предметов?</span>
        <div class="flex flex-col gap-[1rem] w-full"><div class="flex items-center justify-between w-full h-[6.4rem] px-[2rem] bg-black-250"><span class="text-white-550 text-[1.6rem] font-[400] leading-[1.6rem]">Общая сумма</span><div class="flex items-center gap-[0.4rem]"><span class="text-[2.4rem] text-white font-[400] leading-[2.4rem] font-oswald" data-testid="sale-confirmation-modal-total-sum">${fmtUs(total)}</span>${coin("w-[2rem] h-[2rem]")}</div></div>
        <div class="flex items-center w-full gap-[1rem] lg:flex-col lg:flex-col-reverse"><button type="button" data-close data-testid="sale-confirmation-modal-cancel-button" class="!w-full lg:!text-[1.4rem] ${BTN_EMPHASIZED}">Отменить</button><button type="button" data-confirm data-testid="sale-confirmation-modal-confirm-button" class="!w-full lg:!text-[1.4rem] ${BTN_PRIMARY}"><span class="relative z-[2]">Обменять все</span></button></div></div></div>
        <button type="button" data-close data-testid="sale-confirmation-modal-close" aria-label="Close modal" class="absolute flex items-center justify-center z-10 w-[3.2rem] h-[3.2rem] right-[2rem] top-[2rem] cursor-pointer hover:opacity-70 custom-transition lg:right-[1rem] lg:top-[1rem]"><img src="${CLOSE}" alt=""></button>`,
    });
    content.querySelectorAll("[data-close]").forEach((b) => (b.onclick = close));
    content.querySelector("[data-confirm]").onclick = () => {
      result = true;
      close();
    };
  });
}

// ReplaceItemModal. `candidates`: catalogue items; `onReplace(candidate)` does
// the store change and returns a message or throws.
const replaceCardImage = (item) =>
  `<div class="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#454645_0%,#939393_100%)]"><img src="${escape(image(item))}" alt="" loading="lazy" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain w-[15.8rem] h-[12.288rem] lg:w-[13.2rem] lg:h-[10.267rem]"><div class="absolute left-0 bottom-0 w-full h-[0.6rem] z-[1]" style="background-color:${rarityColor(item)}"></div></div>`;
function previewBox(label, item, testId) {
  let inner;
  if (item) {
    const { type, name } = names(item),
      ext = EXTERIOR[Number(item.exterior)] || "";
    inner = `${replaceCardImage(item)}<div class="absolute right-0 top-0 z-[5] flex flex-col items-end gap-[0.2rem] p-[1rem] lg:p-[0.5rem]"><div class="flex items-center gap-[0.2rem]"><span class="font-sofia-sans text-[1.6rem] font-[700] leading-[1.6rem] text-white tabular-nums">${fmt(item.price)}</span>${coin("h-[2rem] w-[2rem]")}</div>${ext ? `<span class="font-sofia-sans text-[1.2rem] font-[600] leading-[1.4rem] text-white">${ext}</span>` : ""}</div><div class="absolute left-0 right-[6rem] bottom-0 z-[4] flex flex-col min-w-0 px-[1rem] pb-[1.6rem] pt-[0.5rem] gap-[0.3rem] lg:px-[0.5rem] lg:pb-[1.1rem] lg:right-[4.5rem]"><span class="w-full font-sofia-sans text-[1.6rem] font-[700] leading-[1.6rem] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] truncate lg:text-[1.4rem]">${escape(type)}</span>${name ? `<span class="w-full font-sofia-sans text-[1.4rem] font-[500] leading-[1.7rem] text-white/50 truncate lg:text-[1.2rem] lg:leading-[1.4rem]">${escape(name)}</span>` : ""}</div>`;
  } else
    inner = `<div class="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.05)_100%)] border border-dashed border-white/10"><svg viewBox="0 0 160 70" class="w-[15.6rem] h-[11.7rem] opacity-80 lg:w-[12rem] lg:h-[9rem]" aria-hidden="true"><path fill="#fff" fill-opacity=".08" d="M4 30h18l4-6h40l6-6h30l2 4h28l4 4h18v8h-20l-8 4H96l-10 8-6 22H62l4-18-8 2-4 10H40l2-12H24l-4-6H4z"/></svg></div>`;
  return `<div class="flex flex-col gap-[1rem] w-full flex-1 p-[1rem] bg-white/[0.05] lg:p-0 lg:bg-transparent" data-testid="${testId}"><span class="font-oswald text-[1.6rem] leading-[2.4rem] text-white/50 uppercase lg:text-[1.3rem] lg:leading-[1.9rem]">${label}</span><div class="relative w-full h-[14.6rem] lg:h-[11.278rem]">${inner}</div></div>`;
}
function candidateCard(item, index, selected) {
  const { type, name } = names(item),
    ext = EXTERIOR[Number(item.exterior)] || "";
  return `<button type="button" data-candidate="${index}" data-testid="replace-item-modal-candidate-${escape(item.id)}" class="relative w-full h-[14.389rem] text-left cursor-pointer focus:outline-hidden lg:h-[11.278rem]">${replaceCardImage(item)}<div class="absolute right-0 top-0 z-[5] flex flex-col items-end gap-[0.2rem] p-[0.5rem]"><div class="flex items-center gap-[0.2rem]"><span class="font-sofia-sans text-[1.4rem] font-[700] leading-[1.7rem] text-white tabular-nums">${fmt(item.price)}</span>${coin("h-[1.6rem] w-[1.6rem]")}</div>${ext ? `<span class="font-sofia-sans text-[1.2rem] font-[600] leading-[1.4rem] text-white">${ext}</span>` : ""}</div><div class="absolute left-0 right-0 bottom-0 z-[4] flex flex-col items-start min-w-0 px-[0.5rem] pb-[1.1rem] pt-[0.5rem] gap-[0.2rem]"><span class="w-full font-sofia-sans text-[1.4rem] font-[700] leading-[1.4rem] text-white [text-shadow:1px_1px_2px_rgba(0,0,0,0.25)] truncate">${escape(type)}</span>${name ? `<span class="w-full font-sofia-sans text-[1.2rem] font-[500] leading-[1.4rem] text-white/55 truncate">${escape(name)}</span>` : ""}</div>${selected ? '<div class="absolute inset-0 z-[6] bg-black/45 pointer-events-none"></div><div class="absolute left-1/2 top-1/2 z-[7] flex size-[2.4rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-solid border-[#83D8FF] bg-black/25 backdrop-blur-[5px] pointer-events-none"><div class="size-[1.4rem] rounded-full bg-[#83D8FF]"></div></div>' : ""}</button>`;
}
export function openReplaceItem({ item, candidates, balance, onReplace }) {
  let selected = -1,
    busy = false;
  const { content, close } = openDialog({
    overlayClass: "fixed inset-0 z-[99999] flex items-center justify-center !overflow-hidden !bg-[rgba(0,0,0,0.55)] !p-[2rem] lg:!items-start lg:!justify-center lg:!p-[1rem]",
    contentClass: "!m-0 flex h-[calc(100vh-4rem)] w-[86rem] max-w-full max-h-[calc(100vh-4rem)] flex-col overflow-hidden !bg-[#151515] border-[0.1rem] border-solid border-[#474747] shadow-[0_1rem_4rem_rgba(0,0,0,0.45)] !p-0 lg:h-auto lg:max-h-[calc(100dvh-2rem)] lg:!w-[34rem]",
    testId: "replace-item-modal",
    locked: () => busy,
    html: `<div class="flex items-center justify-between px-[2rem] py-[2rem] bg-[#272727] shrink-0 lg:py-[1rem]"><span class="font-oswald text-[2.2rem] leading-[3.2rem] text-white uppercase lg:text-[2rem]">Замена предмета</span><button type="button" data-close class="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity" aria-label="Close" data-testid="replace-item-modal-close"><img src="${CLOSE}" alt=""></button></div>
      <div class="flex min-h-0 flex-1 flex-col lg:flex-none lg:max-h-[calc(100dvh-16rem)] lg:overflow-y-auto lg:overscroll-y-contain"><div class="flex shrink-0 flex-col gap-[3rem] border-b border-white/10 px-[3rem] pb-[2rem] pt-[3rem] lg:gap-[2rem] lg:px-[2rem] lg:pb-[1rem] lg:pt-[2rem]"><div class="flex flex-col gap-[1rem]"><div class="flex items-start gap-[1rem]" data-previews></div><div data-difference></div></div><span class="font-sofia-sans text-[1.8rem] font-[500] leading-[1.8rem] text-white/50 lg:text-[1.4rem] lg:leading-[1.7rem]">Выберите предмет, на который хотите заменить</span></div>
      <div class="min-h-0 flex-1 overflow-y-auto px-[3rem] py-[2rem] lg:flex-none lg:overflow-visible lg:px-[2rem] lg:py-[1rem]" data-list></div></div>
      <div class="flex items-center justify-between gap-[2rem] px-[2rem] py-[2rem] bg-[#272727] shrink-0 lg:gap-[1rem] lg:py-[1rem]"><button type="button" data-close data-testid="replace-item-modal-cancel" class="!bg-white/[0.05] !min-w-[11.1rem] lg:!w-full lg:!h-[4.4rem] ${BTN_EMPHASIZED}">Отменить</button><button type="button" data-confirm data-testid="replace-item-modal-confirm" class="!min-w-[12rem] lg:!w-full lg:!h-[4.4rem] ${BTN_PRIMARY}" disabled><span class="relative z-[2]">Заменить</span></button></div>`,
  });
  const list = content.querySelector("[data-list]"),
    confirm = content.querySelector("[data-confirm]");
  function draw() {
    const pick = candidates[selected] || null;
    content.querySelector("[data-previews]").innerHTML = previewBox("Отдаете предмет", item, "replace-item-modal-current-item") + previewBox("Получаете предмет", pick, "replace-item-modal-new-item-preview");
    const diff = pick ? Math.round((Number(item.price) - Number(pick.price)) * 100) / 100 : 0;
    const short = diff < 0 && -diff > balance();
    content.querySelector("[data-difference]").innerHTML =
      pick && diff !== 0
        ? `<div class="flex w-full items-center justify-between gap-[1rem] bg-white/[0.05] px-[2rem] py-[1.5rem] lg:px-[1rem] lg:py-[1rem]" data-testid="replace-item-modal-${diff > 0 ? "refund" : "surcharge"}"><span class="font-sofia-sans text-[1.6rem] font-[400] leading-[1.9rem] text-white/50 lg:text-[1.4rem] lg:leading-[1.7rem]">${diff > 0 ? "Вернётся на баланс" : short ? "Не хватает на доплату" : "Доплата с баланса"}</span><div class="flex items-center gap-[0.5rem]"><span class="font-oswald text-[2rem] leading-[2.4rem] uppercase ${short ? "text-[#FF6666]" : "text-white"} lg:text-[1.8rem]">${diff > 0 ? "" : "−"}${fmtUs(Math.abs(diff))}</span>${coin("h-[2rem] w-[2rem] lg:h-[1.8rem] lg:w-[1.8rem]")}</div></div>`
        : "";
    confirm.disabled = !pick || busy || short;
    list.innerHTML = candidates.length
      ? `<div class="grid grid-cols-4 gap-[2rem] lg:grid-cols-2 lg:gap-[1rem]" data-testid="replace-item-modal-candidates">${candidates.map((c, i) => candidateCard(c, i, i === selected)).join("")}</div>`
      : `<div class="flex items-center justify-center w-full h-[20rem]" data-testid="replace-item-modal-empty"><span class="font-sofia-sans text-[1.6rem] text-white/50">Нет предметов для замены</span></div>`;
    list.querySelectorAll("[data-candidate]").forEach(
      (b) =>
        (b.onclick = () => {
          selected = Number(b.dataset.candidate);
          const top = list.scrollTop;
          draw();
          list.scrollTop = top;
        }),
    );
  }
  content.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => !busy && close()));
  confirm.onclick = () => {
    const pick = candidates[selected];
    if (!pick || busy) return;
    busy = true;
    confirm.querySelector("span").textContent = "Заменяем…";
    confirm.disabled = true;
    try {
      onReplace(pick);
      busy = false;
      close();
    } catch (e) {
      busy = false;
      confirm.querySelector("span").textContent = "Заменить";
      showToast(e.message);
      draw();
    }
  };
  draw();
}
