export function createUpgradeWinScene(host, color) {
  const canvas = document.createElement("canvas");
  canvas.className = "upgrade-win-spline";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);
  let app,
    disposed = false,
    frame = 0,
    artCenter = null;
  const alignGlow = () => {
    if (!artCenter || disposed) return;
    const image = host.querySelector('.featured-image');
    if (!image) return;
    const box = image.getBoundingClientRect();
    const parent = host.getBoundingClientRect();
    const fit = Math.min(box.width / artCenter.width, box.height / artCenter.height);
    const offsetX = box.left + box.width / 2 - parent.left - parent.width / 2 + (artCenter.x - artCenter.width / 2) * fit;
    const offsetY = box.top + box.height / 2 - parent.top - parent.height / 2 + (artCenter.y - artCenter.height / 2) * fit;
    const limit = Math.min(parent.width, parent.height) * .16;
    canvas.style.transform = `translate(${Math.max(-limit, Math.min(limit, offsetX))}px, ${Math.max(-limit, Math.min(limit, offsetY))}px)`;
  };
  // Transparent padding varies by weapon. Align the scene to the visible
  // pixels when CORS permits reading the art; keep the card center otherwise.
  const locateArt = async () => {
    const image = host.querySelector('.featured-image');
    if (!image) return;
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.src = image.currentSrc || image.src;
    try {
      await probe.decode();
      if (disposed) return;
      const sample = document.createElement('canvas');
      sample.width = sample.height = 128;
      const context = sample.getContext('2d', { willReadFrequently: true });
      context.drawImage(probe, 0, 0, 128, 128);
      const pixels = context.getImageData(0, 0, 128, 128).data;
      let x = 0, y = 0, weight = 0;
      for (let row = 0; row < 128; row++) for (let col = 0; col < 128; col++) {
        const alpha = pixels[(row * 128 + col) * 4 + 3];
        if (alpha < 32) continue;
        x += (col + .5) * alpha;
        y += (row + .5) * alpha;
        weight += alpha;
      }
      if (!weight) return;
      artCenter = {
        x: x / weight * probe.naturalWidth / 128,
        y: y / weight * probe.naturalHeight / 128,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
      };
      alignGlow();
    } catch { /* The card center is the safe fallback for opaque CDN images. */ }
  };
  void locateArt();
  const resize = () => {
    if (!app || disposed) return;
    app.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight));
    app.requestRender();
    alignGlow();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const ready = (async () => {
    const { Application } = await import(new URL("./spline-runtime/spline-reference.js",document.baseURI).href);
    if (disposed) return;
    app = new Application(canvas, { renderMode: "manual" });
    await app.load("./upgrade-result/caser-upgrade-win.splinecode");
    if (disposed) {
      app.dispose();
      return;
    }
    // tintColor is the component input. The saved runtime exposes the actual
    // material/light setter as object.color, not an expando named tintColor.
    for (const object of app.getAllObjects()) object.color = color;
    canvas.dataset.tint = color;
    canvas.dataset.spline = "ready";
    resize();
    const render = () => {
      if (disposed) return;
      app.requestRender();
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
  })().catch((error) => {
    if (!disposed) {
      canvas.dataset.spline = "error";
      canvas.dataset.error = error.message;
      console.error("Upgrade win Spline:", error);
    }
  });
  return {
    ready,
    dispose() {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      app?.dispose();
      canvas.remove();
    },
  };
}
