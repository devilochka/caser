// Case opening, following the original CasePageContent (case-module.js):
// - click: the case open effect and, in the same frame, Case_Open_KeyUnlock;
// - wait 1800 ms (2000 ms on mobile) while the case opens (0 if the scene is
//   not ready); a reopen first hides the previous results for 320 ms;
// - normal mode: the roulette stage slides in, Case_Roll_Tick_Slow plays once
//   (one 7.4 s track) while the strips decelerate for 6500 ms;
// - fast mode: no roulette, the results are revealed right away;
// - on completion: stop the tick, Case_Drop_Rare if any item costs at least
//   twice the price of one case, else Case_Drop_Common, and reveal the cards.
import { escape, image, price, rarityColor, asset } from "../components/items.js";
import { CaseRoulette, LAYOUTS, OPENED_ITEM_CARD, getOpenedItemSize, getRouletteSize, rarityBackground, preloadItemImages } from "./caseRoulette.js";

export const isMobileLayout = () => matchMedia("(max-width:1024px)").matches;
const wait = (ms, signal) =>
  new Promise((resolve) => {
    if (!ms) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });
const TAIL_TICKS_FROM_MS = 2600;
const TICK_SLICE = { offset: 0.7, duration: 0.05, volume: 0.6 };
const frame = () => new Promise(requestAnimationFrame);
const sellArea = (count, mobile) => (count <= 1 ? 0 : mobile ? 4.1 : 5.4);
const NAME_STYLE = {
  L: { size: 2, line: 2.4, skinWeight: 600, pos: "bottom:2rem;left:1rem;right:1rem" },
  M: { size: 2, line: 2.4, skinWeight: 600, pos: "bottom:1.714rem;left:0.857rem;right:0.857rem" },
  S: { size: 1.2, line: 1.4, skinWeight: 500, pos: "bottom:1.286rem;left:0.643rem;right:0.643rem" },
  MOB_L: { size: 1.2, line: 1.4, skinWeight: 500, pos: "bottom:1.286rem;left:0.643rem;right:0.643rem" },
  MOB_S: { size: 1, line: 1.2, skinWeight: 500, pos: "bottom:0.77rem;left:0.4rem;right:0.4rem" },
};

// Stage metrics (original e5/e3/e4).
function metrics(count, mobile, revealed, scrollWidth) {
  const layout = LAYOUTS[getRouletteSize(count, mobile)],
    sell = revealed ? sellArea(count, mobile) : 0;
  if (mobile) {
    const scale = 360 / layout.containerWidth,
      viewport = (layout.containerHeight * scale) / 10,
      width = (layout.containerWidth * scale) / 10,
      height = count * (viewport + sell) + Math.max(0, count - 1);
    return { layout, sell, mobile, nativeWidth: width, nativeHeight: height, visualWidth: width, visualHeight: height, viewport, mobileScale: scale, desktopScale: 1, top: Math.max(4, (34.7 - height) / 2), heroMin: 34.7 };
  }
  const rows = count <= 1 ? 1 : Math.ceil(count / (count <= 4 ? 2 : 3)),
    rowGap = count <= 1 ? 0 : 2,
    height = (rows * layout.containerHeight) / 10 + (rows - 1) * rowGap + rows * sell,
    scale = Math.min(1, Math.max(0.01, scrollWidth / 1540));
  return { layout, sell, mobile, nativeWidth: 154, nativeHeight: height, visualWidth: 154 * scale, visualHeight: height * scale, viewport: layout.containerHeight / 10, mobileScale: 1, desktopScale: scale, top: Math.max(4, (58 - height) / 2), heroMin: 58 };
}

function openedCard(item, count, mobile) {
  const size = getOpenedItemSize(count, mobile),
    d = OPENED_ITEM_CARD[size],
    n = NAME_STYLE[size],
    color = rarityColor(item),
    full = item.marketName || item.name || "",
    parts = full.split("|"),
    weapon = parts[0]?.trim() || full,
    skin = parts[1]?.trim().replace(/\s*\(.*\)$/, "") || "",
    shadow = "text-shadow:0 0.1rem 0.4rem rgba(0,0,0,.6)",
    line = `overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:${n.size}rem;line-height:${n.line}rem;${shadow}`;
  return `<div class="crv-opened-card" data-testid="opened-item-card-${escape(item.id)}" style="width:${d.width / 10}rem;height:${d.height / 10}rem">
    <div class="crv-opened-bg" style="background:${rarityBackground(color)}"></div>
    <div class="crv-opened-strip" style="background:${color};height:${d.stripHeight / 10}rem"></div>
    <div class="crv-opened-art"><img src="${escape(image(item))}" alt="${escape(full)}" decoding="async" style="width:${d.imageWidth / 10}rem;height:${d.imageHeight / 10}rem"></div>
    <div class="crv-opened-names" style="${n.pos}">${weapon ? `<span data-testid="opened-item-name-${escape(item.id)}" style="${line};font-weight:700;color:#fff">${escape(weapon)}</span>` : ""}${skin ? `<span style="${line};font-weight:${n.skinWeight};color:rgba(255,255,255,.85)">${escape(skin)}</span>` : ""}</div>
  </div>`;
}

