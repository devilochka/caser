// Case roulette, ported from the original caser.one case page
// (case-module.js: iU roulette, iy PIXI view, texture helpers ie/ir/is/il/iu,
// layouts $/CASE_ROULETTE_STRIP, OPENED_ITEM_CARD). The original draws with
// PIXI; here the same textures are drawn on a 2D canvas. Strip cards carry no
// text: only the rarity background and the skin image.
import { image, rarityColor } from "../components/items.js";
import { cubicBezier } from "./easing.js";

const STRIP = {
  L: { bgItemWidth: 230, bgItemHeight: 173.5, bgItemGap: 9.86, lensItemWidth: 270, lensItemHeight: 210, lensItemGap: 11.5, markerWidth: 5, markerHeight: 209.97 },
  M: { bgItemWidth: 268, bgItemHeight: 202, bgItemGap: 9.86, lensItemWidth: 270, lensItemHeight: 210, lensItemGap: 11.5, markerWidth: 5, markerHeight: 209.97 },
  S: { bgItemWidth: 204, bgItemHeight: 164, bgItemGap: 7.51, lensItemWidth: 205.71, lensItemHeight: 160, lensItemGap: 8.76, markerWidth: 3.81, markerHeight: 159.98 },
  S6: { bgItemWidth: 204, bgItemHeight: 154, bgItemGap: 7.51, lensItemWidth: 205.71, lensItemHeight: 160, lensItemGap: 8.76, markerWidth: 3.81, markerHeight: 159.98 },
  MOB_L: { bgItemWidth: 126.79, bgItemHeight: 98.61, bgItemGap: 5.4, lensItemWidth: 147.92, lensItemHeight: 115.05, lensItemGap: 6.3, markerWidth: 2.74, markerHeight: 115.03 },
  MOB_S: { bgItemWidth: 98.61, bgItemHeight: 76.7, bgItemGap: 4.2, lensItemWidth: 115.05, lensItemHeight: 89.48, lensItemGap: 4.9, markerWidth: 2.13, markerHeight: 89.47 },
};
const CONTAINER = {
  L: { containerWidth: 1540, containerHeight: 280, lensSize: 500 },
  M: { containerWidth: 750, containerHeight: 240, lensSize: 500 },
  S: { containerWidth: 500, containerHeight: 180, lensSize: 380.95 },
  S6: { containerWidth: 500, containerHeight: 180, lensSize: 380.95 },
  MOB_L: { containerWidth: 359.52, containerHeight: 180, lensSize: 273.92 },
  MOB_S: { containerWidth: 279.63, containerHeight: 120, lensSize: 213.05 },
};
export const LAYOUTS = Object.fromEntries(Object.keys(STRIP).map((k) => [k, { name: k, ...CONTAINER[k], ...STRIP[k] }]));
export const OPENED_ITEM_CARD = {
  L: { width: 360, height: 280, imageWidth: 353, imageHeight: 264.75, stripHeight: 14.63 },
  M: { width: 308.57, height: 240, imageWidth: 302, imageHeight: 226.5, stripHeight: 12.54 },
  S: { width: 231.43, height: 180, imageWidth: 225, imageHeight: 168.75, stripHeight: 9.4 },
  MOB_L: { width: 231.43, height: 180, imageWidth: 231, imageHeight: 173.25, stripHeight: 9.4 },
  MOB_S: { width: 154.29, height: 120, imageWidth: 154, imageHeight: 115.5, stripHeight: 7 },
};
export const getOpenedItemSize = (count, mobile) => (mobile ? (count <= 1 ? "MOB_L" : "MOB_S") : count <= 1 ? "L" : count <= 4 ? "M" : "S");
export function getRouletteSize(count, mobile) {
  if (mobile) return count <= 1 ? "MOB_L" : "MOB_S";
  return count === 1 ? "L" : count <= 4 ? "M" : count === 5 ? "S" : "S6";
}
export const SPEED = {
  normal: { speedPxPerSec: 1200, stopDurationMs: 6500, spinsBeforeStop: 5 },
  fast: { speedPxPerSec: 2000, stopDurationMs: 2500, spinsBeforeStop: 3 },
};
const stopEase = cubicBezier(0.2, 0.3, 0.15, 1);
const dimEase = cubicBezier(0.25, 0.1, 0.25, 1);

