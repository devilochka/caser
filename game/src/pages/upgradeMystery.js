// Mystery Mode of the Upgrade page, separate from the normal target upgrade.
// Restored from the original bundle: store fields (mysteryWinCardItem,
// mysterySplineAnimationPhase / UpgradeTick / IdleResync), the toggle flow,
// MIN/MAX bet, win-card timing, sounds and their order. The outcome itself is
// decided locally (services/demoMysteryEngine.js) because caser.one does it on
// its server.
import { config } from "../config.js";
import { escape } from "../components/items.js";
import { featuredStakeCard } from "../components/stakeCard.js";
import { createMysteryScene } from "../animations/mysteryScene.js";
import { createMysteryWheel, MYSTERY_ASSETS } from "../animations/mysteryWheel.js";
import { probe } from "../services/assetProbe.js";
import {
  readUpgradeMysteryModeFromStorage,
  writeUpgradeMysteryModeToStorage,
} from "../services/mysteryMode.js";

const SOUNDS = ["Mystery_Ambience_Loop", "Mystery_Upgrade_Process", "Mystery_Drop_Reveal", "Mystery_Drop_Rare", "LuckyDrop_Appear", "LuckyDrop_Win"];
const ICON_OFF = "./icons/upgrade/mysteryMode.webp";
const ICON_ON = "./icons/upgrade/mysteryModeActive.webp";

