import { card, controls, sortItems } from "../components/items.js";
export function inventory(app) {
  const el = app.content;
  const empty = el.querySelector("[data-testid=inventory-items-empty]");
  const emptyHTML =
    empty?.outerHTML ||
    '<div class="demo-empty">У вас нет предметов <a href="#/cases">Открыть кейс</a></div>';
  const render = () => {
    if (!app.store.state.inventory.length) {
      if (!el.querySelector("[data-testid=inventory-items-empty]"))
        el.innerHTML = emptyHTML;
      return;
    }
    el.innerHTML = `<section class="demo-inventory"><div class="demo-controls"><button data-action="sell-all">Продать все</button><button id="sell-selected" disabled>Продать выбранное</button><a id="go-upgrade" class="demo-primary" href="#/upgrade">В апгрейд</a>${controls("inv-")}</div><div id="inventory-grid" class="demo-grid"></div><div id="inventory-pages" class="demo-controls"></div></section>`;
    let selected = new Set(),
      page = 0;
    const draw = () => {
      const query = el.querySelector("#inv-search").value.toLowerCase();
      const list = sortItems(
        app.store.state.inventory.filter((i) =>
          i.marketName.toLowerCase().includes(query),
        ),
        el.querySelector("#inv-sort").value,
      );
      const grid = el.querySelector("#inventory-grid");
      grid.innerHTML = list
        .slice(page * 48, page * 48 + 48)
        .map((i) => card(i, "select-inventory", selected.has(i.instanceId)))
        .join("");
      grid.querySelectorAll("button").forEach(
        (b) =>
          (b.onclick = () => {
            selected.has(b.dataset.id)
              ? selected.delete(b.dataset.id)
              : selected.add(b.dataset.id);
            draw();
          }),
      );
      el.querySelector("#sell-selected").disabled = !selected.size;
      el.querySelector("#go-upgrade").onclick = () =>
        (app.selectedInput = [...selected][0] || null);
      const pages = Math.ceil(list.length / 48);
      el.querySelector("#inventory-pages").innerHTML =
        pages > 1
          ? `<button id="inv-prev" ${page === 0 ? "disabled" : ""}>←</button><span>${page + 1} / ${pages}</span><button id="inv-next" ${page + 1 >= pages ? "disabled" : ""}>→</button>`
          : "";
      el.querySelector("#inv-prev")?.addEventListener("click", () => {
        page--;
        draw();
      });
      el.querySelector("#inv-next")?.addEventListener("click", () => {
        page++;
        draw();
      });
    };
    el.querySelector("#inv-sort").value = "new";
    let timer;
    el.querySelector("#inv-search").oninput = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        page = 0;
        draw();
      }, 180);
    };
    el.querySelector("#inv-sort").onchange = () => {
      page = 0;
      draw();
    };
    el.querySelector("#sell-selected").onclick = () => {
      app.store.sell([...selected]);
      app.updateBalance();
      render();
    };
    draw();
  };
  app.refreshInventory = render;
  render();
}