const hexToRgba = (hex, a) => {
  let h = String(hex || "#B0C3D9").replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const rarityBackground = (color) =>
  `linear-gradient(180deg, ${hexToRgba(color, 0)} 60%, ${hexToRgba(color, 0.45)} 100%), radial-gradient(68.29% 68.29% at 50% 50%, #7F7D7D 31.71%, #615B63 100%)`;

// Offscreen textures, cached per size, colour and pixel scale.
const textures = new Map();
function texture(key, w, h, ps, draw) {
  const k = `${key}|${ps.toFixed(3)}`;
  let c = textures.get(k);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * ps));
  c.height = Math.max(1, Math.ceil(h * ps));
  const ctx = c.getContext("2d");
  ctx.scale(ps, ps);
  draw(ctx, w, h);
  if (textures.size > 400) textures.delete(textures.keys().next().value);
  textures.set(k, c);
  return c;
}
// ie: card background.
const cardTexture = (w, h, color, ps) =>
  texture(`card|${w}x${h}|${color}`, w, h, ps, (e, t, i) => {
    const sx = Math.max(0.01, 0.6829 * t),
      sy = Math.max(0.01, 0.6829 * i);
    e.save();
    e.translate(t / 2, i / 2);
    e.scale(sx, sy);
    const a = e.createRadialGradient(0, 0, 0, 0, 0, 1);
    a.addColorStop(0.3171, "#7F7D7D");
    a.addColorStop(1, "#615B63");
    e.fillStyle = a;
    e.fillRect(-t / 2 / sx, -i / 2 / sy, t / sx, i / sy);
    e.restore();
    const l = e.createLinearGradient(0, 0, 0, i);
    l.addColorStop(0, hexToRgba(color, 0));
    l.addColorStop(0.6, hexToRgba(color, 0));
    l.addColorStop(1, hexToRgba(color, 0.45));
    e.fillStyle = l;
    e.fillRect(0, 0, t, i);
    e.fillStyle = color;
    e.fillRect(0, i - 9.4, t, 9.4);
    e.lineWidth = 2;
    e.strokeStyle = "rgba(0,0,0,0.1)";
    e.strokeRect(1, 1, t - 2, i - 2);
  });
// ir: yellow marker.
const markerTexture = (w, h, ps) =>
  texture(`marker|${w}x${h}`, w + 8, h + 8, ps, (r) => {
    r.shadowBlur = 4 * ps;
    r.shadowColor = "rgba(0,0,0,0.25)";
    r.fillStyle = "rgba(255,255,75,0.75)";
    r.fillRect(4, 4, w, h);
    r.shadowColor = "rgba(0,0,0,0)";
    r.shadowBlur = 0;
    r.lineWidth = 1;
    r.strokeStyle = "rgba(125,125,0,0.15)";
    r.strokeRect(4.5, 4.5, w - 1, h - 1);
  });
// is: alpha mask of the background strip (edge fade, lens cut-out, opacity).
const stripMask = (t, r, i, s, n, ps) =>
  texture(`strip|${t}x${r}|${i}|${s ? s.inner + "-" + s.outer : "none"}|${n}`, t, r, ps, (e) => {
    const a = e.createLinearGradient(0, 0, t, 0);
    a.addColorStop(0, "rgba(255,255,255,0)");
    a.addColorStop(i, `rgba(255,255,255,${n})`);
    a.addColorStop(1 - i, `rgba(255,255,255,${n})`);
    a.addColorStop(1, "rgba(255,255,255,0)");
    e.fillStyle = a;
    e.fillRect(0, 0, t, r);
    if (!s) return;
    const l = e.createRadialGradient(t / 2, r / 2, 0, t / 2, r / 2, s.outer),
      o = Math.min(0.999, s.inner / s.outer);
    l.addColorStop(0, "rgba(0,0,0,1)");
    l.addColorStop(o, "rgba(0,0,0,1)");
    l.addColorStop(1, "rgba(0,0,0,0)");
    e.globalCompositeOperation = "destination-out";
    e.fillStyle = l;
    e.fillRect(0, 0, t, r);
    e.globalCompositeOperation = "source-over";
  });
