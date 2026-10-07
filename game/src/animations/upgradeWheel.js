// Geometry/timing from the saved UpgradeSpinner (30ixr78ff2gad).
import { cubicBezier } from "./easing.js";
const easeOut = cubicBezier(0, 0, 0.58, 1);
let resultGradientId = 0;
export const circumference = 2 * Math.PI * 124.835;
export const displayedArc = (chance) =>
  chance >= 1 ? 1 : (Math.max(0, chance) / 0.99) * 0.95;
export function landingAngle(chance, success, random = Math.random) {
  const half = displayedArc(chance) * 180;
  const margin = Math.min(2, half / 4, (180 - half) / 4);
  if (success)
    return 180 - half + margin + random() * Math.max(0, 2 * (half - margin));
  // The complement crosses 0 degrees; use an unwrapped interval.
  return (
    (180 +
      half +
      margin +
      random() * Math.max(0, 360 - 2 * half - 2 * margin)) %
    360
  );
}
export function createWheel(wheel) {
  if (document.documentElement.dataset.startup !== 'ready') {
    wheel.classList.add('wheel-entering');
    wheel.addEventListener('animationend', () => wheel.classList.remove('wheel-entering'), { once: true });
  }
  for (const label of wheel.querySelectorAll('span')) {
    if (/^(100|50|0)%?$/.test(label.textContent.trim())) label.textContent = label.textContent.trim().replace('%', '') + '%';
  }
  const pointer = wheel.querySelector(
    'img[src*="spinner-arrow.webp"]',
  ).parentElement;
  pointer.classList.add("reference-wheel-pointer");
  const svg = wheel.querySelector('svg[viewBox="0 0 291.67 291.67"]');
  const circles = [...svg.querySelectorAll("g circle")];
  const colors = circles.filter(
    (c) => c.getAttribute("stroke") !== "url(#_r_g_)",
  );
  const group = svg.querySelector("g");
  // Original result sector has a 44px solid edge beneath its 42px gradient.
  const resultEdge = colors[0].cloneNode(true);
  resultEdge.setAttribute('stroke-width', '44');
  resultEdge.style.display = 'none';
  group.prepend(resultEdge);
  const resultLayer = document.createElement("div");
  resultLayer.className = "wheel-result-layer";
  resultLayer.hidden = true;
  wheel.append(resultLayer);
  const luckyBadge = document.createElement('div');
  luckyBadge.className = 'wheel-lucky-drop';
  luckyBadge.dataset.testid = 'upgrade-lucky-drop';
  luckyBadge.setAttribute('aria-label', 'Lucky Drop');
  const luckyImage = document.createElement('img');
  luckyImage.src = './images/game/spinner-mystery-badge.webp';
  luckyImage.alt = '';
  luckyImage.decoding = 'async';
  luckyBadge.append(luckyImage);
  const luckyImageReady = luckyImage.decode().catch(() => {});
  luckyBadge.hidden = true;
  wheel.append(luckyBadge);
  let luckyTimer = 0, disposed = false, finishLuckyAppearance = null, luckySession = 0;
  const ns = "http://www.w3.org/2000/svg",
    gradient = document.createElementNS(ns, "linearGradient");
  gradient.id = 'demo-wheel-result-gradient-' + (++resultGradientId);
  gradient.setAttribute("x1", "0%");
  gradient.setAttribute("y1", "0%");
  gradient.setAttribute("x2", "0%");
  gradient.setAttribute("y2", "100%");
  svg.querySelector("defs").append(gradient);
  let current = 50,
    frame = 0;
  function render(percent) {
    const amount = displayedArc(percent / 100) * circumference;
    for (const circle of [...circles, resultEdge]) {
      circle.setAttribute(
        "stroke-dasharray",
        `${amount} ${circumference - amount}`,
      );
      circle.setAttribute(
        "stroke-dashoffset",
        String(0.25 * circumference - (circumference - amount) / 2),
      );
    }
    wheel.querySelector(
      "[data-testid=upgrade-spinner-chance-value]",
    ).textContent = percent.toFixed(2) + "%";
    current = percent;
  }
  function set(chance, immediate = false) {
    luckySession++;
    clearTimeout(luckyTimer);
    finishLuckyAppearance?.();
    finishLuckyAppearance = null;
    luckyImage.getAnimations().forEach(animation => animation.cancel());
    luckyBadge.hidden = true;
    luckyBadge.classList.remove('lucky-drop-won');
    luckyBadge.setAttribute('aria-label', 'Lucky Drop');
    delete wheel.dataset.luckyDrop;
    cancelAnimationFrame(frame);
    delete wheel.dataset.outcome;
    resultLayer.hidden = true;
    resultEdge.style.display = 'none';
    for (const circle of colors) circle.setAttribute("stroke", "url(#_r_f_)");
    group.style.filter = "drop-shadow(0 0 15px rgba(255,168,0,.55))";
    const start = performance.now(),
      from = current,
      to = chance * 100;
    function tick(now) {
      const t = Math.min(1, (now - start) / 500);
      render(from + (to - from) * easeOut(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    if (immediate) render(to);
    else frame = requestAnimationFrame(tick);
    const label = wheel.querySelector(
      "[data-testid=upgrade-spinner-chance-label]",
    );
    label.textContent =
      to >= 80
        ? "Очень высокий шанс"
        : to >= 60
          ? "Высокий шанс"
          : to >= 40
            ? "Средний шанс"
            : to >= 20
              ? "Низкий шанс"
              : "Очень низкий шанс";
  }
  async function spin(outcome, turbo, audio) {
    set(outcome.chance, true);
    // The original lands a won Super Drop in the small golden sector at 0%.
    // Ordinary wins still land anywhere in the normal success arc.
    const luckyWon = outcome.success && outcome.luckyDrop?.activated === true;
    const end = luckyWon ? 180 : landingAngle(outcome.chance, outcome.success);
    const from = Number(pointer.dataset.angle || 180),
      duration = turbo ? 1500 : 7000;
    const final =
      from + (turbo ? 3 : 6) * 360 + ((end - (from % 360) + 360) % 360);
    pointer.dataset.landing = String(end);
    wheel.dataset.playing = "true";
    audio.stop("Upgrade_Wheel_Roll_Fast");
    audio.stop("Upgrade_Wheel_Roll_Slow");
    const animation = pointer.animate(
      [
        { transform: `rotate(${from}deg)` },
        { transform: `rotate(${final}deg)` },
      ],
      {
        duration,
        easing: turbo
          ? "cubic-bezier(.25,.1,.25,1)"
          : "cubic-bezier(.25,.1,.2,1)",
        fill: "forwards",
      },
    );
    // Original UpgradePage: one track per spin, started with the spin and
    // never switched: Upgrade_Wheel_Roll_Fast in fast mode, otherwise
    // Upgrade_Wheel_Roll_Slow (7.4 s, matches the 7 s spin). Both are stopped
    // when the result is shown.
    audio.play(turbo ? "Upgrade_Wheel_Roll_Fast" : "Upgrade_Wheel_Roll_Slow");
    let luckyAppearance = Promise.resolve();
    if (outcome.luckyDrop) {
      const session = luckySession;
      luckyAppearance = new Promise(resolve => {
        finishLuckyAppearance = resolve;
      luckyTimer = setTimeout(async () => {
        await luckyImageReady;
        if (disposed || session !== luckySession) return resolve();
        luckyBadge.hidden = false;
        wheel.dataset.luckyDrop = 'appeared';
        audio.play('LuckyDrop_Appear');
        // UpgradeSpinner's actual image, transform, glow and easing.
        const entrance = luckyImage.animate([
          { opacity: 0, transform: 'translateY(.55rem) scale(.76)', filter: 'brightness(1.1) blur(1px)' },
          { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'drop-shadow(0 0 .85rem rgba(250,210,60,.5)) drop-shadow(0 0 2.25rem rgba(245,180,40,.22))' },
        ], { duration: 1600, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
        entrance.finished.catch(() => {}).then(resolve);
      }, turbo ? 350 : 1200);
      });
    }
    try {
      await animation.finished;
      // A delayed timer must not award the bonus without revealing its badge.
      await luckyAppearance;
    } finally {
      clearTimeout(luckyTimer);
      audio.stop("Upgrade_Wheel_Roll_Fast");
      audio.stop("Upgrade_Wheel_Roll_Slow");
    }
    if (disposed) return;
    pointer.style.transform = `rotate(${end}deg)`;
    pointer.dataset.angle = String(end);
    animation.cancel();
    wheel.dataset.playing = "false";
    wheel.dataset.outcome = outcome.success ? "success" : "fail";
    const color = outcome.success ? "#44C987" : "#D55548";
    const stops = outcome.success
      ? ["#44C987", "#2A9B6B", "#0A2E1E"]
      : ["#D55548", "#D55548", "#2F110E"];
    gradient.replaceChildren(
      ...stops.map((color, index) => {
        const stop = document.createElementNS(ns, "stop");
        stop.setAttribute("offset", [0, 26, 100][index] + "%");
        stop.setAttribute("stop-color", color);
        return stop;
      }),
    );
    colors.forEach((c) =>
      c.setAttribute("stroke", `url(#${gradient.id})`),
    );
    resultEdge.setAttribute('stroke', color);
    resultEdge.style.display = '';
    group.style.filter = outcome.success
      ? 'drop-shadow(0 0 10.4px rgba(68, 201, 135, 0.45))'
      : 'drop-shadow(0 0 10.4px rgba(213, 85, 72, 0.45))';
    wheel.querySelector('[data-testid=upgrade-spinner-chance-value]').textContent = (outcome.chance * 100).toFixed(2) + '%';
    const state = outcome.success ? "win" : "loss";
    resultLayer.innerHTML = ["bg.svg", "pattern.webp", "vector.svg"]
      .map(
        (part, index) =>
          `<img class="wheel-result-${["bg", "pattern", "vector"][index]}" src="./upgrade-result/spinner-inner-${state}-${part}" alt="">`,
      )
      .join("");
    resultLayer.hidden = false;
    wheel.style.setProperty("--result-color", color);
    wheel.querySelector(
      "[data-testid=upgrade-spinner-chance-label]",
    ).textContent = outcome.success ? "ПОБЕДА" : "НЕУДАЧА";
    if (outcome.luckyDrop) {
      wheel.dataset.luckyDrop = luckyWon ? 'win' : 'miss';
      if (luckyWon) luckyBadge.setAttribute('aria-label', `Lucky Drop ×${outcome.luckyDrop.multiplier.toFixed(2)}`);
    }
    if (outcome.success) requestAnimationFrame(() => {
      if (!disposed) audio.play(luckyWon ? 'LuckyDrop_Win' : 'Upgrade_Win');
    });
  }
  return {
    set,
    spin,
    dispose() {
      disposed = true;
      luckySession++;
      clearTimeout(luckyTimer);
      finishLuckyAppearance?.();
      luckyImage.getAnimations().forEach(animation => animation.cancel());
      cancelAnimationFrame(frame);
      pointer.getAnimations().forEach((a) => a.cancel());
    },
  };
}
