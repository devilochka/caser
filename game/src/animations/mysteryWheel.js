// Mystery look of the saved UpgradeSpinner, rebuilt from the original
// component (30ixr78ff2gad.js): dark inner disc with the smoke video,
// inner circle/glow, faded ring groups, green full arc and border, the
// mystery logo with "?" and, after the reveal, the win circle/blend/wave/grid
// layers with the result text. The normal wheel stays in the DOM; in Mystery
// it is hidden through [data-mystery=on] (see rework.css).
import { probe } from "../services/assetProbe.js";

export const MYSTERY_ASSETS = {
  logo: "./images/game/spinner-mystery-logo-new.svg",
  innerCircle: "./images/game/spinner-mystery-inner-circle.svg",
  innerGlow: "./images/game/spinner-mystery-inner-glow.svg",
  winCircle: "./images/game/spinner-mystery-win-circle.svg",
  winBlend: "./images/game/spinner-mystery-win-blend-new.webp",
  winWave: "./images/game/spinner-mystery-win-wave.webp",
  winGrid: "./images/game/spinner-mystery-win-grid.svg",
  smoke: "./video/mystery-smoke.webm",
};
// Local stand-ins (already in the project) while the originals are missing.
const FALLBACK = {
  winCircle: "./upgrade-result/spinner-inner-win-bg.svg",
  winWave: "./upgrade-result/spinner-inner-win-pattern.webp",
  winGrid: "./upgrade-result/spinner-inner-win-vector.svg",
};
const POS_INNER =
  "absolute z-[2] overflow-hidden rounded-full border border-black/5 left-[7.775rem] top-[7.775rem] h-[19.451rem] w-[19.451rem] md:left-[8.779rem] md:top-[8.779rem] md:h-[22.444rem] md:w-[22.444rem]";
const POS_RING =
  "absolute left-[2.917rem] top-[2.917rem] z-[7] h-[29.167rem] w-[29.167rem] overflow-hidden rounded-full md:left-[3.333rem] md:top-[3.333rem] md:h-[33.333rem] md:w-[33.333rem]";

function tagRoles(spinner) {
  const kids = [...spinner.children];
  const imgBy = (part) => kids.find((n) => n.tagName === "IMG" && n.getAttribute("src")?.includes(part));
  const roles = {
    outer: kids[0],
    inner: kids[1],
    group2: imgBy("spinner-group-2"),
    group1: imgBy("spinner-group-1"),
    ring: kids.find((n) => n.tagName === "DIV" && n.className.includes("z-[5]")),
    arcs: kids.find((n) => n.querySelector?.('svg[viewBox="0 0 291.67 291.67"]')),
    insetRing: kids.find((n) => n.tagName === "DIV" && n.className.includes("pointer-events-none") && n.className.includes("z-[7]")),
    group3: imgBy("spinner-group-3"),
    logo: imgBy("upgrade-logo") || kids.find((n) => n.tagName === "IMG" && n.className.includes("z-[9]")),
    pointer: kids.find((n) => n.querySelector?.('img[src*="spinner-arrow"]')),
    chance: spinner.querySelector("[data-testid=upgrade-spinner-chance-value]")?.parentElement,
  };
  for (const [role, node] of Object.entries(roles)) if (node) node.dataset.wheelRole = role;
  kids.filter((n) => n.tagName === "SPAN" && /^(100|50|0)%$/.test(n.textContent.trim())).forEach((n) => (n.dataset.wheelRole = "label"));
  return roles;
}

