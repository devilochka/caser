import { sortItems, price } from "../components/items.js";
import { referenceCard, featuredCard } from "../components/referenceCards.js";
import {
  demoUpgradeFormula,
  maxAddedBalance,
} from "../services/demoUpgradeFormula.js";
import { createWheel } from "../animations/upgradeWheel.js";
import { createUpgradeWinScene } from "../animations/upgradeWinScene.js";
import { asset, rarityColor } from "../components/items.js";
import { renderStakeCard } from "../components/stakeCard.js";
import { createMysteryMode } from "./upgradeMystery.js";
import { config } from "../config.js";
import { arrangeUpgradeLayout } from "../components/upgradeLayout.js";
export function upgrade(app) {
  let winScene = null,
    wonTarget = null,
    disposed = false,
    mystery = null;
  const el = app.content,
    by = (id) => el.querySelector(`[data-testid="${id}"]`);
  let selectedInputs = app.store.state.inventory.filter(
      (i) => i.instanceId === app.selectedInput,
    ),
    target = null,
    added = 0,
    page = 0,
    inputPage = 0,
    inventorySort = "new",
    mode = "price",
    descending = false,
    timer,
    presetTimer,
    presetPending = false;
  let catalogChance = 0.5, lastCatalogStake = NaN;
  const stakeItems = () => selectedInputs.map((item) => item.instanceId);
  const stakeValue = () =>
    selectedInputs.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const shop = by("upgrade-shop-items-list-shop"),
    template = shop.firstElementChild.cloneNode(true);
  const user = by("upgrade-user-block");
  const userContent =
    user
      .querySelector("[data-testid=upgrade-inventory-empty-open-case]")
      ?.closest("div.flex-1") || user.lastElementChild;
  // Original empty inventory state of the user block ("Ваш инвентарь пуст").
  const emptyInventory = user
    .querySelector("[data-testid=upgrade-inventory-empty-open-case]")
    ?.closest('[class*="min-h-[33.733rem]"]');
  const emptyInventoryHTML = emptyInventory?.outerHTML || "";
  userContent.className = "min-h-0 flex-1 overflow-auto";
  userContent.innerHTML =
    '<div id="upgrade-input-grid" class="grid w-full grid-cols-4 gap-[1rem] px-[2rem] py-[1rem]"></div><div id="upgrade-input-pages" class="reference-pagination"></div>';
  const grid = el.querySelector("#upgrade-input-grid"),
    pagination = by("upgrade-pagination");
  const wheel = createWheel(by("upgrade-spinner"));
  const spinButton = by("upgrade-spin-panel-upgrade-button");
  // The saved button stores its label in a nested span. Removing only direct
  // text nodes left that original label beside our state label ("АпгрейдАПГРЕЙД").
  spinButton.querySelectorAll("span").forEach((node) => node.remove());
  const buttonLabel = document.createElement("span");
  buttonLabel.className =
    "upgrade-button-label relative z-[2] flex items-center justify-center gap-[1rem]";
  spinButton.append(buttonLabel);
  for (const token of [...by("upgrade-spin-panel-upgrade-button").classList]) {
    if (/^!bg-|^!shadow-|^!text-\[rgba|^!border-\[rgba/.test(token))
      by("upgrade-spin-panel-upgrade-button").classList.remove(token);
  }
  const cards = {};
  for (const id of ["upgrade-user-items-card", "upgrade-desired-card"])
    cards[id] = by(id).innerHTML;
  const slider = by("upgrade-add-balance-slider-desktop");
  const header = by("upgrade-desired-block").querySelector("header");
  const priceLabel = by("upgrade-desired-block-sort").nextElementSibling;
  priceLabel.innerHTML =
    '<span id="target-sort" class="upgrade-price-label">Цена</span>';
  const search = document.createElement("input");
  search.id = "target-search";
  search.placeholder = "Поиск по названию";
  search.setAttribute("aria-label", "Поиск по названию");
  search.className = "reference-search";
  search.hidden = true;
  header.after(search);
  by("upgrade-desired-block-search-toggle").onclick = () => {
    if (app.store.busy) return;
    search.hidden = !search.hidden;
    if (!search.hidden) search.focus();
  };
  function showInlineError(message) {
    spinButton.parentElement.style.position = "relative";
    let node = el.querySelector(".upgrade-inline-error");
    if (!node) {
      node = document.createElement("div");
      node.className = "upgrade-inline-error";
      spinButton.parentElement.append(node);
    }
    node.textContent = message;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.remove(), 3500);
  }
  function cancelPreset() {
    clearTimeout(presetTimer);
    presetPending = false;
    shop.classList.remove('catalog-pending');
  }
  function clearStake() {
    cancelPreset();
    selectedInputs = [];
    added = 0;
    wonTarget = null;
    app.selectedInput = null;
    mystery?.onStakeChanged();
    drawUser();
    drawShop();
    showSelections();
  }
  function removeFromStake(instanceId) {
    cancelPreset();
    selectedInputs = selectedInputs.filter(
      (entry) => entry.instanceId !== instanceId,
    );
    if (!selectedInputs.length) added = 0;
    if (app.selectedInput === instanceId) app.selectedInput = null;
    wonTarget = null;
    mystery?.onStakeChanged();
    drawUser();
    drawShop();
    showSelections();
  }
  function showCard(id, item, isInput) {
    const node = by(id);
    if (isInput) {
      node.innerHTML = cards[id];
      renderStakeCard(node, {
        items: selectedInputs,
        added,
        busy: app.store.busy,
        emptyHtml: cards[id],
        onClear: clearStake,
        onRemove: removeFromStake,
      });
      return;
    }
    node.innerHTML = cards[id];
    const items = isInput ? selectedInputs : item ? [item] : [];
    if (!items.length) return;
    const content = node.children[1],
      heading = content.firstElementChild,
      region = content.lastElementChild;
    heading.classList.add("reference-featured-header");
    heading.querySelector("span").textContent = isInput
      ? `${items.length} предмет${items.length === 1 ? "" : items.length < 5 ? "а" : "ов"} · ${price(stakeValue() + added)}`
      : "Предмет для апгрейда";
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "reference-clear";
    clear.textContent = "ОЧИСТИТЬ";
    clear.dataset.testid = isInput
      ? "upgrade-user-items-card-clear"
      : "upgrade-desired-card-clear";
    clear.disabled = app.store.busy;
    clear.onclick = () => {
      if (app.store.busy) return;
      if (isInput) {
        selectedInputs = [];
        added = 0;
        wonTarget = null;
      } else {
        target = null;
        added = 0;
        wonTarget = null;
      }
      drawUser();
      drawShop();
      showSelections();
    };
    heading.append(clear);
    region.className = "reference-featured-region";
    // A single stake uses the original full-size featured card. The compact
    // grid is reserved for a real multi-item stake (or for the balance tile
    // that accompanies a non-zero added balance).
    if (!isInput) {
      region.innerHTML = featuredCard(items[0]);
      return;
    }
    if (items.length === 1 && added <= 0) {
      region.innerHTML = `<div class="selected-stake-single" data-stake-instance="${items[0].instanceId}">${featuredCard(items[0])}</div>`;
      return;
    }
    const visualCount = items.length + (isInput && added > 0 ? 1 : 0);
    const balanceTile =
      isInput && added > 0
        ? `<div class="selected-stake-item selected-balance-item" data-stake-balance="${added}"><div class="selected-balance-card"><span>Баланс</span><strong>${price(added)} <img src="${asset("coin.svg")}" alt=""></strong></div></div>`
        : "";
    region.innerHTML = `<div class="selected-stake-grid" data-selected-count="${visualCount}">${items.map((entry) => `<div class="selected-stake-item" data-stake-instance="${entry.instanceId}">${featuredCard(entry)}</div>`).join("")}${balanceTile}</div>`;
  }
  function showSelections(keepResult = false) {
    syncInteractionState();
    winScene?.dispose();
    winScene = null;
    if (!keepResult) wonTarget = null;
    if (!app.store.busy)
      added = Math.min(
        added,
        maxAddedBalance(selectedInputs, target, app.store.state.balance),
      );
    if (mystery?.enabled) {
      added = 0;
      showCard("upgrade-user-items-card", selectedInputs[0], true);
      mystery.render();
      return;
    }
    showCard("upgrade-user-items-card", selectedInputs[0], true);
    showCard("upgrade-desired-card", target || wonTarget, false);
    if (wonTarget && (target || wonTarget))
      winScene = createUpgradeWinScene(
        by("upgrade-desired-card").querySelector(".reference-featured"),
        rarityColor(wonTarget),
      );
    const f = demoUpgradeFormula(selectedInputs, target, added);
    if (!keepResult) wheel.set(f.valid ? f.chance : 0);
    const spinner = by("upgrade-spinner");
    spinner.dataset.multiplier = String(f.multiplier);
    spinner.title = f.valid
      ? "Множитель: x" + f.multiplier.toFixed(2)
      : "Выберите предмет и цель";
    by("upgrade-spin-panel-upgrade-button").disabled =
      !f.valid || app.store.busy || presetPending;
    buttonLabel.textContent = app.store.busy ? "АПГРЕЙД…" : "АПГРЕЙД";
    spinButton.classList.toggle("upgrade-operating", app.store.busy);
    if (app.store.busy) {
      spinButton.style.setProperty("background", "#4B4B4F", "important");
      spinButton.style.setProperty(
        "border-color",
        "rgba(255,255,255,.15)",
        "important",
      );
      spinButton.style.setProperty(
        "color",
        "rgba(255,255,255,.4)",
        "important",
      );
      spinButton.style.setProperty(
        "box-shadow",
        "inset 0 0 1.66rem rgba(125,125,125,.45)",
        "important",
      );
    } else {
      for (const property of [
        "background",
        "border-color",
        "color",
        "box-shadow",
      ])
        spinButton.style.removeProperty(property);
    }
    const max = maxAddedBalance(
      selectedInputs,
      target,
      app.store.state.balance,
    );
    slider.max = String(max);
    slider.value = String(added);
    slider.disabled =
      app.store.busy || !selectedInputs.length || !target || max <= 0;
    slider.style.setProperty(
      "--range-progress",
      max ? (added / max) * 100 + "%" : "0%",
    );
    slider.previousElementSibling.querySelector("span").textContent =
      price(added);
    slider.parentElement.nextElementSibling.querySelector(
      ":scope > div > span",
    ).textContent = price(max);
    el.querySelectorAll('[data-testid^="upgrade-fast-amount-"]').forEach(
      (b) => (b.disabled = app.store.busy || !selectedInputs.length),
    );
    el.querySelectorAll('[data-action="turbo"]').forEach(
      (b) => (b.disabled = app.store.busy),
    );
  }
  function wireCards(container, choose) {
    container.querySelectorAll(".reference-item").forEach((node) => {
      node.onclick = () => {
        if (!app.store.busy) choose(node.dataset.id);
      };
      node.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          node.click();
        }
      };
    });
  }
  function syncInteractionState() {
    const busy = app.store.busy;
    for (const node of el.querySelectorAll('#upgrade-input-grid .reference-item, [data-testid="upgrade-shop-items-list-shop"] .reference-item')) {
      node.classList.toggle('upgrade-item-locked', busy);
      node.setAttribute('aria-disabled', String(busy));
      node.tabIndex = busy ? -1 : 0;
    }
    for (const control of el.querySelectorAll('#upgrade-input-pages button, [data-testid="upgrade-pagination"] button')) {
      control.disabled = busy || control.dataset.boundary === 'true';
    }
    for (const control of [search, el.querySelector('#target-sort'), by('upgrade-desired-block-price-from'), by('upgrade-desired-block-price-to'), by('upgrade-desired-block-sort'), by('upgrade-user-block-sort'), by('upgrade-desired-block-search-toggle')]) {
      control.disabled = busy;
    }
  }
  function pages(node, current, total, change, count) {
    node.classList.add('upgrade-page-arrows');
    node.setAttribute('aria-label', `Страница ${current + 1} из ${total}`);
    node.innerHTML = `<button type="button" data-page="prev" data-boundary="${!current}" ${!current ? "disabled" : ""} aria-label="Предыдущая страница"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><button type="button" data-page="next" data-boundary="${current + 1 >= total}" ${current + 1 >= total ? "disabled" : ""} aria-label="Следующая страница"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>`;
    node.querySelector("[data-page=prev]").onclick = () => {
      if (!app.store.busy) change(current - 1);
    };
    node.querySelector("[data-page=next]").onclick = () => {
      if (!app.store.busy) change(current + 1);
    };
  }
  function drawUser() {
    const list = sortItems(
        app.store.state.inventory.filter(
          (i) => !app.hiddenInventoryIds?.has(i.instanceId),
        ),
        inventorySort,
      ),
      pageSize = 16,
      total = Math.max(1, Math.ceil(list.length / pageSize));
    inputPage = Math.min(inputPage, total - 1);
    grid.replaceChildren(
      ...list
        .slice(inputPage * pageSize, inputPage * pageSize + pageSize)
        .map((i) =>
          referenceCard(
            template,
            i,
            "choose-input",
            selectedInputs.some((entry) => entry.instanceId === i.instanceId),
          ),
        ),
    );
    grid.classList.toggle("upgrade-input-grid-empty", !list.length);
    if (!list.length) {
      grid.innerHTML =
        emptyInventoryHTML ||
        '<div class="demo-empty">Ваш инвентарь пуст<br><a href="#/cases">Открыть кейс</a></div>';
      grid.querySelectorAll("a").forEach((a) => (a.href = "#/cases"));
      grid.querySelectorAll("[data-testid=upgrade-inventory-empty-open-case]").forEach(
        (b) => (b.onclick = () => (location.hash = "#/cases")),
      );
    }
    wireCards(grid, (id) => {
      const item = app.store.state.inventory.find((i) => i.instanceId === id);
      if (!item || app.store.busy) return;
      cancelPreset();
      wonTarget = null;
      const exists = selectedInputs.some((entry) => entry.instanceId === id);
      if (exists)
        selectedInputs = selectedInputs.filter(
          (entry) => entry.instanceId !== id,
        );
      else {
        const maxSelectable = added > 0 ? 5 : 6;
        if (selectedInputs.length >= maxSelectable) {
          showInlineError(
            `Можно выбрать не более ${maxSelectable} предметов${added > 0 ? " с добавленным балансом" : ""}.`,
          );
          return;
        }
        selectedInputs = [...selectedInputs, item];
      }
      if (selectedInputs.length >= 6) added = 0;
      if (exists && app.selectedInput === id) app.selectedInput = null;
      mystery?.onStakeChanged();
      page = 0;
      drawUser();
      drawShop();
      showSelections();
    });
    const p = el.querySelector("#upgrade-input-pages");
    p.hidden = total <= 1;
    if (total > 1)
      pages(p, inputPage, total, (n) => {
        inputPage = n;
        drawUser();
      });
    syncInteractionState();
  }
  function suggestCatalogRange() {
    const stake = stakeValue() + added;
    lastCatalogStake = stake;
    by("upgrade-desired-block-price-from").value = selectedInputs.length
      ? (stake * config.UPGRADE_HOUSE_FACTOR / catalogChance).toFixed(2)
      : "";
    by("upgrade-desired-block-price-to").value = "";
    mode = "price";
    descending = false;
    page = 0;
  }
  function drawShop({ selectFirst = false } = {}) {
    if (!mystery?.enabled && lastCatalogStake !== stakeValue() + added) suggestCatalogRange();
    const from =
        Number(
          by("upgrade-desired-block-price-from").value.replace(",", "."),
        ) || 0,
      to =
        Number(by("upgrade-desired-block-price-to").value.replace(",", ".")) ||
        Infinity,
      q = search.value.toLowerCase().trim();
    const list = app.items.filter(
      (i) =>
        i.price > stakeValue() + added &&
        (!selectedInputs.length || demoUpgradeFormula(selectedInputs, i, added).valid) &&
        i.price >= from &&
        i.price <= to &&
        i.marketName.toLowerCase().includes(q),
    );
    list.sort((a, b) => {
      const n =
        mode === "name"
          ? a.marketName.localeCompare(b.marketName)
          : mode === "rarity"
            ? Number(a.rarity) - Number(b.rarity)
            : a.price - b.price;
      return (
        (descending ? -n : n) ||
        String(a.id).localeCompare(String(b.id), "en", { numeric: true })
      );
    });
    const total = Math.max(1, Math.ceil(list.length / 16));
    page = Math.min(page, total - 1);
    if (selectFirst) target = list[0] || null;
    shop.replaceChildren(
      ...list
        .slice(page * 16, page * 16 + 16)
        .map((i) =>
          referenceCard(template, i, "choose-target", i.id === target?.id),
        ),
    );
    if (!list.length)
      shop.innerHTML = '<div class="demo-empty">Предметы не найдены</div>';
    wireCards(shop, (id) => {
      if (mystery?.enabled) return;
      cancelPreset();
      target = app.items.find((i) => i.id === id);
      wonTarget = null;
      showSelections();
      drawShop();
    });
    pages(
      pagination,
      page,
      total,
      (n) => {
        page = n;
        drawShop();
      },
      list.length,
    );
    syncInteractionState();
  }
  for (const field of [
    search,
    by("upgrade-desired-block-price-from"),
    by("upgrade-desired-block-price-to"),
  ])
    field.oninput = () => {
      if (app.store.busy) return;
      cancelPreset();
      clearTimeout(timer);
      timer = setTimeout(() => {
        page = 0;
        drawShop();
      }, 180);
    };
  by("upgrade-desired-block-sort").onclick = () => {
    if (app.store.busy) return;
    cancelPreset();
    descending = !descending;
    by("upgrade-desired-block-sort").querySelector("img").style.transform =
      descending ? "rotate(0deg)" : "rotate(180deg)";
    page = 0;
    drawShop();
  };
  by("upgrade-user-block-sort").onclick = () => {
    if (app.store.busy) return;
    inventorySort = inventorySort === "desc" ? "asc" : "desc";
    inputPage = 0;
    drawUser();
  };
  for (const preset of ["x2", "x5", "x10", "30%", "50%", "75%"])
    by("upgrade-fast-amount-" + preset).onclick = () => {
      if (app.store.busy || mystery?.enabled) return;
      if (!selectedInputs.length) {
        if (wonTarget) showSelections();
        return;
      }
      cancelPreset();
      target = null;
      presetPending = true;
      showSelections();
      catalogChance = preset.endsWith("%")
        ? Number.parseFloat(preset) / 100
        : config.UPGRADE_HOUSE_FACTOR / Number(preset.slice(1));
      suggestCatalogRange();
      shop.classList.add('catalog-pending');
      el.querySelectorAll('[data-testid^="upgrade-fast-amount-"]').forEach(
        (b) =>
          b.classList.toggle(
            "preset-selected",
            b.dataset.testid.endsWith(preset),
          ),
      );
      presetTimer = setTimeout(() => {
        if (disposed || !presetPending) return;
        cancelPreset();
        drawShop({ selectFirst: true });
        showSelections();
      }, 480 + Math.round(Math.random() * 420));
    };
  slider.oninput = () => {
    cancelPreset();
    if (app.store.busy || mystery?.enabled) {
      slider.value = "0";
      return;
    }
    added = Math.round(Number(slider.value) * 100) / 100;
    showSelections();
    drawShop();
  };
  el.querySelectorAll("[data-testid*=sound-toggle]").forEach(
    (b) => (b.dataset.action = "audio"),
  );
  el.querySelectorAll("[data-testid*=turbo-toggle]").forEach(
    (b) => (b.dataset.action = "turbo"),
  );
  by("upgrade-spin-panel-upgrade-button").onclick = async () => {
    if (app.store.busy) return;
    if (mystery?.enabled) {
      try {
        await mystery.run();
      } catch (e) {
        if (!disposed) {
          app.store.busy = false;
          app.clearDeferredBalance();
          showInlineError(e.message);
          showSelections();
        }
      }
      return;
    }
    try {
      app.setBalanceDeferred();
      const outcome = app.store.upgrade(
        stakeItems(),
        target,
        app.dev.upgrade,
        Math.random,
        added,
        app.items,
      );
      app.dev.upgrade = null;
      showSelections();
      app.updateBalance();
      const connectionPause = Math.random() < .25 ? 0 : 480 + Math.round(Math.random() * 420);
      if (connectionPause) await new Promise(resolve => setTimeout(resolve, connectionPause));
      if (disposed) return;
      await wheel.spin(outcome, app.store.state.settings.turbo, app.audio);
      if (disposed) return;
      if (outcome.success && outcome.result) {
        // The result is already committed to inventory by the store. Keep a
        // presentation-only snapshot for the win Spline, while clearing all
        // actual selections so it cannot be reused implicitly or restored as
        // the next stake.
        wonTarget = outcome.result;
        selectedInputs = [];
        target = null;
        app.selectedInput = null;
      } else {
        wonTarget = null;
        selectedInputs = [];
      }
      added = 0;
      drawUser();
    } catch (e) {
      if (!disposed) showInlineError(e.message);
    } finally {
      if (!disposed) {
        app.store.busy = false;
        showSelections(true);
        drawShop();
        app.clearDeferredBalance();
      }
    }
  };
  app.cleanup.push(() => {
    disposed = true;
    mystery?.dispose();
    winScene?.dispose();
    app.store.busy = false;
    clearTimeout(timer);
    cancelPreset();
    wheel.dispose();
    app.audio.stop();
    app.clearDeferredBalance();
  });
  mystery = createMysteryMode({
    app,
    el,
    by,
    spinButton,
    buttonLabel,
    coin: asset("coin.svg"),
    desiredEmptyHtml: cards["upgrade-desired-card"],
    getSelected: () => selectedInputs,
    setSelected: (items) => {
      selectedInputs = items;
    },
    setAdded: (value) => {
      added = value;
    },
    resetTarget: () => {
      target = null;
      wonTarget = null;
      winScene?.dispose();
      winScene = null;
      el.querySelectorAll('[data-testid^="upgrade-fast-amount-"]').forEach(
        (b) => b.classList.remove("preset-selected"),
      );
    },
    redraw: () => {
      if (disposed) return;
      drawUser();
      drawShop();
      showSelections();
    },
    afterRound: () => {
      if (disposed) return;
      drawUser();
      drawShop();
      showSelections(true);
    },
  });
  drawUser();
  drawShop();
  showSelections();
  arrangeUpgradeLayout(el);
  mystery.init();
  showSelections();
}
