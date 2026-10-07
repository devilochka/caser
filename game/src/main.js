import { mountPage, preloadPageStyles } from "./components/persistentShell.js";
import { arrangeUpgradeLayout } from "./components/upgradeLayout.js";
import { DemoStore } from "./store/store.js";
import { AudioManager } from "./audio/audioManager.js";
import {
  setAssets,
  setItemImages,
  card,
  escape,
  price,
  image,
  rarityColor,
} from "./components/items.js";
import { caseDetail } from "./pages/caseDetail.js";
import { inventory } from "./pages/inventory.js";
import { upgrade } from "./pages/upgrade.js";
import { rewards } from "./pages/rewards.js";
import { profile } from "./pages/profile.js";
import { applyProfile } from './services/profileIdentity.js';
import { mountProfileSettings } from './components/profileSettings.js';
import { config, excludedCase } from "./config.js";
import { startLiveDrops } from "./components/liveDrops.js";
import { showToast, setToastAudio } from "./components/siteUi.js";
document.addEventListener(
  "error",
  (e) => {
    if (
      e.target instanceof HTMLImageElement &&
      !e.target.dataset.itemArt &&
      !e.target.src.endsWith("/src/fallback.svg")
    )
      e.target.src = "./src/fallback.svg";
  },
  true,
);
const app = {
  store: new DemoStore(localStorage),
  items: [],
  cases: [],
  cleanup: [],
  dev: { drop: null, upgrade: null, mystery: null, fastRewards: false },
  // Instances already committed by a round but not revealed yet (Mystery):
  // hidden from the inventory views and the header total until the reveal.
  hiddenInventoryIds: new Set(),
  selectedInput: null,
  content: null,
};
app.audio = new AudioManager(app.store.state.settings.audio);

// Original alert toasts (top right, red by default, green for "success").
setToastAudio(app.audio);
app.toast = (message, variant = "error") => showToast(message, variant);
app.modal = (title, body, action) => {
  document.querySelector("#demo-modal")?.remove();
  const node = document.createElement("dialog");
  node.id = "demo-modal";
  node.innerHTML = `<header class="caser-dialog-header"><h2>${escape(title)}</h2><button id="modal-close" type="button" aria-label="Закрыть"><svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="currentColor" stroke-width="3"/></svg></button></header><div class="caser-dialog-body"><p>${escape(body)}</p>${action ? '<div class="demo-controls"><button class="demo-primary" id="modal-accept">Подтвердить</button></div>' : ""}</div>`;
  document.body.append(node);
  node.showModal();
  node.querySelector("#modal-close").onclick = () => node.close();
  node.addEventListener("close", () => node.remove());
  if (action)
    node.querySelector("#modal-accept").onclick = () => {
      try {
        action();
        node.close();
      } catch (e) {
        app.toast(e.message);
      }
    };
};
const balanceValues = () => ({
  cash: app.store.state.balance,
  inventory: app.store.state.inventory
    .reduce((sum, i) => sum + Number(i.price), 0),
});
app.setBalanceDeferred = () => {
  app.deferredBalance ??= balanceValues();
};
app.clearDeferredBalance = () => {
  app.deferredBalance = null;
  app.updateBalance();
};
app.updateBalance = () => {
  applyProfile(app.store.state);
  const values = app.deferredBalance || balanceValues();
  document
    .querySelectorAll("[data-balance=cash]")
    .forEach((e) => (e.textContent = price(values.cash)));
  document
    .querySelectorAll("[data-balance=inventory]")
    .forEach(
      (e) =>
        (e.textContent = price(values.inventory)),
    );
  document
    .querySelector("#demo-label")
    ?.setAttribute(
      "title",
      "Локальный DEMO-баланс: " + price(app.store.state.balance),
    );
  document.dispatchEvent(new Event("demo-balance-updated"));
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    app.clearDeferredBalance();
    app.audio.stop();
  }
});
let templates = {},
  lastRoute = "";
