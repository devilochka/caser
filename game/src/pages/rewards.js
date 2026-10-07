import { price } from "../components/items.js";
import { config } from "../config.js";
export function rewards(app) {
  const el = app.content;
  const kinds = ["hourly", "daily", "weekly"];
  const names = [
    "Lt. Commander Ricksaw",
    "Driver Gloves | Snow Leopard",
    "Bowie Knife | Doppler",
  ];
  const prize = (k) => {
    const exactName = el.querySelector(
      `[data-testid="giveaway-card-${k}"] img[alt]`,
    )?.alt;
    return (
      app.items.find((i) => i.marketName === exactName) ||
      app.items.find((i) => i.marketName.includes(names[kinds.indexOf(k)])) ||
      app.items.find((i) => i.price > 100)
    );
  };
  for (const kind of kinds) {
    const node = el.querySelector("[data-testid=giveaway-card-" + kind + "]");
    const button = node.querySelector("[data-testid=giveaway-card-topup]");
    button.onclick = () => {
      try {
        const i = app.store.claim(kind, prize(kind), app.dev.fastRewards);
        app.updateBalance();
        app.toast("DEMO-награда в инвентаре: " + i.marketName);
        tick();
      } catch (e) {
        app.toast(e.message);
      }
    };
  }
  const tick = () => {
    for (const kind of kinds) {
      const node = el.querySelector("[data-testid=giveaway-card-" + kind + "]");
      let seconds = Math.max(
        0,
        Math.ceil(((app.store.state.rewards[kind] || 0) - Date.now()) / 1000),
      );
      const values = {
        days: Math.floor(seconds / 86400),
        hours: Math.floor(seconds / 3600) % 24,
        minutes: Math.floor(seconds / 60) % 60,
        seconds: seconds % 60,
      };
      for (const [part, n] of Object.entries(values))
        node.querySelector(
          "[data-testid=giveaway-timer-" + part + "] span",
        ).textContent = String(n).padStart(2, "0");
      const b = node.querySelector("[data-testid=giveaway-card-topup]");
      b.disabled = seconds > 0;
      b.textContent = seconds ? "Ожидайте" : "Забрать DEMO";
    }
    const weekly = el.querySelector("[data-testid=weekly-drop-content]");
    weekly.querySelectorAll("[data-testid*=cta-topup]").forEach((b) => {
      b.textContent =
        (app.store.state.rewards.weekly || 0) > Date.now()
          ? "Набор получен"
          : "Забрать DEMO-набор";
      b.disabled = (app.store.state.rewards.weekly || 0) > Date.now();
      b.onclick = () => {
        try {
          app.store.claim("weekly", prize("weekly"), app.dev.fastRewards);
          app.updateBalance();
          tick();
          app.toast("Еженедельная награда в инвентаре");
        } catch (e) {
          app.toast(e.message);
        }
      };
    });
  };
  tick();
  const id = setInterval(tick, 1000);
  app.cleanup.push(() => clearInterval(id));
  el.querySelectorAll("[data-testid=giveaway-card-recent-winners]").forEach(
    (b) =>
      (b.onclick = () => {}),
  );
  el.querySelector("[data-testid=giveaway-rules-button]").onclick = () =>
    app.modal(
      "Правила наград",
      "Награда добавляет предмет в локальный инвентарь. Повторное получение доступно через час, день или неделю. Пополнение не требуется.",
    );
  el.querySelectorAll("[data-testid^=weekly-drop-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        const giveaway = b.dataset.testid.endsWith("giveaways");
        const list = el.querySelector("[data-testid=giveaway-list]");
        if (matchMedia("(max-width:1024px)").matches) {
          let section = list;
          while (
            section.parentElement !== el &&
            !section.classList.contains("lg:hidden")
          )
            section = section.parentElement;
          section.style.display = giveaway ? "block" : "none";
          el.querySelector(
            "[data-testid=weekly-drop-content]",
          ).parentElement.style.display = giveaway ? "none" : "flex";
          el.querySelectorAll("[data-testid^=weekly-drop-tab]").forEach((tab) =>
            tab.classList.toggle("demo-active-reward-tab", tab === b),
          );
        } else {
          (giveaway
            ? list
            : el.querySelector("[data-testid=weekly-drop-content]")
          ).scrollIntoView({ behavior: "smooth", block: "start" });
        }
        app.toast(
          giveaway
            ? "Локальные награды: час, день, неделя"
            : "Еженедельный DEMO-набор",
        );
      }),
  );
}
