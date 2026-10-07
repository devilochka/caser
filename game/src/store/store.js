import { config, excludedCase } from "../config.js";
import { demoDropEngine } from "../services/demoDropEngine.js";
import {
  demoUpgradeFormula,
  maxAddedBalance,
} from "../services/demoUpgradeFormula.js";
import { demoMysteryEngine } from "../services/demoMysteryEngine.js";
import { luckyDrop } from '../services/luckyDrop.js';
import { defaultProfile, backfillActivity } from '../services/profileIdentity.js';
export const KEY = "caser-local-demo-v1";
const money = (n) => Math.round(n * 100) / 100;
export function fresh() {
  return {
    version: 1,
    profile: defaultProfile(),
    activity: { deposits: 0, turnover: 0 },
    balance: config.INITIAL_DEMO_BALANCE,
    inventory: [],
    settings: { audio: config.AUDIO_ENABLED_DEFAULT, turbo: false },
    admin: { upgradeWins: false, luckyDrops: false, expensiveCases: false, boostedOdds: false },
    rewards: {},
    openingHistory: [],
    upgradeHistory: [],
    itemLog: [],
  };
}
export function validState(s) {
  return (
    s?.version === 1 &&
    Number.isFinite(s.balance) &&
    s.balance >= 0 &&
    Array.isArray(s.inventory) &&
    s.inventory.every(
      (i) =>
        i?.instanceId &&
        i.id &&
        Number.isFinite(Number(i.price)) &&
        Number(i.price) >= 0,
    ) &&
    Array.isArray(s.openingHistory) &&
    Array.isArray(s.upgradeHistory) &&
    s.settings &&
    s.rewards
  );
}
// Profile "History" tab: every item instance the player got, newest first,
// with where it came from and what happened to it (available / sold /
// used_in_upgrade). Capped; older saves are backfilled from what is known.
const LOG_LIMIT = 600;
const logEntry = (item, status = "available") => ({
  instanceId: item.instanceId,
  item: { id: item.id, marketName: item.marketName, image: item.image, price: Number(item.price), rarity: item.rarity, exterior: item.exterior, skin: item.skin, type: item.type, weapon: item.weapon, stattrak: item.stattrak },
  price: Number(item.price),
  source: item.source === "upgrade" || item.source === "mystery" ? { type: "upgrade", mystery: item.source === "mystery" } : item.source === "replacement" ? { type: "replacement" } : String(item.source || "").startsWith("reward-") ? { type: "giveaway" } : { type: "case", caseSlug: item.sourceCaseSlug || null },
  status,
  at: item.obtainedAt || Date.now(),
});
function addToLog(s, items) {
  s.itemLog = [...items.map((i) => logEntry(i)), ...(s.itemLog || [])].slice(0, LOG_LIMIT);
}
function markInLog(s, ids, status) {
  for (const e of s.itemLog || []) if (ids.includes(e.instanceId) && e.status === "available") e.status = status;
}
export function backfillItemLog(state) {
  const seen = new Map();
  const put = (item, status) => {
    if (item?.instanceId && !seen.has(item.instanceId)) seen.set(item.instanceId, logEntry(item, status));
  };
  state.inventory.forEach((i) => put(i, "available"));
  for (const h of state.upgradeHistory || []) {
    (h.inputs || [h.input]).flat().forEach((i) => put(i, "used_in_upgrade"));
    if (h.result) put(h.result, state.inventory.some((i) => i.instanceId === h.result.instanceId) ? "available" : "sold");
  }
  return [...seen.values()].sort((a, b) => b.at - a.at).slice(0, LOG_LIMIT);
}
export class DemoStore {
  constructor(storage) {
    this.storage = storage;
    try {
      const s = JSON.parse(storage.getItem(KEY));
      this.state = validState(s) ? s : fresh();
    } catch {
      this.state = fresh();
    }
    this.busy = false;
    if (!Array.isArray(this.state.itemLog)) this.state.itemLog = backfillItemLog(this.state);
    this.state.upgradeHistory = this.state.upgradeHistory.map((h) => ({
      ...h,
      mode: h.mode ?? "normal",
      addedBalance: h.addedBalance ?? 0,
      effectiveInputValue: h.effectiveInputValue ?? h.stake ?? (h.inputs || [h.input]).flat().reduce((sum, item) => sum + Number(item?.price || 0), Number(h.addedBalance || 0)),
    }));
    this.state.profile = { ...defaultProfile(), ...this.state.profile };
    this.state.activity ||= backfillActivity(this.state);
    this.save();
  }
  save() {
    try {
      this.storage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      throw Error(
        "Не удалось сохранить DEMO. Освободите место в хранилище браузера.",
      );
    }
  }
  commit(fn) {
    const next = structuredClone(this.state);
    fn(next);
    const old = this.state;
    this.state = next;
    try {
      this.save();
    } catch (e) {
      this.state = old;
      throw e;
    }
  }
  instance(item, source = {}) {
    return {
      ...item,
      price: Number(item.price),
      instanceId: crypto.randomUUID(),
      sourceItemId: item.id,
      obtainedAt: Date.now(),
      ...source,
    };
  }
  deposit(n = 10000) {
    if (this.busy) throw Error("Дождитесь завершения анимации");
    if (!Number.isFinite(n) || n <= 0) throw Error('Введите положительную сумму');
    this.commit((s) => { s.balance = money(s.balance + n); s.activity.deposits = money(s.activity.deposits + n); });
  }
  sell(ids) {
    if (this.busy) throw Error("Дождитесь завершения анимации");
    this.commit((s) => {
      const a = s.inventory.filter((i) => ids.includes(i.instanceId));
      s.balance = money(s.balance + a.reduce((n, i) => n + i.price, 0));
      s.inventory = s.inventory.filter((i) => !ids.includes(i.instanceId));
      markInLog(s, ids, "sold");
    });
  }
  // Profile "replace item": swap an inventory item for a catalogue item of
  // about the same value; the difference goes to / comes from the balance.
  replace(instanceId, target) {
    if (this.busy) throw Error("Дождитесь завершения анимации");
    const item = this.state.inventory.find((i) => i.instanceId === instanceId);
    if (!item) throw Error("Предмет больше недоступен");
    const diff = money(Number(item.price) - Number(target.price));
    if (diff < 0 && this.state.balance < -diff) throw Error("Недостаточно баланса для доплаты");
    const result = this.instance(target, { source: "replacement" });
    this.commit((s) => {
      s.balance = money(s.balance + diff);
      s.inventory = s.inventory.filter((i) => i.instanceId !== instanceId);
      s.inventory.push(result);
      markInLog(s, [instanceId], "replaced");
      addToLog(s, [result]);
    });
    return { result, diff };
  }
  open(c, count, force) {
    if (this.busy) throw Error("Открытие уже выполняется");
    if (this.state.admin?.expensiveCases) force = 'rare';
    if (!c || excludedCase(c)) throw Error("Кейс недоступен");
    const allowed =
      c.details?.case?.prices?.map((p) => p.count) ||
      Array.from(
        { length: Math.min(6, c.max_opens_at_once || 1) },
        (_, i) => i + 1,
      );
    if (!allowed.includes(count) || count > 6)
      throw Error("Количество открытий недоступно");
    const cost = money(Number(c.price) * count);
    if (!Number.isFinite(cost) || cost < 0)
      throw Error("Некорректная цена кейса");
    if (this.state.balance < cost) throw Error("Недостаточно DEMO-баланса");
    const items = c.details?.items || [];
    const sorted = items
      .filter((i) => Number.isFinite(Number(i.price)))
      .toSorted((a, b) => Number(a.price) - Number(b.price));
    const winners = Array.from({ length: count }, () =>
      this.instance(
        force === "common"
          ? sorted[0]
          : force === "rare"
            ? sorted.at(-1)
            : demoDropEngine(items, c.price, Math.random, this.state.admin?.boostedOdds),
        { sourceCaseId: c.id, sourceCaseSlug: c.slug },
      ),
    );
    this.commit((s) => {
      s.balance = money(s.balance - cost);
      s.activity.turnover = money(s.activity.turnover + cost);
      s.inventory.push(...winners);
      addToLog(s, winners);
      s.openingHistory.unshift({
        id: crypto.randomUUID(),
        caseSlug: c.slug,
        count,
        cost,
        winners: winners.map((i) => i.instanceId),
        at: Date.now(),
      });
    });
    this.busy = true;
    return winners;
  }
  upgrade(instanceIds, target, force, random = Math.random, addedBalance = 0, catalog = []) {
    if (this.busy) throw Error("Апгрейд уже выполняется");
    if (this.state.admin?.upgradeWins) force = 'success';
    const ids = [
      ...new Set(Array.isArray(instanceIds) ? instanceIds : [instanceIds]),
    ].filter(Boolean);
    if (!ids.length || ids.length > 6)
      throw Error("Выберите от 1 до 6 предметов");
    if (addedBalance > 0 && ids.length > 5)
      throw Error("С добавленным балансом можно выбрать не более 5 предметов");
    const inputs = ids.map((id) =>
      this.state.inventory.find((i) => i.instanceId === id),
    );
    if (inputs.some((i) => !i))
      throw Error("Выбранный предмет больше недоступен");
    if (
      !Number.isFinite(addedBalance) ||
      addedBalance < 0 ||
      money(addedBalance) !== addedBalance ||
      addedBalance > maxAddedBalance(inputs, target, this.state.balance)
    )
      throw Error("Недопустимый вклад DEMO-баланса");
    const f = demoUpgradeFormula(inputs, target, addedBalance);
    if (!f.valid) throw Error("Выберите предмет и более дорогую цель");
    const effectiveChance = this.state.admin?.boostedOdds
      ? Math.min(config.MAX_UPGRADE_CHANCE, f.chance * config.ADMIN_ODDS_MULTIPLIER)
      : f.chance;
    const success =
      force === "success" || (force !== "fail" && random() < effectiveChance);
    const lucky = luckyDrop(target, catalog, random, this.state.admin?.luckyDrops);
    const result = success
      ? this.instance(lucky?.item || target, { source: "upgrade", luckyDropMultiplier: lucky?.multiplier || null })
      : null;
    this.commit((s) => {
      s.balance = money(s.balance - addedBalance);
      s.activity.turnover = money(s.activity.turnover + f.effectiveInputValue);
      s.inventory = s.inventory.filter((i) => !ids.includes(i.instanceId));
      if (result) s.inventory.push(result);
      markInLog(s, ids, "used_in_upgrade");
      if (result) addToLog(s, [result]);
      s.upgradeHistory.unshift({
        id: crypto.randomUUID(),
        sessionId: crypto.randomUUID(),
        mode: "normal",
        input: inputs.length === 1 ? inputs[0] : inputs,
        inputs,
        inputInstanceIds: ids,
        target,
        result,
        success,
        luckyDrop: lucky ? { multiplier: lucky.multiplier, activated: success } : null,
        ...f,
        effectiveChance,
        at: Date.now(),
      });
    });
    this.busy = true;
    return { success, result, ...f, effectiveChance, luckyDrop: lucky ? { multiplier: lucky.multiplier, activated: success } : null };
  }
  // Mystery Mode: stake = inventory instances only (no added balance), result
  // is any catalog item. One atomic commit before the animation: inputs are
  // removed, the result instance and the history record are stored together.
  mysteryStake(instanceIds) {
    const ids = [
      ...new Set(Array.isArray(instanceIds) ? instanceIds : [instanceIds]),
    ].filter(Boolean);
    const inputs = ids.map((id) =>
      this.state.inventory.find((i) => i.instanceId === id),
    );
    return { ids, inputs, stake: money(inputs.reduce((n, i) => n + Number(i?.price || 0), 0)) };
  }
  mysteryUpgrade(instanceIds, catalog, force = null, random = Math.random) {
    if (this.busy) throw Error("Апгрейд уже выполняется");
    if (this.state.admin?.upgradeWins) force = 'success';
    const { ids, inputs, stake } = this.mysteryStake(instanceIds);
    if (!ids.length || ids.length > 6)
      throw Error("Выберите от 1 до 6 предметов");
    if (inputs.some((i) => !i))
      throw Error("Выбранный предмет больше недоступен");
    if (stake < config.MIN_MYSTERY_BET_AMOUNT)
      throw Error("Минимальная ставка " + config.MIN_MYSTERY_BET_AMOUNT);
    if (stake > config.MAX_MYSTERY_BET_AMOUNT)
      throw Error("Максимальная ставка " + config.MAX_MYSTERY_BET_AMOUNT);
    const { item, multiplier } = demoMysteryEngine(catalog, stake, random, force);
    const result = this.instance(item, { source: "mystery" });
    const success = Number(result.price) >= stake;
    const rare = Number(result.price) >= 2 * stake;
    const record = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      mode: "mystery",
      inputs,
      inputInstanceIds: ids,
      stake,
      effectiveInputValue: stake,
      addedBalance: 0,
      target: null,
      result,
      success,
      rare,
      multiplier: Math.round(multiplier * 10000) / 10000,
      at: Date.now(),
    };
    this.commit((s) => {
      s.inventory = s.inventory.filter((i) => !ids.includes(i.instanceId));
      s.inventory.push(result);
      markInLog(s, ids, "used_in_upgrade");
      addToLog(s, [result]);
      s.upgradeHistory.unshift(record);
      s.activity.turnover = money(s.activity.turnover + stake);
    });
    this.busy = true;
    return record;
  }
  claim(kind, item, fast = false) {
    if (this.busy) throw Error("Дождитесь завершения анимации");
    const duration = fast ? 10000 : config.REWARD_TIMERS[kind];
    if (!duration) throw Error("Неизвестная награда");
    if (Date.now() < (this.state.rewards[kind] || 0))
      throw Error("Награда ещё не готова");
    const instance = this.instance(item, { source: "reward-" + kind });
    this.commit((s) => {
      s.inventory.push(instance);
      addToLog(s, [instance]);
      s.rewards[kind] = Date.now() + duration;
    });
    return instance;
  }
  reset() {
    if (this.busy) throw Error("Дождитесь завершения анимации");
    this.state = fresh();
    this.save();
  }
}