// il: alpha mask of the lens (circle + edge fade).
const lensMask = (e, t, r, i, ps) =>
  texture(`lens|${e}x${t}|${r}|${i}`, r, t, ps, (c, s, n) => {
    const l = c.createRadialGradient(s / 2, n / 2, 0, s / 2, n / 2, r / 2);
    l.addColorStop(0.99, "rgba(255,255,255,1)");
    l.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = l;
    c.fillRect(0, 0, s, n);
    c.globalCompositeOperation = "destination-in";
    const o = (e - r) / 2,
      u = c.createLinearGradient(-o, 0, e - o, 0);
    u.addColorStop(0, "rgba(255,255,255,0)");
    u.addColorStop(i, "rgba(255,255,255,1)");
    u.addColorStop(1 - i, "rgba(255,255,255,1)");
    u.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = u;
    c.fillRect(0, 0, s, n);
    c.globalCompositeOperation = "source-over";
  });
// iu: dark loupe backdrop, a lighter variant with inner shadow while moving.
const loupeTexture = (e, t, r, i, moving, ps) =>
  texture(`loupe|${e}x${t}|${r}|${i}|${moving ? "m" : "i"}`, r, t, ps, (c, n, a) => {
    const l = r / 2,
      o = n / 2,
      u = a / 2;
    c.save();
    c.beginPath();
    c.arc(o, u, l, 0, 2 * Math.PI);
    c.clip();
    c.fillStyle = moving ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.25)";
    c.fillRect(0, 0, n, a);
    if (moving) {
      const g = c.createRadialGradient(o, u, Math.max(0, l - 28), o, u, l);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.42)");
      c.fillStyle = g;
      c.fillRect(0, 0, n, a);
      c.lineWidth = 1;
      c.strokeStyle = "rgba(255,255,255,0.14)";
      c.beginPath();
      c.arc(o, u, l - 0.5, 0, 2 * Math.PI);
      c.stroke();
    }
    c.restore();
    c.globalCompositeOperation = "destination-in";
    const h = (e - r) / 2,
      d = c.createLinearGradient(-h, 0, e - h, 0);
    d.addColorStop(0, "rgba(255,255,255,0)");
    d.addColorStop(i, "rgba(255,255,255,1)");
    d.addColorStop(1 - i, "rgba(255,255,255,1)");
    d.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = d;
    c.fillRect(0, 0, n, a);
    c.globalCompositeOperation = "source-over";
  });

const images = new Map();
function loadImage(url, onLoad) {
  let entry = images.get(url);
  if (!entry) {
    const img = new Image();
    img.decoding = "async";
    entry = { img, ok: false, listeners: new Set() };
    img.onload = () => {
      entry.ok = img.naturalWidth > 0;
      entry.listeners.forEach((f) => f());
      entry.listeners.clear();
    };
    img.onerror = () => entry.listeners.clear();
    img.src = url;
    images.set(url, entry);
  }
  if (!entry.ok && onLoad) entry.listeners.add(onLoad);
  return entry;
}
export function preloadItemImages(items) {
  for (const item of items) loadImage(image(item));
}

// iP/iA: the strip repeats the case pool; round 0 keeps the case order, the
// next rounds are seeded shuffles (mulberry32), the winner replaces one slot.
function createSource(seed, pool) {
  const rounds = new Map();
  const mulberry = (a) => () => {
    a |= 0;
    let e = Math.imul((a = (a + 0x6d2b79f5) | 0) ^ (a >>> 15), 1 | a);
    return (((e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e) ^ (e >>> 14)) >>> 0) / 0x100000000;
  };
  const round = (r) => {
    let list = rounds.get(r);
    if (!list) {
      if (r === 0) list = pool;
      else {
        const rnd = mulberry(Math.imul((seed ^ r) >>> 0, 0x9e3779b1) >>> 0);
        list = [...pool];
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(rnd() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]];
        }
      }
      rounds.set(r, list);
    }
    return list;
  };
  const len = Math.max(1, pool.length);
  return {
    totalLen: 6 * len,
    winnerIdx: null,
    winner: null,
    get(i) {
      if (i === this.winnerIdx && this.winner) return this.winner;
      return round(Math.floor(i / len))[i % len];
    },
  };
}

