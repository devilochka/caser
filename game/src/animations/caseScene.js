import { image, escape } from "../components/items.js";
// Objects whose positions the original playOpenEffect restores before
// replaying the open event (no scene reload between openings).
const RESET_OBJECTS = ["Case", "Caselight", "Shadow", "Casepng"];
const CLICK_FALLBACKS = ["Case", "Caselight", "Shadow"];
export function createCaseScene(host, item, onError) {
  if (matchMedia('(max-width:600px)').matches) {
    // Phone-sized scene: preserve the case and opening motion without a large
    // WebGL canvas or a continuous render loop on a small screen.
    host.innerHTML=`<img class="mobile-case-art" src="${escape(image(item))}" alt="${escape(item.title)}">`;
    let disposed=false;
    const art=host.querySelector('img'),ready=art.decode().catch(()=>{});
    return { ready, app:null, isReady:()=>!disposed,
      pause(value){host.classList.toggle('scene-blurred',value);},
      async open(){await ready;if(disposed)return;art.getAnimations().forEach(a=>a.cancel());art.animate([{transform:'translateY(0) scale(1)'},{transform:'translateY(-12px) scale(1.06)',offset:.5},{transform:'translateY(0) scale(1)'}],{duration:550,easing:'ease-in-out'});},
      async reset(){host.classList.remove('scene-blurred');},
      dispose(){disposed=true;art.getAnimations().forEach(a=>a.cancel());},
    };
  }
  let positions = null;
  let spline = null,
    disposed = false,
    frame = 0,
    paused = false,
    textureReady = false;
  host.replaceChildren();
  const canvas = document.createElement("canvas");
  canvas.className = "case-spline-canvas";
  host.append(canvas);
  const resize = () => {
    if (!spline) return;
    const mobile = matchMedia("(max-width:1024px)").matches;
    const base = Math.min(host.clientHeight, host.clientWidth / (16 / 9)),
      height = Math.round(base * (mobile ? 1.8 : 1.6)),
      width = Math.round((height * 16) / 9);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    spline.setSize(width, height);
    spline.requestRender();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  let lastRender=0;
  const render = (now) => {
    if (disposed) return;
    if (!paused && (!matchMedia('(max-width:1024px)').matches || now-lastRender>=33)) {
      spline?.requestRender();lastRender=now;
    }
    frame = requestAnimationFrame(render);
  };
  async function load() {
    spline?.dispose();
    textureReady = false;
    const { Application, TextureFilter } =
      await import(new URL("./spline-runtime/spline-reference.js",document.baseURI).href);
    if (disposed) return;
    spline = new Application(canvas, { renderMode: "manual" });
    await spline.load("./animation/caser-case.splinecode");
    if (disposed) {
      spline.dispose();
      return;
    }
    resize();
    const response = await fetch(image(item));
    if (!response.ok) throw Error("Не удалось загрузить текстуру кейса");
    const bytes = new Uint8Array(await response.arrayBuffer());
    for (const object of spline.getAllObjects())
      if (["casepng", "caselight"].includes(object.name.toLowerCase()))
        for (const layer of object.material?.layers || [])
          if (layer.type === "texture") {
            await layer.updateTexture(bytes);
            layer.texture.minFilter = TextureFilter.LinearFilter;
          }
    textureReady = true;
    positions = new Map();
    for (const name of RESET_OBJECTS) {
      const object = spline.findObjectByName(name);
      if (object) positions.set(name, { x: object.position.x, y: object.position.y, z: object.position.z });
    }
    host.dataset.spline = "ready";
    spline.requestRender();
  }
  const ready = load().catch((error) => {
    if (disposed) return;
    host.dataset.spline = "fallback";
    host.dataset.error = error.message;
    host.dataset.errorStack = error.stack;
    spline?.dispose();
    spline = null;
    host.innerHTML = `<img class="case-scene-fallback" src="${escape(image(item))}" alt="${escape(item.title)}">`;
    onError?.(error);
  });
  frame = requestAnimationFrame(render);
  return {
    ready,
    get app() {
      return spline;
    },
    pause(value) {
      paused = value;
      host.classList.toggle("scene-blurred", value);
    },
    isReady() {
      return !!spline && textureReady && !disposed;
    },
    async open() {
      await ready;
      if (!spline || !textureReady) return;
      paused = false;
      host.classList.remove("scene-blurred");
      for (const [name, p] of positions || []) {
        const object = spline.findObjectByName(name);
        if (object) {
          object.position.x = p.x;
          object.position.y = p.y;
          object.position.z = p.z;
        }
      }
      let ids = [];
      try {
        ids = Object.keys(spline.getSplineEvents()?.mouseDown || {});
      } catch {}
      let hit = false;
      const emit = (id) => {
        const object = spline.findObjectById?.(id) ?? spline.findObjectByName(id);
        try {
          object?.emitEvent("mouseDown");
          if (object) hit = true;
        } catch {}
        try {
          spline.emitEvent("mouseDown", object?.name ?? id);
        } catch {}
      };
      ids.forEach(emit);
      if (!hit) CLICK_FALLBACKS.forEach(emit);
    },
    async reset() {
      if (!spline || disposed) return;
      paused = false;
      await load();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      spline?.dispose();
    },
  };
}
