// Live drop feed (left panel), ported from the original LiveDrops component:
// - incoming drops wait in a queue (max 20) and are released one by one,
//   first after 220 ms, then every 350-520 ms (18%), 830-980 ms (10%) or
//   560-820 ms, so they arrive in natural-looking bursts;
// - a new card slides in from -2.8rem with a small bounce (920 ms), the
//   others move down with a FLIP animation (560 ms);
// - hovering the list pauses the feed; the list keeps 20 drops.
// DEMO: drops are fake, generated in bursts from the item catalogue.
import { image, rarityColor } from "./items.js";
import { config } from "../config.js";

const MAX = 20;
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
// The original skips the animations only on very wide screens (min-width
// 2500px), not for "reduce motion" system settings.
const reducedMotion = () => matchMedia("(min-width: 2500px)").matches;
let seq = 0;

function pickItem(items) {
  // Mostly everyday skins, sometimes something expensive, like a real feed.
  const r = Math.random();
  const pool = r < 0.72 ? items.filter((i) => i.price < 40) : r < 0.95 ? items.filter((i) => i.price >= 40 && i.price < 600) : items.filter((i) => i.price >= 600);
  const list = pool.length ? pool : items;
  return list[Math.floor(Math.random() * list.length)];
}

export function startLiveDrops(app) {
  const list = document.querySelector("#demo-live");
  if (!list || !app.items?.length) return;
  const template = list.querySelector("[data-live-drop-id]")?.cloneNode(true) || list.firstElementChild?.cloneNode(true);
  if (!template) return;
  list.querySelectorAll("button").forEach((b) => (b.onclick = () => {}));
  const queue = [];
  let paused = false,
    releaseTimer = 0,
    burstTimer = 0,
    disposed = false;

  function build(item) {
    const node = template.cloneNode(true);
    const id = "demo-" + Date.now() + "-" + ++seq;
    node.dataset.liveDropId = id;
    node.dataset.testid = "live-drop-item-" + id;
    const img = node.querySelector("img");
    if (img) {
      img.src = image(item);
      img.alt = item.marketName;
      img.onerror = () => (img.src = "./src/fallback.svg");
    }
    const line = [...node.querySelectorAll("[style]")].find((e) => e.style.backgroundColor);
    if (line) line.style.backgroundColor = rarityColor(item);
    const texts = node.querySelectorAll("span");
    const [title, rest = ""] = item.marketName.split("|");
    if (texts[0]) texts[0].textContent = title.trim();
    if (texts[1]) texts[1].textContent = rest.trim().replace(/^\((.*)\)$/, "$1") || item.skin || "";
    node.querySelectorAll("button").forEach((b) => {
      b.textContent = "DEMO";
      b.onclick = () => {};
    });
    return node;
  }
  const items = () => [...list.children].filter((e) => e instanceof HTMLElement && e.dataset.liveDropId);

  function insert(item) {
    const before = new Map(items().map((n) => [n, n.offsetTop]));
    const node = build(item);
    list.prepend(node);
    while (items().length > MAX) items().at(-1).remove();
    if (reducedMotion() || paused) return;
    for (const n of items()) {
      if (n === node || !before.has(n)) continue;
      const dy = before.get(n) - n.offsetTop;
      if (Math.abs(dy) <= 0.5) continue;
      n.getAnimations().forEach((a) => a.id === "live-drop-flip" && a.cancel());
      n.animate([{ transform: `translate(0, ${dy}px)` }, { transform: "translate(0, 0)" }], { duration: 560, easing: "cubic-bezier(0.22, 0.99, 0.36, 1)" }).id = "live-drop-flip";
    }
    const inner = node.firstElementChild || node;
    inner.animate(
      [
        { transform: "translateX(-2.8rem)", opacity: 0, offset: 0 },
        { transform: "translateX(0)", opacity: 1, offset: 0.72 },
        { transform: "translateX(0.55rem)", opacity: 1, offset: 0.82 },
        { transform: "translateX(-0.22rem)", opacity: 1, offset: 0.9 },
        { transform: "translateX(0.1rem)", opacity: 1, offset: 0.96 },
        { transform: "translateX(0)", opacity: 1, offset: 1 },
      ],
      { duration: 920, easing: "cubic-bezier(0.25, 0.82, 0.3, 1)", fill: "both" },
    ).id = "live-drop-slidein";
  }
  function release() {
    releaseTimer = 0;
    if (disposed || paused || document.hidden) return;
    const item = queue.shift();
    if (item) insert(item);
    if (queue.length) {
      const r = Math.random();
      releaseTimer = setTimeout(release, r < 0.18 ? rand(350, 520) : r > 0.9 ? rand(830, 980) : rand(560, 820));
    }
  }
  const schedule = (delay = 220) => {
    if (!disposed && !paused && queue.length && !releaseTimer) releaseTimer = setTimeout(release, delay);
  };
  function burst() {
    if (disposed) return;
    if (!document.hidden) {
      const [lo, hi] = config.LIVE_DROP_BURST_SIZE || [1, 4];
      for (let n = rand(lo, hi); n > 0; n--) queue.push(pickItem(app.items));
      queue.splice(0, Math.max(0, queue.length - MAX));
      schedule();
    }
    const [a, b] = config.LIVE_DROP_BURST_EVERY_MS || [1200, 3200];
    burstTimer = setTimeout(burst, rand(a, b));
  }
  const enter = () => {
    paused = true;
    clearTimeout(releaseTimer);
    releaseTimer = 0;
    items().forEach((n) => n.getAnimations().forEach((a) => a.id === "live-drop-flip" && a.cancel()));
  };
  const leave = () => {
    paused = false;
    schedule();
  };
  list.addEventListener("mouseenter", enter);
  list.addEventListener("mouseleave", leave);
  burstTimer = setTimeout(burst, 600);
  app.shellCleanup ??= [];
  app.shellCleanup.push(() => {
    disposed = true;
    clearTimeout(releaseTimer);
    clearTimeout(burstTimer);
    list.removeEventListener("mouseenter", enter);
    list.removeEventListener("mouseleave", leave);
  });
}
