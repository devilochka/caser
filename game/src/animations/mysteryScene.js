// Mystery Spline scene, ported from the original UpgradeMysterySpline
// component (chunk 40u5womfhyy1u.js, module 658672) and its constants
// (module 84917):
// - continuous render (the scene animates its own skin carousel),
// - "contain" sizing with aspect 290/180, canvas without pointer events,
// - after load: pauseGameControls(), setGlobalEvents(false), click target =
//   env name || first object of getSplineEvents().mouseDown || fallbacks
//   Canvas/Scene/Cube/Empty, reveal = object.emitEvent("mouseDown"),
// - when the phase goes back from upgrade_reveal to idle after a reveal, the
//   scene is reloaded (original: remount via a counter).
import { probe } from "../services/assetProbe.js";

export const MYSTERY_SCENE_URL = "./spline/caser-upgrade-mystery.splinecode";
export const MYSTERY_SCENE_ASPECT = 290 / 180;
export const MYSTERY_CLICK_OBJECT_NAME = "";
export const MYSTERY_CLICK_FALLBACKS = ["Canvas", "Scene", "Cube", "Empty"];

function emitOn(app, idOrName) {
  const object = app.findObjectById?.(idOrName) ?? app.findObjectByName?.(idOrName);
  if (!object) return false;
  try {
    object.emitEvent("mouseDown");
    return true;
  } catch {
    return false;
  }
}
function clickTargetName(app) {
  const env = MYSTERY_CLICK_OBJECT_NAME.trim();
  if (env) return env;
  try {
    const events = app.getSplineEvents?.();
    const mouseDown = events?.mouseDown;
    if (mouseDown && typeof mouseDown === "object") {
      const id = Object.keys(mouseDown)[0];
      if (id) return app.findObjectById(id)?.name || id;
    }
  } catch {}
  return null;
}
function reveal(app, target) {
  if (target && emitOn(app, target)) return true;
  for (const name of MYSTERY_CLICK_FALLBACKS) if (emitOn(app, name)) return true;
  return false;
}

export function createMysteryScene(host) {
  host.dataset.phase = "idle";
  host.dataset.resync = "0";
  host.dataset.tick = "0";
  host.classList.add("isolate", "min-h-0", "min-w-0", "overflow-hidden");
  const box = document.createElement("div");
  box.className = "pointer-events-none absolute left-1/2 top-1/2 min-h-0 min-w-0 -translate-x-1/2 -translate-y-1/2";
  const canvas = document.createElement("canvas");
  canvas.className = "mystery-spline-canvas pointer-events-none absolute inset-0";
  canvas.setAttribute("aria-hidden", "true");
  box.append(canvas);
  const shield = document.createElement("div");
  shield.className = "pointer-events-auto absolute inset-0 z-[3] cursor-default touch-none";
  host.append(box, shield);
  let app = null,
    target = null,
    loaded = false,
    revealed = false,
    disposed = false,
    generation = 0,
    lastSize = null;
  const fit = () => {
    if (!app) return;
    const w = host.clientWidth,
      h = host.clientHeight;
    if (w <= 0 || h <= 0) return;
    let cw, ch;
    if (w / h > MYSTERY_SCENE_ASPECT) {
      ch = h;
      cw = h * MYSTERY_SCENE_ASPECT;
    } else {
      cw = w;
      ch = w / MYSTERY_SCENE_ASPECT;
    }
    cw = Math.round(cw);
    ch = Math.round(ch);
    box.style.width = canvas.style.width = cw + "px";
    box.style.height = canvas.style.height = ch + "px";
    if (lastSize?.w !== cw || lastSize?.h !== ch) {
      app.setSize(cw, ch);
      lastSize = { w: cw, h: ch };
    }
  };
  let resizeTimer = 0;
  const observer = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(fit, 30);
  });
  observer.observe(host);
  async function load() {
    const gen = ++generation;
    app?.dispose();
    app = null;
    loaded = false;
    revealed = false;
    lastSize = null;
    host.dataset.spline = "loading";
    if (!(await probe(MYSTERY_SCENE_URL))) {
      if (gen === generation) host.dataset.spline = "missing";
      return false;
    }
    for (let i = 0; i < 120 && !disposed && (host.clientWidth <= 0 || host.clientHeight <= 0); i++)
      await new Promise(requestAnimationFrame);
    const { Application } = await import(new URL("./spline-runtime/spline-reference.js",document.baseURI).href);
    if (disposed || gen !== generation) return false;
    const next = new Application(canvas, { renderMode: "continuous", renderOnDemand: false });
    app = next;
    fit();
    await next.load(MYSTERY_SCENE_URL);
    if (disposed || gen !== generation) {
      next.dispose();
      return false;
    }
    target = clickTargetName(next);
    try {
      next.pauseGameControls();
    } catch {}
    try {
      next.setGlobalEvents(false);
    } catch {}
    lastSize = null;
    fit();
    loaded = true;
    host.dataset.spline = "ready";
    host.dataset.clickTarget = target || "";
    // A reveal requested while the scene was still loading.
    if (host.dataset.phase === "upgrade_reveal" && reveal(next, target)) markRevealed();
    return true;
  }
  function markRevealed() {
    revealed = true;
    host.dataset.revealEmitted = String(Number(host.dataset.revealEmitted || 0) + 1);
  }
  let ready = load().catch((error) => {
    host.dataset.spline = "error";
    host.dataset.error = error.message;
    console.error("Mystery Spline:", error);
    return false;
  });
  return {
    get ready() {
      return ready;
    },
    get phase() {
      return host.dataset.phase;
    },
    reveal() {
      host.dataset.phase = "upgrade_reveal";
      host.dataset.tick = String(Number(host.dataset.tick) + 1);
      if (loaded && app && reveal(app, target)) markRevealed();
      return revealed;
    },
    result() {
      host.dataset.phase = "result";
    },
    idle() {
      const wasRevealed = revealed;
      host.dataset.phase = "idle";
      host.dataset.tick = "0";
      host.dataset.resync = String(Number(host.dataset.resync) + 1);
      if (wasRevealed || !loaded) ready = load().catch(() => false);
      return ready;
    },
    dispose() {
      disposed = true;
      generation++;
      clearTimeout(resizeTimer);
      observer.disconnect();
      app?.dispose();
      app = null;
      box.remove();
      shield.remove();
    },
  };
}
