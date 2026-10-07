import { card, price, image, escape, asset } from "../components/items.js";
import { referenceCard, names } from "../components/referenceCards.js";
import { rarityColor } from "../components/items.js";
import { openingAnimation, createRouletteStage } from "../animations/opening.js";
import { createCaseScene } from "../animations/caseScene.js";
export function caseDetail(app, c) {
  const el = app.content,
    by = (id) => el.querySelector(`[data-testid="${id}"]`);
  if (!c) {
    el.innerHTML =
      '<div class="demo-empty"><h1>Кейс недоступен</h1><a href="#/cases">Все кейсы →</a></div>';
    return;
  }
  document.body.classList.add("case-detail-page");
  el.querySelector("section.sr-only")?.remove();
  el.querySelectorAll("video").forEach((v) => v.remove());
  // Background video as on caser.one. Plays only if the file was saved
  // locally to CASER_DEMO/animation/case-bg-video.webm; otherwise the
  // saved poster image stays.
  const poster = el.querySelector('img[src*="case-bg-poster2"]');
  if (poster && !matchMedia('(max-width:600px)').matches) {
    const videoUrl = "./animation/case-bg-video.webm";
    fetch(videoUrl, { headers: { Range: "bytes=0-0" } })
      .then((r) => {
        if (!r.ok || !poster.isConnected) return;
        const video = document.createElement("video");
        video.className = "absolute inset-0 z-0 h-full w-full object-cover";
        video.src = videoUrl;
        video.poster = poster.getAttribute("src");
        video.muted = true;
        video.autoplay = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("aria-hidden", "true");
        video.addEventListener("error", () => video.remove(), { once: true });
        poster.after(video);
        video.play().catch(() => {});
      })
      .catch(() => {});
  }
  const inner = by("case-open-back-link").parentElement;
  [...inner.children]
    .find((n) =>
      n.className.includes(
        "pointer-events-none flex w-full shrink-0 justify-center",
      ),
    )
    ?.remove();

  by("case-open-insufficient-balance-banner")?.remove();
  by("case-open-back-link").href = "#/cases";
  const sound = by("case-open-sound-toggle");
  sound.disabled = false;
  sound.dataset.action = "audio";
  const dashboard = by("case-open-dashboard");
  by("case-open-case-title").textContent = c.title;
  const max = Math.min(
    6,
    c.max_opens_at_once || c.details?.case?.max_opens_at_once || 1,
  );
  const casePrices = new Map((c.details?.case?.prices || []).map(entry => [Number(entry.count), Number(entry.price)]));
  const options = Array.from({ length: max }, (_, i) => i + 1).filter(n => casePrices.size === 0 || casePrices.has(n));
  const priceForCount = n => casePrices.get(n) ?? Number(c.price) * n;
  let count = 1;
  const controls = dashboard.lastElementChild;
  controls.classList.add('case-opening-controls');
  controls.innerHTML = `<div class="case-count-control"><button type="button" data-testid="case-open-count-trigger" class="case-count-trigger" aria-expanded="false" aria-controls="case-count-menu"><span>ОТКРЫТЬ ЗА РАЗ</span><b id="case-count-value">${count}</b><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div id="case-count-menu" class="case-count-menu" hidden></div></div><button type="button" data-testid="case-open-speed-toggle" data-action="turbo" class="case-speed"><img src="${asset("bolt.svg")}" alt="Fast open"></button><button type="button" id="open-case" data-testid="case-open-button" class="case-open-primary">ОТКРЫТЬ ЗА <span id="open-price">${priceForCount(count).toFixed(0)}</span><img src="${asset("coin.svg")}" alt=""></button>`;
  const trigger = by("case-open-count-trigger"),
    menu = el.querySelector(".case-count-menu"),
    button = el.querySelector("#open-case");
  trigger.onclick = () => {
    if (app.store.busy) return;
    menu.hidden = !menu.hidden;
    trigger.setAttribute("aria-expanded", String(!menu.hidden));
  };
  menu.onclick = (event) => {
      const b = event.target.closest('[data-count]');
      if (!b || b.disabled) return;
      if (app.store.busy) return;
      count = Number(b.dataset.count);
      el.querySelector("#case-count-value").textContent = count;
      el.querySelector("#open-price").textContent = priceForCount(count).toFixed(0);
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
      update();
    };
  const closeCountMenu = () => {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };
  const outsideCountMenu = (event) => {
    if (!trigger.parentElement.contains(event.target)) closeCountMenu();
  };
  const countMenuKey = (event) => {
    if (event.key === 'Escape') closeCountMenu();
  };
  document.addEventListener('click', outsideCountMenu);
  document.addEventListener('keydown', countMenuKey);
  const originalGrid = by("case-open-items-grid-desktop"),
    template = originalGrid.firstElementChild.cloneNode(true);
  originalGrid.classList.add("case-contents-grid");
  originalGrid.replaceChildren(
    ...[...(c.details?.items || [])].sort((a, b) => Number(b.price) - Number(a.price) || String(a.marketName).localeCompare(String(b.marketName))).map((i) =>
      referenceCard(template, i, "inspect", false, "case"),
    ),
  );
  // Saved desktop and mobile grids duplicate the same contents.
  el.querySelectorAll('[data-testid="case-open-items-grid-mobile"]').forEach(
    (n) => n.remove(),
  );
  const hiddenGrid = originalGrid.parentElement;
  hiddenGrid.classList.remove("lg:hidden");
  if (c.time_limit || c.details?.case?.time_limit) {
    const panel = hiddenGrid.parentElement;
    panel.classList.add("case-limited-panel");
    const badge = document.createElement("div");
    badge.className = "case-limited-badge";
    const ends = Date.parse(c.time_limit || c.details.case.time_limit);
    const drawLimit = () => {
      const seconds = Math.max(0, Math.floor((ends - Date.now()) / 1000));
      badge.textContent = `LIMITED  ◷ ${Math.floor(seconds / 86400)}Д:${Math.floor(seconds / 3600) % 24}Ч:${Math.floor(seconds / 60) % 60}М`;
    };
    drawLimit();
    panel.prepend(badge);
    const interval = setInterval(drawLimit, 60000);
    app.cleanup.push(() => clearInterval(interval));
  }
  const spacer = [...inner.children].find(
    (n) => n.className === "relative w-full shrink-0",
  );
  spacer.style.height = "59.4rem";
  spacer.classList.add("case-hero-spacer");
  const insufficient = document.createElement("div");
  insufficient.className = "case-insufficient";
  insufficient.dataset.testid = "case-open-insufficient-balance-banner";
  insufficient.innerHTML = `<div class="case-insufficient-heading">НЕ ХВАТАЕТ <span></span><img src="${asset("coin.svg")}" alt=""></div><p>Недостаточно средств для открытия кейса</p><button type="button" data-testid="case-open-insufficient-balance-topup" data-action="deposit">ПОПОЛНИТЬ БАЛАНС ＋</button>`;
  spacer.append(insufficient);
  const savedCanvas =
    el.querySelector('canvas[width="1815"]') ||
    [...el.querySelectorAll("canvas")].find((n) =>
      n.style.transform.includes("translateY"),
    );
  const sceneHost = savedCanvas.parentElement;
  sceneHost.id = "case-spline";
  sceneHost.parentElement.classList.add('case-scene-frame');
  let sceneTarget=sceneHost;
  if (matchMedia('(max-width:600px)').matches) {
    sceneHost.parentElement.hidden=true;
    sceneTarget=document.createElement('div');sceneTarget.className='mobile-case-scene';spacer.prepend(sceneTarget);
  }
  const scene = createCaseScene(sceneTarget, c, (error) =>
    console.warn("Spline:", error.message),
  );
  // Original: Case_Drop_Impact one frame after the case page mounts.
  const impactFrame = requestAnimationFrame(() => app.audio.play("Drop_Impact"));
  // Replace the whole saved inactive layer, not just its invisible child.
  const savedStage = el.querySelector(
    "[data-testid=case-roulette-0]",
  ).parentElement;
  savedStage.parentElement.parentElement.remove();
  const stage = document.createElement("div");
  spacer.append(stage);
  stage.id = "opening-stage";
  const outerScroller = el.closest(".overflow-y-auto");
  const stageCtl = createRouletteStage(stage, { items: c.details?.items || [], scrollEl: outerScroller, spacer });
  let spacingFrame = 0;
  function reserveResultSpacing() {
    cancelAnimationFrame(spacingFrame);
    const settleUntil = performance.now() + 800;
    const measure = () => {
      if (insufficient.hidden || stage.hidden || stage.dataset.revealed !== 'true') {
        spacer.style.removeProperty('min-height');
        return;
      }
      const bottom = Math.max(stage.getBoundingClientRect().bottom,
        ...[...stage.querySelectorAll('.crv-opened-card, [data-sell-instance]')].map(n => n.getBoundingClientRect().bottom));
      const gap = 24;
      const bottomInset = parseFloat(getComputedStyle(insufficient).bottom) || 0;
      spacer.style.minHeight = Math.ceil(bottom - spacer.getBoundingClientRect().top + gap + insufficient.offsetHeight + bottomInset) + 'px';
      // The opened card scales in for 700 ms; follow its visual bounds too.
      if (performance.now() < settleUntil) spacingFrame = requestAnimationFrame(measure);
    };
    spacingFrame = requestAnimationFrame(measure);
  }
  const resultSpacingObserver = new ResizeObserver(reserveResultSpacing);
  resultSpacingObserver.observe(stage);
  resultSpacingObserver.observe(insufficient);
  const controller = new AbortController();
  let openingTrigger = 0;
  const results = document.createElement("div");
  results.id = "opening-result";
  dashboard.parentElement.after(results);
  let displayedWinners = [];
  const availableWinners = () => displayedWinners.filter((winner) => app.store.state.inventory.some((i) => i.instanceId === winner.instanceId));
  const sellLabel = (item) => `ОБМЕНЯТЬ НА ${price(item.price)}`;
  function syncSales() {
    const remaining = availableWinners();
    stage.querySelectorAll("[data-sell-instance]").forEach((b) => {
      const available = remaining.some((i) => i.instanceId === b.dataset.sellInstance);
      b.disabled = !available || app.store.busy;
      if (!available) b.innerHTML = "<span>ОБМЕНЯНО</span>";
    });
    const all = results.querySelector("#sell-results");
    if (all) {
      all.disabled = !remaining.length || app.store.busy;
      all.innerHTML = remaining.length ? `ОБМЕНЯТЬ ВСЕ НА ${price(remaining.reduce((sum, i) => sum + i.price, 0))} <img src="${asset("coin.svg")}" alt="">` : "ОБМЕНЯНО";
    }
  }
  function update() {
    if (!app.store.busy) {
      const available = options.filter(n => priceForCount(n) <= app.store.state.balance + 1e-7);
      count = Math.min(count, available.at(-1) || 1);
      el.querySelector('#case-count-value').textContent = count;
      trigger.parentElement.hidden = available.length <= 1;
      const signature = available.join(',');
      if (menu.dataset.options !== signature) {
        menu.dataset.options = signature;
        menu.innerHTML = available.map(n => `<button type="button" data-count="${n}" aria-label="Открыть ${n} кейсов">${n}</button>`).join('');
      }
      if (available.length <= 1) closeCountMenu();
    } else closeCountMenu();
    const missing = Math.max(0, priceForCount(count) - app.store.state.balance);
    // Keep the winnings visible while explaining why another opening is unavailable.
    insufficient.hidden = !missing || app.store.busy;
    reserveResultSpacing();
    insufficient.querySelector("span").textContent = Math.ceil(missing);
    button.disabled =
      app.store.busy || app.store.state.balance < priceForCount(count);
    button.innerHTML = app.store.busy
      ? '<span class="case-button-spinner"></span> ОТКРЫВАЕМ…'
      : `ОТКРЫТЬ ЗА <span id="open-price">${priceForCount(count).toFixed(0)}</span><img src="${asset("coin.svg")}" alt="">`;
    trigger.disabled = app.store.busy || missing > 0;
    by("case-open-speed-toggle").disabled = app.store.busy || missing > 0;
    menu
      .querySelectorAll("button")
      .forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(Number(b.dataset.count) === count),
        ),
      );
  }
  button.onclick = async () => {
    if (app.store.busy) return;
    try {
      app.setBalanceDeferred();
      const winners = app.store.open(c, count, app.dev.drop);
      const operation = ++openingTrigger;
      const reopen = displayedWinners.length > 0;
      const turbo = !!app.store.state.settings.turbo;
      stage.dataset.spinTrigger = String(operation);
      stage.dataset.speedMode = turbo ? "fast" : "normal";
      stage.dataset.phase = "intro";
      app.dev.drop = null;
      update();
      app.updateBalance();
      results.replaceChildren();
      displayedWinners = [];
      await openingAnimation({
        stageCtl,
        stage,
        c,
        winners,
        audio: app.audio,
        turbo,
        scene,
        reopen,
        signal: controller.signal,
        onReveal: () => {
          stage.dataset.phase = "result";
          displayedWinners = winners;
          stageCtl.reveal(winners, sellLabel);
        },
      });
      if (controller.signal.aborted || operation !== openingTrigger) return;
      stage.querySelectorAll("[data-sell-instance]").forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.sellInstance;
          if (app.store.busy || !availableWinners().some((i) => i.instanceId === id)) return;
          const sold = availableWinners().find((i) => i.instanceId === id);
          app.store.sell([id]);
          if (sold) app.toast(`Предмет обменен на ${Number(sold.price).toFixed(2)}`, "success");
          app.updateBalance();
          syncSales();
          update();
        };
      });
      results.innerHTML = '<button type="button" id="sell-results" data-testid="case-open-sell-all-button" class="case-sell-all"></button>';
      results.querySelector("#sell-results").onclick = () => {
        if (app.store.busy) return;
        const all = availableWinners();
        app.store.sell(all.map((i) => i.instanceId));
        if (all.length) app.toast(`Все предметы обменены на ${all.reduce((n, i) => n + Number(i.price), 0).toFixed(2)}`, "success");
        app.updateBalance();
        syncSales();
        update();
      };
    } catch (e) {
      if (!controller.signal.aborted) app.toast(e.message);
    } finally {
      if (!controller.signal.aborted) {
        app.store.busy = false;
        app.clearDeferredBalance();
        update();
        syncSales();
      }
    }
  };
  outerScroller?.scrollTo(0, 0);
  app.cleanup.push(() => {
    cancelAnimationFrame(spacingFrame);
    resultSpacingObserver.disconnect();
    document.removeEventListener('click', outsideCountMenu);
    document.removeEventListener('keydown', countMenuKey);
    controller.abort();
    cancelAnimationFrame(impactFrame);
    stageCtl.destroy();
    app.store.busy = false;
    scene.dispose();
    app.audio.stop();
    app.clearDeferredBalance();
    document.removeEventListener("demo-balance-updated", update);
    document.body.classList.remove("case-detail-page");
  });
  document.addEventListener("demo-balance-updated", update);
  update();
}