async function route() {
  const current = location.hash || "#/inventory";
  app.cleanup.forEach((f) => f());
  app.cleanup = [];
  app.clearDeferredBalance();
  app.audio.stop();
  const [key, slug] = current.slice(2).split("/");
  const page = ["cases", "inventory", "upgrade", "rewards", "profile"].includes(key)
    ? key
    : "inventory";
  lastRoute = current;
  const doc = new DOMParser().parseFromString(
    templates[page === "cases" && slug ? "caseDetail" : page],
    "text/html",
  );
  mountPage(doc, templates.cases);
  app.content = document.querySelector("#demo-content");
  // Header: the logo opens the cases page, the avatar opens the profile.
  document
    .querySelectorAll("[data-testid=header-logo-link]")
    .forEach((a) => (a.href = "#/cases"));
  document
    .querySelectorAll("[data-testid^=header-profile-link]")
    .forEach((a) => (a.href = "#/profile"));
  app.updateBalance();
  if (page === "cases" && slug) {
    document.querySelector("[data-testid=cases-search-bar]")?.remove();
    caseDetail(
      app,
      app.cases.find((c) => c.slug === slug),
    );
  } else if (page === "cases") {
    const cards = [
      ...app.content.querySelectorAll("a[data-testid^=case-card-]"),
    ].filter(
      (a) =>
        !a.dataset.testid.endsWith("-title") &&
        !a.dataset.testid.endsWith("-price"),
    );
    for (const a of [...cards]) {
      if (
        a.getAttribute("href") === "#/cases/six-seven" ||
        a.dataset.testid === "case-card-six-seven"
      ) {
        a.remove();
        cards.splice(cards.indexOf(a), 1);
      }
    }
    for (const c of app.cases) {
      const el = cards.find(
        (a) =>
          a.dataset.testid === "case-card-" + c.slug ||
          a.getAttribute("href") === "#/cases/" + c.slug,
      );
      if (el) {
        el.href = "#/cases/" + c.slug;
        const p = el.querySelector(`[data-testid="case-card-${c.slug}-price"]`);
        if (p)
          p.childNodes.forEach((n) => {
            if (n.nodeType === 3) n.textContent = price(c.price);
          });
      } else {
        const model = cards[0];
        if (model) {
          const copy = model.cloneNode(true);
          copy.dataset.testid = "case-card-" + c.slug;
          copy.href = "#/cases/" + c.slug;
          copy.querySelectorAll("[data-testid]").forEach((n) => {
            if (n.dataset.testid.includes("-title")) {
              n.dataset.testid = "case-card-" + c.slug + "-title";
              n.textContent = c.title;
            }
            if (n.dataset.testid.includes("-price")) {
              n.dataset.testid = "case-card-" + c.slug + "-price";
              n.textContent = price(c.price) + " ◉";
            }
            if (/badge|countdown/.test(n.dataset.testid)) n.remove();
          });
          const img = copy.querySelector("img");
          img.src = image(c);
          img.alt = c.title;
          const section = app.content.querySelector(
            '[data-testid="cases-section-' + c.section?.slug + '"]',
          );
          const grid =
            section?.querySelector("[class*=grid]") || model.parentElement;
          grid.append(copy);
          cards.push(copy);
        }
      }
    }
    for (const a of cards) {
      a.classList.add('catalog-case-card');
      a.querySelector('img')?.classList.add('catalog-case-art');
      a.parentElement.classList.add('catalog-case-grid');
    }
    const search = document.querySelector("[data-testid=cases-search-input]");
    let timer;
    if (search)
      search.oninput = () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          for (const a of cards)
            a.style.display = a.textContent
              .toLowerCase()
              .includes(search.value.toLowerCase())
              ? ""
              : "none";
        }, 180);
      };
  } else if (page === "inventory") inventory(app);
  else if (page === "upgrade") upgrade(app);
  else if (page === "rewards") rewards(app);
  else if (page === "profile") profile(app);
  wireGeneral();
  startLive();

  window.scrollTo(0, 0);
}
function toggleMobileNavigation(button) {
  const existing=document.querySelector('#mobile-navigation');
  if(existing){existing.remove();button.setAttribute('aria-expanded','false');return;}
  const menu=document.createElement('div');menu.id='mobile-navigation';
  const nav=document.createElement('nav');nav.setAttribute('aria-label','Разделы сайта');
  const current=(location.hash||'#/inventory').split('/')[1];
  for(const [key,label] of [['cases','Кейсы'],['inventory','Инвентарь'],['upgrade','Апгрейды'],['rewards','Награды'],['profile','Профиль']]){
    const link=document.createElement('a');link.href='#/'+key;link.textContent=label;
    if(key===current)link.setAttribute('aria-current','page');nav.append(link);
  }
  const close=()=>{menu.remove();button.setAttribute('aria-expanded','false');document.removeEventListener('keydown',onKey);};
  const onKey=e=>{if(e.key==='Escape')close();};
  menu.append(nav);menu.style.top=document.querySelector('#demo-header').getBoundingClientRect().bottom+'px';
  menu.onclick=e=>{if(e.target===menu||e.target.closest('a'))close();};
  document.addEventListener('keydown',onKey);document.body.append(menu);
  button.setAttribute('aria-expanded','true');nav.querySelector('a').focus();app.cleanup.push(close);
}
function wireGeneral() {
  document.querySelectorAll("img").forEach((img) => {
    if (img.dataset.itemArt) return;
    if (img.dataset.errorBound) return;
    img.dataset.errorBound = "1";
    img.addEventListener(
      "error",
      () => {
        if (!img.src.endsWith("/src/fallback.svg"))
          img.src = "./src/fallback.svg";
      },
      { once: true },
    );
  });
  document.querySelectorAll("#demo-header button").forEach((b) => {
    if (b.querySelector('img[alt="Add funds"]')) b.dataset.action = "deposit";
    // DEMO settings live behind the profile gear; the mobile burger keeps the
    // menu with the page links.
    else if (b.dataset.testid === "header-burger-toggle") {
      delete b.dataset.action;
      b.setAttribute('aria-label','Открыть меню');
      b.setAttribute('aria-controls','mobile-navigation');
      b.setAttribute('aria-expanded','false');
      b.onclick=()=>toggleMobileNavigation(b);
    }
    else if (/notifications-toggle/.test(b.dataset.testid || "")) b.onclick = () => {};
  });
  document.body.onclick = (e) => {
    const b = e.target.closest("button,a,[role=button]");
    if (!b) return;
    const action = b.dataset.action;
    if (action === "deposit") {
      app.modal("DEMO-баланс", "Добавить 10 000 тестовых единиц?", () => {
        app.store.deposit();
        app.updateBalance();
      });
    } else if (action === "sell-all") {
      app.modal(
        "Продать все",
        "Продать все предметы за локальный DEMO-баланс?",
        () => {
          app.store.sell(app.store.state.inventory.map((i) => i.instanceId));
          app.updateBalance();
          route();
        },
      );
    } else if (action === "audio") {
      app.store.commit((s) => (s.settings.audio = !s.settings.audio));
      app.audio.enabled = app.store.state.settings.audio;
      syncSettings();
    } else if (action === "turbo") {
      app.store.commit((s) => (s.settings.turbo = !s.settings.turbo));
      syncSettings();
    } else if (action === "settings") settings();
    else if (action === "inspect") {
      const item =
        app.items.find((i) => i.id === b.dataset.id) ||
        app.store.state.inventory.find((i) => i.instanceId === b.dataset.id);
      if (item)
        app.modal(
          item.marketName,
          "DEMO-цена: " +
            price(item.price) +
            " · " +
            (item.stattrak ? "StatTrak™ · " : "") +
            (item.exterior || ""),
        );
    } else if (b.getAttribute("href") === "#demo") { e.preventDefault(); }
  };
  syncSettings();
  for (const b of document.querySelectorAll("button")) {
    if (b.onclick || b.dataset.action || b.disabled || (b.closest("#demo-content") && b.matches("[data-count]"))) continue;
    b.onclick = e => e.preventDefault();
    b.setAttribute("aria-disabled", "true");
  }
}
function syncSettings() {
  document
    .querySelectorAll('[data-action="audio"],[data-action="turbo"]')
    .forEach((b) => {
      const active =
        b.dataset.action === "audio"
          ? app.store.state.settings.audio
          : app.store.state.settings.turbo;
      b.setAttribute("aria-pressed", String(active));
      b.classList.toggle("control-enabled", active);
    });
}
function settings() {
  app.modal("Настройки", "Баланс: " + price(app.store.state.balance) + " · Предметов: " + app.store.state.inventory.length);
  const d = document.querySelector("#demo-modal");
  d.classList.add("caser-settings");
  const body = d.querySelector(".caser-dialog-body");
  mountProfileSettings(body, app);
  body.insertAdjacentHTML("beforeend", '<section class="caser-admin-actions"><button class="caser-admin-deposit" id="settings-deposit-small">+1 000 DEMO</button><button class="caser-admin-deposit" id="settings-deposit">+10 000 DEMO</button><button class="caser-admin-reset" id="settings-reset">RESET DEMO DATA</button></section><div class="caser-settings-preference"><span>Интерфейс браузера</span><button id="settings-browser" type="button"></button></div>');
  const chromeButton = d.querySelector("#settings-browser");
  body.querySelector('.caser-admin-actions').insertAdjacentHTML('beforebegin', '<form id="settings-balance-form" class="caser-admin-balance"><label for="settings-balance-value">Установить баланс</label><div><input id="settings-balance-value" inputmode="decimal" autocomplete="off" aria-label="Точный баланс"><button type="submit" class="caser-admin-deposit">Установить</button></div></form><section class="caser-admin-switches"><label><input type="checkbox" id="settings-upgrade-wins">Все апгрейды успешные</label><label><input type="checkbox" id="settings-lucky-drops">Lucky Drop в каждом обычном апгрейде</label><small>Бонус выдаётся при победе. Для постоянных побед включи первую галочку. Если в каталоге нет предмета ×2–×5, остаётся выбранная цель.</small><label><input type="checkbox" id="settings-expensive-cases">Самый дорогой дроп из каждого кейса</label><label><input type="checkbox" id="settings-boosted-odds">Повышенные шансы: апгрейды и кейсы</label><small>Фактический шанс апгрейда ×2,5, максимум 80%. Вероятности на экране остаются прежними. В кейсах повышен вес предметов дороже стоимости открытия.</small><p id="settings-admin-status" role="status" aria-live="polite"></p></section>');
  const balanceInput = d.querySelector('#settings-balance-value');
  balanceInput.value = String(app.store.state.balance);
  const status = d.querySelector('#settings-admin-status');
  const refreshAdminBalance = () => {
    balanceInput.value = String(app.store.state.balance);
    body.querySelector('p').textContent = 'Баланс: ' + price(app.store.state.balance) + ' · Предметов: ' + app.store.state.inventory.length;
    app.updateBalance();
  };
  d.querySelector('#settings-balance-form').onsubmit = event => {
    event.preventDefault();
    try {
      if (app.store.busy) throw Error('Дождитесь завершения анимации');
      const raw = balanceInput.value.trim().replace(',', '.');
      const amount = Number(raw);
      if (!raw || !Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100)
        throw Error('Введите неотрицательный баланс');
      app.store.commit(s => { s.balance = Math.round(amount * 100) / 100; });
      refreshAdminBalance();
      status.textContent = 'Баланс установлен';
    } catch (error) { status.textContent = error.message; }
  };
  for (const [id, key] of [['settings-upgrade-wins', 'upgradeWins'], ['settings-lucky-drops', 'luckyDrops'], ['settings-expensive-cases', 'expensiveCases'], ['settings-boosted-odds', 'boostedOdds']]) {
    const input = d.querySelector('#' + id);
    input.checked = !!app.store.state.admin?.[key];
    input.onchange = () => {
      try {
        if (app.store.busy) throw Error('Дождитесь завершения анимации');
        app.store.commit(s => { s.admin ||= {}; s.admin[key] = input.checked; });
        status.textContent = 'Настройка сохранена';
      } catch (error) { input.checked = !!app.store.state.admin?.[key]; status.textContent = error.message; }
    };
  }
  const updateChromeButton = () => {
    const enabled = window.parent.browserMockEnabled === true;
    chromeButton.textContent = enabled ? "Chrome: включён" : "Chrome: выключен";
    chromeButton.setAttribute("aria-pressed", String(enabled));
  };
  updateChromeButton();
  chromeButton.onclick = () => { window.parent.setBrowserMock?.(!window.parent.browserMockEnabled); updateChromeButton(); };
  const deposit = amount => {
    try { app.store.deposit(amount); refreshAdminBalance(); }
    catch (e) { app.toast(e.message); }
  };
  d.querySelector("#settings-deposit-small").onclick = () => deposit(1000);
  d.querySelector("#settings-deposit").onclick = () => deposit(10000);
  d.querySelector("#settings-reset").onclick = () => app.modal("Сбросить профиль", "Будут сброшены баланс, предметы, история, награды и игровые настройки. Это действие нельзя отменить.", () => { app.store.reset(); route(); });
}
function startLive() {
  if (app.liveStarted) return;
  app.liveStarted = true;
  startLiveDrops(app);
}
try {
  const requests =
    [
      "./data/caser_cases_full.json",
      "./data/caser_items.json",
      "./asset-map.json",
      "./item-images.json",
      ...["cases", "inventory", "upgrade", "rewards", "caseDetail", "profile"].map(
        (k) => "./templates/" + k + ".html",
      ),
    ].map((u) =>
      fetch(u).then((r) => {
        if (!r.ok) throw Error("Не удалось загрузить " + u);
        return u.endsWith(".json") ? r.json() : r.text();
      }),
    );
  // Paint the real shell as soon as its templates and CSS arrive. Large item
  // catalogues, images and web fonts can finish independently afterwards.
  const keys = ['cases','inventory','upgrade','rewards','caseDetail','profile'];
  const [initialKey,initialSlug]=(location.hash || '#/inventory').slice(2).split('/');
  const initialPage=keys.includes(initialKey)?initialKey:'inventory';
  const templateKey=initialPage==='cases'&&initialSlug?'caseDetail':initialPage;
  const shellReady = Promise.all([requests[4],requests[4+keys.indexOf(templateKey)]]).then(async ([casesHtml,pageHtml]) => {
    templates.cases=casesHtml;
    templates[templateKey]=pageHtml;
    await preloadPageStyles({cases:casesHtml,[templateKey]:pageHtml});
    const doc=new DOMParser().parseFromString(pageHtml,'text/html');
    if(initialPage==='upgrade') {
      // Match the original client-only spinner: panels paint before the wheel.
      // Fetch its art now so it is usually decoded when the catalogue is ready.
      for(const img of doc.querySelectorAll('[data-testid="upgrade-spinner"] img[src]')) {
        const preload=new Image();preload.src=img.getAttribute('src');
      }
      doc.querySelector('[data-testid="upgrade-spinner"]')?.remove();
      doc.querySelector('[data-testid="upgrade-shop-items-list-shop"]')?.replaceChildren();
      const empty=doc.querySelector('[data-testid="upgrade-inventory-empty-open-case"]');
      empty?.closest('div.flex-1')?.replaceChildren();
      doc.querySelectorAll('[data-testid="upgrade-spin-panel-upgrade-button"]').forEach(button=>button.disabled=true);
      arrangeUpgradeLayout(doc.querySelector('#demo-content'));
    } else if(initialPage!=='cases'||initialSlug)doc.querySelector('#demo-content').replaceChildren();
    mountPage(doc,templates.cases);
    const content=document.querySelector('#demo-content');
    content.inert=true;content.setAttribute('aria-busy','true');
    app.updateBalance();
    document.documentElement.dataset.startup='shell';
  });
  const responses = await Promise.all([...requests,shellReady]);
  app.cases = responses[0].cases.filter((c) => !excludedCase(c));
  app.items = responses[1].items
    .filter(
      (i) =>
        i.id &&
        i.marketName &&
        Number.isFinite(Number(i.price)) &&
        Number(i.price) > 0,
    )
    .map((i) => ({ ...i, price: Number(i.price) }));
  setAssets(responses[2]);
  setItemImages(responses[3]);
  ["cases", "inventory", "upgrade", "rewards", "caseDetail", "profile"].forEach(
    (k, i) => (templates[k] = responses[i + 4]),
  );
  await preloadPageStyles(templates);
  window.addEventListener("hashchange", route);
  await route();
  document.documentElement.dataset.startup='ready';
} catch (e) {
  document.body.innerHTML =
    '<div class="demo-empty">' +
    escape(e.message) +
    "<br>Запустите start.bat и откройте localhost:4173.</div>";
}