export function createRouletteStage(stage, { items, scrollEl, spacer }) {
  stage.className = "case-roulette-v2";
  stage.hidden = true;
  stage.dataset.visible = "false";
  let rolls = [],
    count = 0,
    m = null,
    revealed = false,
    visible = false,
    defaultHeight = null;
  const native = document.createElement("div");
  native.className = "crv-native";
  const grid = document.createElement("div");
  native.append(grid);
  stage.append(native);
  preloadItemImages(items);

  function applyMetrics() {
    if (!count) return;
    const mobile = isMobileLayout();
    m = metrics(count, mobile, revealed, scrollEl?.clientWidth || stage.parentElement?.clientWidth || 1540);
    const L = m.layout;
    stage.dataset.layout = L.name;
    stage.style.top = m.top + "rem";
    stage.style.width = m.visualWidth + "rem";
    stage.style.height = m.visualHeight + "rem";
    native.style.width = m.nativeWidth + "rem";
    native.style.height = m.nativeHeight + "rem";
    native.style.transform = !mobile && m.desktopScale < 1 ? `scale(${m.desktopScale})` : "";
    const many = !mobile && count >= 5,
      colGap = count <= 1 ? 0 : 2,
      k = L.containerWidth / 10;
    grid.className = mobile ? "crv-grid crv-grid-mobile" : many ? "crv-grid crv-grid-six" : "crv-grid crv-grid-wrap";
    grid.style.gridTemplateColumns = many ? `repeat(6, ${(k - colGap) / 2}rem)` : "";
    grid.style.columnGap = mobile ? "" : colGap + "rem";
    grid.style.rowGap = mobile ? "" : (count <= 1 ? 0 : 2) + "rem";
    rolls.forEach(({ el, view, overlay }, l) => {
      el.style.width = (mobile ? m.visualWidth : k) + "rem";
      el.style.height = (mobile ? m.viewport + m.sell : L.containerHeight / 10 + m.sell) + "rem";
      const rest = count % 3,
        full = count - rest;
      el.style.gridColumn = many ? (l < full ? "span 2" : rest === 1 ? "3 / span 2" : l === full ? "2 / span 2" : "4 / span 2") : "";
      view.style.width = L.containerWidth / 10 + "rem";
      view.style.height = L.containerHeight / 10 + "rem";
      view.style.transform = mobile ? `translateX(-50%) scale(${m.mobileScale})` : "";
      view.classList.toggle("crv-view-mobile", mobile);
      if (overlay) overlay.style.height = m.viewport + (mobile && revealed ? sellArea(count, true) : 0) + "rem";
    });
    if (spacer) {
      defaultHeight ??= spacer.style.height || "";
      if (visible) spacer.style.setProperty("height", Math.max(mobile ? 34.7 : 59.4, m.nativeHeight + 8) + "rem", "important");
    }
  }
  const onResize = () => applyMetrics();
  const resizeObserver = new ResizeObserver(onResize);
  if (scrollEl) resizeObserver.observe(scrollEl);
  window.addEventListener("resize", onResize);

  return {
    get rolls() {
      return rolls;
    },
    get count() {
      return count;
    },
    // Build `n` idle roulettes (offset 0) for the next opening.
    build(n) {
      rolls.forEach((r) => r.roulette.destroy());
      grid.replaceChildren();
      count = n;
      revealed = false;
      stage.dataset.revealed = "false";
      const mobile = isMobileLayout(),
        layout = LAYOUTS[getRouletteSize(n, mobile)];
      rolls = Array.from({ length: n }, (_, index) => {
        const el = document.createElement("div");
        el.className = "crv-roll";
        el.dataset.testid = `case-roulette-${index}`;
        el.dataset.row = String(index);
        const view = document.createElement("div");
        view.className = "crv-view";
        el.append(view);
        grid.append(el);
        return { el, view, overlay: null, roulette: null };
      });
      applyMetrics();
      rolls.forEach((r, index) => (r.roulette = new CaseRoulette(r.view, { items, layout, mobile, index })));
    },
    show(on, { instant = false } = {}) {
      visible = on;
      stage.hidden = false;
      stage.classList.toggle("crv-instant", instant);
      if (on) applyMetrics();
      else if (spacer) spacer.style.height = defaultHeight ?? spacer.style.height;
      // Two frames so the hidden -> visible slide-in transition runs.
      requestAnimationFrame(() => requestAnimationFrame(() => (stage.dataset.visible = String(on))));
      if (instant) stage.dataset.visible = String(on);
    },
    suppress(on) {
      stage.classList.toggle("crv-suppressed", on);
    },
    spin(winners, mode, signal, onCross) {
      return Promise.all(rolls.map((r, i) => r.roulette.spin(winners[i], mode, signal, i === 0 ? onCross : null)));
    },
    // Opened state: lens off, strip dimmed, the card scales in over 700 ms.
    reveal(winners, sellLabel) {
      revealed = true;
      stage.dataset.revealed = "true";
      const mobile = isMobileLayout();
      rolls.forEach((r, index) => {
        const item = winners[index];
        r.roulette.setLensVisible(false);
        r.roulette.setDimmed(true);
        r.overlay?.remove();
        const overlay = document.createElement("div");
        overlay.className = "crv-overlay";
        const button =
          count > 1
            ? `<button type="button" class="crv-sell ${mobile ? "crv-sell-mobile" : ""}" data-testid="case-open-sell-item-${index}" data-sell-instance="${escape(item.instanceId)}" style="${mobile ? "" : `width:${count <= 1 ? 36 : count <= 4 ? 30.857 : 23.143}rem`}"><span>${sellLabel(item)}</span><img src="${asset("coin.svg")}" alt=""></button>`
            : "";
        overlay.innerHTML = `<div class="crv-overlay-inner ${mobile ? "crv-overlay-column" : ""}">${openedCard(item, count, mobile)}${mobile ? button : ""}</div>${mobile ? "" : button}`;
        r.el.append(overlay);
        r.overlay = overlay;
        r.el.dataset.winner = item.id;
        requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("crv-overlay-shown")));
      });
      applyMetrics();
    },
    relayout: applyMetrics,
    destroy() {
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      rolls.forEach((r) => r.roulette?.destroy());
      rolls = [];
    },
  };
}