export class CaseRoulette {
  constructor(host, { items, layout, mobile, index = 0 }) {
    this.host = host;
    this.items = items;
    this.layout = layout;
    this.mobile = mobile;
    this.index = index;
    this.offset = 0;
    this.lensVisible = true;
    this.inMotion = false;
    this.dimmed = false;
    this.dimAlpha = 1;
    this.destroyed = false;
    this.source = createSource((Math.random() * 2 ** 32) >>> 0, items);
    this.canvas = document.createElement("canvas");
    this.canvas.className = "case-roulette-canvas";
    this.canvas.setAttribute("aria-hidden", "true");
    host.append(this.canvas);
    this.strip = document.createElement("canvas");
    this.lens = document.createElement("canvas");
    this.frame = 0;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.resize();
  }
  resize() {
    const r = this.host.getBoundingClientRect();
    // Pixel size of one native layout unit (the host may be CSS-scaled).
    const s = r.width / this.layout.containerWidth;
    if (!(s > 0)) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.ps = s * dpr;
    const w = Math.round(this.layout.containerWidth * this.ps),
      h = Math.round(this.layout.containerHeight * this.ps);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.displayScale = s;
    this.requestDraw();
  }
  requestDraw() {
    if (this.destroyed || this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.draw();
    });
  }
  setLensVisible(v) {
    if (this.lensVisible === v) return;
    this.lensVisible = v;
    this.requestDraw();
  }
  setDimmed(v) {
    if (this.dimmed === v) return;
    this.dimmed = v;
    const from = this.dimAlpha,
      to = v ? 0.45 : 1,
      start = performance.now();
    cancelAnimationFrame(this.dimFrame);
    const step = (now) => {
      if (this.destroyed) return;
      const t = Math.min(1, (now - start) / 500);
      this.dimAlpha = from + (to - from) * dimEase(t);
      this.draw();
      if (t < 1) this.dimFrame = requestAnimationFrame(step);
    };
    this.dimFrame = requestAnimationFrame(step);
  }
  paintCards(ctx, first, last, place, ps) {
    for (let i = Math.max(0, first); i < Math.min(this.source.totalLen, last); i++) {
      const item = this.source.get(i);
      if (!item) continue;
      const { x, y, w, h } = place(i);
      const color = rarityColor(item);
      ctx.drawImage(cardTexture(w, h, color, ps), x, y, w, h);
      const entry = loadImage(image(item), () => this.requestDraw());
      if (!entry.ok) continue;
      const iw = entry.img.naturalWidth,
        ih = entry.img.naturalHeight,
        bw = w - 4,
        bh = h - 4,
        k = Math.min(bw / iw, bh / ih);
      ctx.drawImage(entry.img, x + 2 + (bw - iw * k) / 2, y + 2 + (bh - ih * k) / 2, iw * k, ih * k);
    }
  }
  draw() {
    if (this.destroyed || !this.ps) return;
    const L = this.layout,
      ps = this.ps,
      e = L.containerWidth,
      H = L.containerHeight,
      n = L.lensSize,
      fade = this.mobile ? 0.08 : 0.18,
      pitch = L.bgItemWidth + L.bgItemGap,
      l = this.offset;
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalAlpha = this.dimAlpha;
    ctx.setTransform(ps, 0, 0, ps, 0, 0);
    // Background strip.
    const sh = L.bgItemHeight;
    this.strip.width = this.canvas.width;
    this.strip.height = Math.ceil(sh * ps);
    const sc = this.strip.getContext("2d");
    sc.setTransform(ps, 0, 0, ps, 0, 0);
    this.paintCards(sc, Math.floor(l / pitch) - 2, Math.ceil((l + e) / pitch) + 2, (i) => ({ x: i * pitch - l, y: 0, w: L.bgItemWidth, h: sh }), ps);
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.globalCompositeOperation = "destination-in";
    const cut = this.lensVisible ? { inner: n / 2 + 4, outer: n / 2 + 14 } : null;
    const opacity = this.lensVisible ? (this.mobile ? 0.75 : 0.65) : 1;
    sc.drawImage(stripMask(e, sh, fade, cut, opacity, ps), 0, 0, this.strip.width, this.strip.height);
    sc.globalCompositeOperation = "source-over";
    ctx.drawImage(this.strip, 0, (H - sh) / 2, e, this.strip.height / ps);
    const g = (e - n) / 2;
    if (this.lensVisible) {
      ctx.drawImage(loupeTexture(e, H, n, fade, this.inMotion, ps), g, 0, n, H);
      const o = (L.lensItemWidth + L.lensItemGap) / pitch,
        moverX = n / 2 - o * (o * (l + (e / 2 - L.bgItemWidth / 2)) + L.lensItemWidth / 2),
        lensPitch = L.lensItemWidth + L.lensItemGap;
      this.lens.width = Math.ceil(n * ps);
      this.lens.height = this.canvas.height;
      const lc = this.lens.getContext("2d");
      lc.setTransform(ps, 0, 0, ps, 0, 0);
      const u = Math.floor((l + e / 2) / pitch),
        span = Math.ceil(n / 2 / pitch) + 3;
      this.paintCards(lc, u - span, u + span + 1, (i) => ({ x: moverX + o * i * lensPitch, y: H / 2 - (o * L.lensItemHeight) / 2, w: o * L.lensItemWidth, h: o * L.lensItemHeight }), ps);
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = "destination-in";
      lc.drawImage(lensMask(e, H, n, fade, ps), 0, 0, this.lens.width, this.lens.height);
      lc.globalCompositeOperation = "source-over";
      ctx.drawImage(this.lens, g, 0, n, this.lens.height / ps);
    }
    ctx.drawImage(markerTexture(L.markerWidth, L.markerHeight, ps), (e - L.markerWidth) / 2 - 4, (H - L.markerHeight) / 2 - 4, L.markerWidth + 8, L.markerHeight + 8);
    ctx.globalAlpha = 1;
  }
  // Stop phase of the original iU effect: the result is known, so the strip
  // decelerates from the current offset onto the winner (cubic 0.2,0.3,0.15,1).
  spin(winner, mode = "normal", signal = null, onCross = null) {
    const L = this.layout,
      cfg = SPEED[mode] || SPEED.normal,
      s = L.bgItemWidth + L.bgItemGap,
      f = L.containerWidth,
      a = f / 2 - L.bgItemWidth / 2,
      l = this.offset,
      scale = this.displayScale > 0 ? this.displayScale : 1,
      h = Math.max(2400 / scale, cfg.spinsBeforeStop * Math.max(1, this.items.length) * s);
    let d = Math.round((l + h + a) / s);
    this.source.totalLen = Math.max(this.source.totalLen, d + 11);
    this.source.winnerIdx = d;
    this.source.winner = winner;
    const target = d * s - a,
      duration = cfg.stopDurationMs;
    // Preload what the strip will show around the winner.
    for (let i = Math.max(0, d - 4); i <= d + 4; i++) loadImage(image(this.source.get(i)));
    this.inMotion = true;
    return new Promise((resolve) => {
      const start = performance.now();
      let lastSlot = Math.floor((l + f / 2) / s);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        cancelAnimationFrame(this.spinFrame);
        clearTimeout(this.safety);
        this.offset = target;
        this.inMotion = false;
        this.draw();
        resolve();
      };
      const step = (now) => {
        if (this.destroyed || signal?.aborted) return finish();
        const t = Math.min(1, Math.max(0, (now - start) / duration));
        this.offset = l + (target - l) * stopEase(t);
        // Item boundary passing the centre marker (used for the tail ticks).
        const slot = Math.floor((this.offset + f / 2) / s);
        if (onCross && slot !== lastSlot) onCross(now - start, duration);
        lastSlot = slot;
        this.draw();
        if (t >= 1) finish();
        else this.spinFrame = requestAnimationFrame(step);
      };
      this.spinFrame = requestAnimationFrame(step);
      // Original fallback: complete even if frames are throttled.
      this.safety = setTimeout(finish, duration + 600);
    });
  }
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    cancelAnimationFrame(this.spinFrame);
    cancelAnimationFrame(this.dimFrame);
    clearTimeout(this.safety);
    this.observer.disconnect();
    this.canvas.remove();
  }
}