export function createMysteryMode(ctx) {
  const { app, el, by } = ctx;
  const state = {
    isMysteryModeEnabled: readUpgradeMysteryModeFromStorage(),
    isMysteryModeToggling: false,
    mysterySplineAnimationPhase: "idle",
    mysterySplineUpgradeTick: 0,
    mysterySplineIdleResync: 0,
    mysteryWinCardItem: null,
    // Snapshot of the round being animated: stake, IDs and the fixed result.
    round: null,
  };
  let scene = null,
    wheel = null,
    timer = 0,
    session = 0,
    disposed = false,
    cardBuilt = false,
    pendingHidden = null;
  const desired = by("upgrade-desired-card");
  const desiredClass = desired.className;
  const toggleButton = by("upgrade-fast-amounts-mystery-toggle");
  const toggleIcon = toggleButton.querySelector("img");
  const savedIcon = toggleIcon.getAttribute("src");
  const sliderRow = by("upgrade-add-balance-slider-desktop").closest(".grid");
  const shopBlock = by("upgrade-desired-block");
  const icons = { off: savedIcon, on: savedIcon };
  probe(ICON_OFF).then((ok) => ok && (icons.off = ICON_OFF) && paintToggle());
  probe(ICON_ON).then((ok) => ok && (icons.on = ICON_ON) && paintToggle());

  const stake = () => ctx.getSelected().reduce((sum, i) => sum + Number(i.price || 0), 0);
  const belowMin = () => ctx.getSelected().length > 0 && stake() < config.MIN_MYSTERY_BET_AMOUNT;
  const aboveMax = () => ctx.getSelected().length > 0 && stake() > config.MAX_MYSTERY_BET_AMOUNT;
  const canUpgrade = () =>
    state.isMysteryModeEnabled && !app.store.busy && !state.isMysteryModeToggling && ctx.getSelected().length > 0 && !belowMin() && !aboveMax();

  function stopSounds(all = true) {
    for (const name of SOUNDS) if (all || name !== "Mystery_Ambience_Loop") app.audio.stop(name);
  }
  function syncAmbience() {
    if (state.isMysteryModeEnabled && app.audio.enabled && !document.hidden && !disposed)
      app.audio.play("Mystery_Ambience_Loop", { loop: true, volume: 0.34, interrupt: false });
    else app.audio.stop("Mystery_Ambience_Loop");
  }
  function paintToggle() {
    toggleIcon.src = state.isMysteryModeEnabled ? icons.on : icons.off;
    toggleButton.classList.toggle("mystery-toggle-active", state.isMysteryModeEnabled);
    toggleButton.setAttribute("aria-pressed", String(state.isMysteryModeEnabled));
    toggleButton.setAttribute("aria-label", "Mystery mode");
    toggleButton.disabled = app.store.busy || state.isMysteryModeToggling;
    toggleButton.title = state.isMysteryModeEnabled ? "Mystery mode включён" : "Mystery mode";
    return true;
  }
  // Original Mystery FAQ dialog (eI in 2zojsxmap-p_n.js), same texts.
  function openFaq() {
    document.querySelector("#mystery-faq")?.remove();
    const dialog = document.createElement("dialog");
    dialog.id = "mystery-faq";
    dialog.dataset.testid = "upgrade-mystery-faq-modal";
    dialog.setAttribute("aria-label", "Mystery FAQ");
    dialog.className = "mystery-faq relative flex flex-col items-center border border-solid border-[#474747] bg-[#151515] p-0 shadow-[0_1rem_4rem_rgba(0,0,0,0.45)]";
    const row = (label, short, value) => `<div class="flex items-center justify-between px-[2rem] py-[1rem] border border-solid border-[#2C2C2C] lg:px-[1rem]"><span class="font-sofia-sans text-[1.6rem] font-[400] leading-[140%] text-white/80 [font-feature-settings:'ss01'_on]"><span class="lg:hidden">${label}</span><span class="hidden lg:inline">${short}</span></span><div class="flex items-center gap-[0.2rem]"><span class="font-oswald text-[2rem] font-[400] leading-[140%] text-white/80 lg:text-[1.6rem]">${value}</span><img src="${escape(ctx.coin)}" alt="" class="w-[2rem] h-[2rem] lg:w-[1.6rem] lg:h-[1.6rem]"></div></div>`;
    dialog.innerHTML = `<div class="flex items-start justify-between w-full p-[2rem] bg-[#272727]"><span class="font-oswald text-[2.2rem] font-[400] leading-[3.2rem] text-white uppercase [font-feature-settings:'ss01'_on] lg:text-[2rem]">MYSTERY MODE</span><button type="button" class="flex items-center justify-center w-[3.2rem] h-[3.2rem] cursor-pointer" data-testid="upgrade-mystery-faq-modal-close" aria-label="Закрыть"><img alt="" class="mystery-faq-x" hidden><svg class="mystery-faq-x-fallback" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg></button></div><div class="flex flex-col gap-[3rem] px-[4rem] py-[2rem] lg:px-[2rem]"><span class="font-sofia-sans text-[1.6rem] font-[400] leading-[140%] text-white/80 [font-feature-settings:'ss01'_on]">В этом режиме вы улучшаете свой предмет в случайный новый. Результат может оказаться как более ценным, так и дешевле исходного предмета. Вероятности и коэффициенты исхода динамические и не раскрываются заранее — каждый апгрейд полностью непредсказуем.</span><div class="flex flex-col w-full"><img class="mystery-faq-image w-full object-contain" alt="" hidden><div class="flex flex-col w-full">${row("Минимальная сумма участия", "Мин. сумма", "20")}${row("Максимальная сумма участия", "Макс. сумма", "300 000")}</div></div></div><div class="flex items-center justify-end w-full p-[2rem] bg-[#272727]"><button type="button" class="flex items-center justify-center px-[1.5rem] py-[0.8rem] cursor-pointer" data-testid="upgrade-mystery-faq-close"><span class="font-oswald text-[2.2rem] font-[400] leading-[3.2rem] text-white uppercase [font-feature-settings:'ss01'_on] lg:text-[1.6rem]">Закрыть</span></button></div>`;
    probe("./icons/general/closeIcon3.svg").then((ok) => {
      if (!ok) return;
      const img = dialog.querySelector(".mystery-faq-x");
      img.src = "./icons/general/closeIcon3.svg";
      img.hidden = false;
      dialog.querySelector(".mystery-faq-x-fallback").remove();
    });
    probe("./images/upgrade/modalMistery.webp").then((ok) => {
      const img = dialog.querySelector(".mystery-faq-image");
      if (ok) {
        img.src = "./images/upgrade/modalMistery.webp";
        img.hidden = false;
      } else img.remove();
    });
    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelectorAll("button").forEach((b) => (b.onclick = () => dialog.close()));
    dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());
    dialog.addEventListener("close", () => dialog.remove());
  }
  // Original desktop UpgradeDesiredCard, Mystery branch.
  function buildCard() {
    if (cardBuilt) return;
    cardBuilt = true;
    desired.className = "relative flex h-[47.6rem] w-full flex-col overflow-hidden rounded-[0.2rem] bg-[rgba(0,0,0,0.2)]";
    desired.dataset.mysteryCard = "";
    desired.innerHTML = `<div class="relative flex h-[5.6rem] w-full shrink-0 items-center justify-between overflow-hidden bg-[#153B2E] pl-[2rem] pr-0 gap-[2rem] mystery-card-header"><span class="font-sofia-sans text-[1.6rem] font-[400] leading-none text-[#44C987]">Вам может выпасть любой предмет</span><button type="button" class="ml-auto flex items-center justify-center px-[1.5rem] h-[5.6rem] bg-[rgba(68,201,135,0.1)] transition-colors hover:bg-[rgba(68,201,135,0.18)]" data-testid="upgrade-desired-card-mystery-faq-open"><span class="font-oswald text-[1.6rem] font-[400] leading-[100%] text-[#44C987]">FAQ</span></button></div><div class="relative h-[38rem] w-full shrink-0 overflow-hidden bg-[#153B2E] mystery-card-body"><div class="mystery-card-smoke pointer-events-none absolute inset-0 h-full w-full"></div><div class="mystery-spline-host absolute inset-0" data-testid="upgrade-mystery-spline"></div><div class="pointer-events-auto absolute inset-0 bg-[#44C987]/[0.01]"></div><div class="pointer-events-auto absolute inset-0 rounded-[inherit]" style="box-shadow:inset 0 0 1rem #44C987, inset 0 0 7rem #44C987"></div><div class="mystery-win-slot"></div></div>`;
    desired.querySelector("[data-testid=upgrade-desired-card-mystery-faq-open]").onclick = openFaq;
    const smoke = desired.querySelector(".mystery-card-smoke");
    probe(MYSTERY_ASSETS.smoke).then((ok) => {
      if (!ok || !desired.contains(smoke)) return smoke.classList.add("mystery-smoke-fallback");
      const video = document.createElement("video");
      Object.assign(video, { muted: true, loop: true, autoplay: true, playsInline: true, preload: "auto", disablePictureInPicture: true });
      video.className = "pointer-events-none absolute inset-0 h-full w-full object-cover mystery-smoke-mirror";
      video.src = MYSTERY_ASSETS.smoke;
      smoke.append(video);
      video.play().catch(() => {});
    });
    scene = createMysteryScene(desired.querySelector(".mystery-spline-host"));
  }
  function teardownCard() {
    if (!cardBuilt) return;
    cardBuilt = false;
    scene?.dispose();
    scene = null;
    desired.querySelectorAll("video").forEach((v) => {
      v.pause();
      v.removeAttribute("src");
      v.load();
    });
    desired.className = desiredClass;
    delete desired.dataset.mysteryCard;
    desired.innerHTML = ctx.desiredEmptyHtml;
  }
  function paintWinCard() {
    const slot = desired.querySelector(".mystery-win-slot");
    if (!slot) return;
    const item = state.mysteryWinCardItem;
    slot.innerHTML = item
      ? `<div class="pointer-events-auto absolute inset-0 z-[2] flex items-center justify-center w-full h-full" data-testid="upgrade-desired-mystery-win-card"><div class="relative h-full w-full min-h-0 origin-center animate-mystery-win-card-in will-change-[transform,opacity]">${featuredStakeCard(item, { plain: true })}</div></div>`
      : "";
  }
  function paintButton() {
    const button = ctx.spinButton,
      label = ctx.buttonLabel;
    const coin = `<img src="${escape(ctx.coin)}" alt="" class="size-[2.4rem] shrink-0 lg:size-[2rem]">`;
    if (belowMin() && !app.store.busy)
      label.innerHTML = `<span class="flex items-center gap-[0.5rem]" data-mystery-limit="min"><span class="font-[600] text-white/55">Минимальная ставка</span><span class="flex items-center gap-[0.2rem]"><span class="text-white">${config.MIN_MYSTERY_BET_AMOUNT}</span>${coin}</span></span>`;
    else if (aboveMax() && !app.store.busy)
      label.innerHTML = `<span class="flex items-center gap-[0.5rem]" data-mystery-limit="max"><span class="font-[600] text-white/55">Максимальная ставка</span><span class="flex items-center gap-[0.2rem]"><span class="text-white">${config.MAX_MYSTERY_BET_AMOUNT}</span>${coin}</span></span>`;
    else label.textContent = app.store.busy ? "АПГРЕЙД…" : "АПГРЕЙД";
    const enabled = canUpgrade();
    button.disabled = !enabled;
    button.classList.toggle("upgrade-operating", app.store.busy);
    button.classList.toggle("mystery-ready", enabled);
    button.dataset.mysteryReady = String(enabled);
  }
  function paintControls(on) {
    sliderRow.hidden = on;
    el.querySelectorAll("[data-testid*=turbo-toggle]").forEach((b) => (b.hidden = on));
    shopBlock.classList.toggle("mystery-shop-disabled", on);
    el.querySelectorAll('[data-testid^="upgrade-fast-amount-"]').forEach((b) => {
      if (on) {
        b.disabled = true;
        b.classList.remove("preset-selected");
      }
    });
    paintToggle();
  }
  function render() {
    if (!state.isMysteryModeEnabled) return;
    buildCard();
    paintWinCard();
    paintButton();
    paintControls(true);
    desired.dataset.phase = state.mysterySplineAnimationPhase;
  }
  // Original: after a result, changing the selection clears the win card and
  // resyncs the scene to idle.
  function onStakeChanged() {
    if (!state.isMysteryModeEnabled || app.store.busy) return;
    if (state.mysteryWinCardItem || state.mysterySplineAnimationPhase !== "idle") {
      state.mysteryWinCardItem = null;
      state.mysterySplineAnimationPhase = "idle";
      state.mysterySplineUpgradeTick = 0;
      state.mysterySplineIdleResync++;
      wheel?.clearResult();
      scene?.idle();
    }
  }
  function apply() {
    const on = state.isMysteryModeEnabled;
    wheel ??= createMysteryWheel(by("upgrade-spinner"));
    wheel.setEnabled(on);
    if (on) {
      buildCard();
      render();
    } else {
      teardownCard();
      paintControls(false);
      ctx.spinButton.classList.remove("mystery-ready");
    }
    syncAmbience();
  }
  function toggle() {
    if (app.store.busy || state.isMysteryModeToggling || disposed) return;
    state.isMysteryModeToggling = true;
    window.dispatchEvent(new CustomEvent("upgrade-mystery-mode-toggling", { detail: { toggling: true } }));
    paintToggle();
    try {
      const next = !state.isMysteryModeEnabled;
      writeUpgradeMysteryModeToStorage(next);
      state.isMysteryModeEnabled = next;
      state.mysteryWinCardItem = null;
      state.mysterySplineAnimationPhase = "idle";
      state.mysterySplineIdleResync++;
      state.mysterySplineUpgradeTick = 0;
      state.round = null;
      ctx.resetTarget();
      if (next) ctx.setAdded(0);
      else stopSounds();
      window.dispatchEvent(new CustomEvent("upgrade-mystery-mode-changed", { detail: { enabled: next } }));
    } finally {
      state.isMysteryModeToggling = false;
      window.dispatchEvent(new CustomEvent("upgrade-mystery-mode-toggling", { detail: { toggling: false } }));
    }
    apply();
    ctx.redraw();
  }
  async function run() {
    if (!canUpgrade()) return;
    app.setBalanceDeferred();
    const record = app.store.mysteryUpgrade(
      ctx.getSelected().map((i) => i.instanceId),
      app.items,
      app.dev.mystery || app.dev.upgrade,
    );
    app.dev.mystery = null;
    app.dev.upgrade = null;
    // The result is stored at once (reload-safe) but stays hidden until the
    // reveal so the inventory does not spoil it.
    app.hiddenInventoryIds.add(record.result.instanceId);
    pendingHidden = record.result.instanceId;
    const current = ++session;
    state.round = { sessionId: record.sessionId, stake: record.stake, ids: record.inputInstanceIds, result: record.result, success: record.success, rare: record.rare, multiplier: record.multiplier, startedAt: Date.now() };
    state.mysteryWinCardItem = null;
    state.mysterySplineAnimationPhase = "upgrade_reveal";
    state.mysterySplineUpgradeTick++;
    wheel.clearResult();
    paintWinCard();
    app.audio.stop("Mystery_Upgrade_Process");
    app.audio.play("Mystery_Upgrade_Process", { loop: true });
    scene?.reveal();
    ctx.redraw();
    const wait = config.MYSTERY_WIN_CARD_DELAY_MS + config.MYSTERY_WIN_CARD_POST_DELAY_MS + config.MYSTERY_WIN_CARD_REVEAL_EXTRA_MS;
    await new Promise((resolve) => (timer = setTimeout(resolve, wait)));
    timer = 0;
    if (disposed || current !== session) return;
    app.audio.stop("Mystery_Upgrade_Process");
    app.audio.play("Mystery_Drop_Reveal");
    app.audio.play("LuckyDrop_Appear");
    if (record.rare) app.audio.play("Mystery_Drop_Rare");
    if (record.success) requestAnimationFrame(() => app.audio.play("LuckyDrop_Win"));
    app.hiddenInventoryIds.delete(record.result.instanceId);
    pendingHidden = null;
    state.mysteryWinCardItem = record.result;
    state.mysterySplineAnimationPhase = "result";
    scene?.result();
    // Original: a Mystery round always ends with the win state ("Победа").
    wheel.showResult(true);
    ctx.setSelected([]);
    app.selectedInput = null;
    app.store.busy = false;
    app.clearDeferredBalance();
    ctx.afterRound();
  }
  const onVisibility = () => {
    if (document.hidden) stopSounds();
    syncAmbience();
  };
  document.addEventListener("visibilitychange", onVisibility);
  // Browsers block audio until the first user gesture; retry the ambience loop
  // on the gestures the original sound manager listens to.
  const unlock = () => syncAmbience();
  for (const type of ["click", "touchstart", "keydown"]) document.addEventListener(type, unlock, { passive: true });
  const previousToggle = app.audio.onToggle;
  app.audio.onToggle = () => syncAmbience();
  toggleButton.onclick = (e) => {
    e.stopPropagation();
    toggle();
  };
  return {
    get enabled() {
      return state.isMysteryModeEnabled;
    },
    get busy() {
      return app.store.busy && state.isMysteryModeEnabled;
    },
    state,
    init: apply,
    render,
    run,
    toggle,
    onStakeChanged,
    dispose() {
      disposed = true;
      session++;
      // Leaving mid-round: the round is complete, show the item everywhere.
      if (pendingHidden) app.hiddenInventoryIds.delete(pendingHidden);
      app.clearDeferredBalance();
      clearTimeout(timer);
      stopSounds();
      document.removeEventListener("visibilitychange", onVisibility);
      for (const type of ["click", "touchstart", "keydown"]) document.removeEventListener(type, unlock);
      app.audio.onToggle = previousToggle ?? null;
      scene?.dispose();
      wheel?.dispose();
    },
  };
}