export async function openingAnimation({ stageCtl, stage, c, winners, audio, turbo = false, scene = null, reopen = false, signal = null, onReveal }) {
  const check = () => {
    if (signal?.aborted) throw new DOMException("Opening cancelled", "AbortError");
  };
  const mobile = isMobileLayout(),
    mode = turbo ? "fast" : "normal",
    count = winners.length;
  if (reopen) stageCtl.suppress(true);
  const sceneReady = scene?.isReady?.() ?? false;
  if (sceneReady) scene.open().catch(() => {});
  requestAnimationFrame(() => {
    if (!signal?.aborted) audio.play("Open_KeyUnlock");
  });
  const opening = wait(sceneReady ? (mobile ? 2000 : 1800) : 0, signal);
  if (reopen) {
    await wait(320, signal);
    check();
    stageCtl.show(false, { instant: true });
  }
  await opening;
  check();
  scene?.pause(true);
  stageCtl.build(count);
  stage.dataset.count = String(count);
  stage.dataset.speedMode = mode;
  if (reopen) stageCtl.suppress(false);
  const perCase = Number(c.price) > 0 ? Number(c.price) : 0;
  const rare = perCase > 0 && winners.some((i) => Number(i.price) >= 2 * perCase);
  const finish = () => {
    audio.stop("Roll_Tick_Slow");
    audio.play(rare ? "Drop_Rare" : "Drop_Common");
  };
  if (turbo) {
    stage.dataset.phase = "fast-result";
    stageCtl.show(true, { instant: reopen });
    await frame();
    check();
    onReveal?.();
    finish();
    return;
  }
  stage.dataset.phase = "rolling";
  stageCtl.show(true, { instant: reopen });
  await frame();
  check();
  audio.play("Roll_Tick_Slow");
  // The tick track fades out after ~2.6 s while the strip still crawls for
  // ~4 s; from there every item passing the marker gets its own tick (a
  // slice of the same track) until the strip stops.
  let lastTick = 0;
  const onCross = (elapsed) => {
    const now = performance.now();
    if (elapsed < TAIL_TICKS_FROM_MS || now - lastTick < 70) return;
    lastTick = now;
    audio.playSlice?.("Roll_Tick_Slow", TICK_SLICE.offset, TICK_SLICE.duration, TICK_SLICE.volume);
  };
  try {
    await stageCtl.spin(winners, mode, signal, onCross);
  } finally {
    if (signal?.aborted) audio.stop("Roll_Tick_Slow");
  }
  check();
  onReveal?.();
  finish();
}