export function createMysteryWheel(spinner) {
  tagRoles(spinner);
  const layer = document.createElement("div");
  layer.className = "mystery-wheel-layer";
  layer.dataset.mysteryEl = "";
  layer.innerHTML = `
    <div class="${POS_INNER} mystery-inner" data-testid="upgrade-spinner-mystery-inner">
      <div class="mystery-smoke-slot absolute inset-0 z-0 rounded-full"></div>
      <div class="mystery-idle-layers absolute inset-0"><img alt="" class="absolute inset-0 h-full w-full" data-asset="innerCircle"><img alt="" class="absolute inset-0 h-full w-full" data-asset="innerGlow"></div>
      <div class="mystery-win-layers absolute inset-0" hidden><img alt="" class="absolute inset-0 h-full w-full" data-asset="winCircle"><img alt="" class="absolute inset-0 h-full w-full mix-blend-screen opacity-50" data-asset="winBlend"><img alt="" class="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 object-cover" data-asset="winWave"><img alt="" class="absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 object-contain" data-asset="winGrid"></div>
      <div class="mystery-loss-layers absolute inset-0" hidden><img alt="" class="absolute inset-0 h-full w-full" src="./upgrade-result/spinner-inner-loss-bg.svg"><img alt="" class="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 object-cover" src="./upgrade-result/spinner-inner-loss-pattern.webp"><img alt="" class="absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 object-contain" src="./upgrade-result/spinner-inner-loss-vector.svg"></div>
    </div>
    <div class="${POS_RING}"><svg class="h-full w-full" viewBox="0 0 291.67 291.67" aria-hidden="true"><defs><linearGradient id="mystery-arc-gradient" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stop-color="#13452C"></stop><stop offset="74%" stop-color="#44C987"></stop><stop offset="100%" stop-color="#44C987"></stop></linearGradient></defs><g style="filter: drop-shadow(0 0 10.4px rgba(68, 201, 135, 0.45))"><circle cx="145.835" cy="145.835" r="124.835" fill="none" stroke="#44C987" stroke-width="44"></circle><circle cx="145.835" cy="145.835" r="124.835" fill="none" stroke="url(#mystery-arc-gradient)" stroke-width="42"></circle></g></svg></div>
    <img alt="" data-asset="logo" class="mystery-logo pointer-events-none absolute left-1/2 top-1/2 z-[9] h-[18.649rem] w-[18.649rem] -translate-x-1/2 -translate-y-1/2 -scale-y-100 rotate-180 object-contain md:h-[21.313rem] md:w-[21.313rem]">
    <span class="mystery-question pointer-events-none absolute left-1/2 top-[3.6rem] z-[10] -translate-x-1/2 text-center font-sofia-sans text-[3rem] font-[700] leading-none text-[#349F6A] md:top-[4.4rem] md:text-[3.4rem]">?</span>
    <div class="mystery-result absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[13] flex w-[12rem] flex-col items-center text-center md:w-[13.8rem]" hidden><span class="text-[3.5rem] font-bold leading-none uppercase tracking-[0.125rem] md:text-[4rem]" data-testid="upgrade-spinner-mystery-result"></span></div>`;
  spinner.append(layer);
  const smokeSlot = layer.querySelector(".mystery-smoke-slot");
  let video = null;
  const ready = Promise.all(
    [...layer.querySelectorAll("[data-asset]")].map(async (img) => {
      const key = img.dataset.asset;
      const ok = await probe(MYSTERY_ASSETS[key]);
      if (ok) img.src = MYSTERY_ASSETS[key];
      else if (FALLBACK[key]) img.src = FALLBACK[key];
      else img.remove();
      img.dataset.source = ok ? "original" : FALLBACK[key] ? "fallback" : "none";
    }),
  ).then(async () => {
    if (await probe(MYSTERY_ASSETS.smoke)) {
      video = document.createElement("video");
      Object.assign(video, { muted: true, loop: true, autoplay: true, playsInline: true, preload: "auto", disablePictureInPicture: true });
      video.className = "pointer-events-none absolute inset-0 h-full w-full object-cover z-0 rounded-full";
      video.setAttribute("aria-hidden", "true");
      video.src = MYSTERY_ASSETS.smoke;
      smokeSlot.append(video);
      if (spinner.dataset.mystery === "on") video.play().catch(() => {});
    } else smokeSlot.classList.add("mystery-smoke-fallback");
  });
  const result = layer.querySelector(".mystery-result");
  return {
    ready,
    setEnabled(on) {
      spinner.dataset.mystery = on ? "on" : "off";
      if (video) on ? video.play().catch(() => {}) : video.pause();
      if (!on) this.clearResult();
    },
    showResult(success) {
      spinner.dataset.mysteryResult = success ? "win" : "loss";
      layer.querySelector(".mystery-idle-layers").hidden = true;
      // A cheaper result reuses the original red loss layers of the wheel.
      layer.querySelector(".mystery-win-layers").hidden = !success;
      layer.querySelector(".mystery-loss-layers").hidden = success;
      layer.querySelector(".mystery-logo")?.setAttribute("hidden", "");
      layer.querySelector(".mystery-question").hidden = true;
      const text = result.firstElementChild;
      text.textContent = success ? "Победа" : "Неудача";
      text.style.color = success ? "#44C987" : "#D55548";
      text.style.textShadow = success
        ? "0 0 2.715px #44C987, 0 0 19.006px rgba(68,201,135,0.5), 0 0 32.582px rgba(68,201,135,0.5), 0 0 57.018px rgba(68,201,135,0.5)"
        : "0 0 19.006px rgba(213,85,72,0.5), 0 0 32.582px rgba(213,85,72,0.5), 0 0 57.018px rgba(213,85,72,0.5)";
      result.hidden = false;
    },
    clearResult() {
      delete spinner.dataset.mysteryResult;
      layer.querySelector(".mystery-idle-layers").hidden = false;
      layer.querySelector(".mystery-win-layers").hidden = true;
      layer.querySelector(".mystery-loss-layers").hidden = true;
      layer.querySelector(".mystery-logo")?.removeAttribute("hidden");
      layer.querySelector(".mystery-question").hidden = false;
      result.hidden = true;
    },
    dispose() {
      video?.pause();
      video?.removeAttribute("src");
      video?.load();
      layer.remove();
      delete spinner.dataset.mystery;
    },
  };
}
