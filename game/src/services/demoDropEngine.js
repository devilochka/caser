// DEMO ONLY. These weights are a local price-based model, never Caser odds.
// Every valid item has positive probability. A smooth power curve makes
// items worth many case prices much rarer, without excluding expensive drops.
//
// Per-case calibration: the base curve (exponent DROP_CURVE) is kept for cases
// that already return at least CASE_TARGET_RTP of their price on average.
// Stingier cases get a softer curve (smaller exponent, never below
// DROP_CURVE_MIN), solved so that their expected drop value equals
// CASE_TARGET_RTP x case price. Cheap items still drop more often than
// expensive ones; the odds are fixed per case and do not depend on history.
import { config } from "../config.js";

export function weights(items, casePrice, exponent = config.DROP_CURVE) {
  const base = Math.max(1, Number(casePrice));
  return items.map((i) => 1 / Math.pow(1 + Number(i.price) / base, exponent));
}

const validItems = (items) =>
  (items || []).filter(
    (i) => i && i.id && Number.isFinite(Number(i.price)) && Number(i.price) >= 0,
  );

// Expected drop value divided by the case price ("return to player").
export function expectedReturn(items, casePrice, exponent = config.DROP_CURVE) {
  const valid = validItems(items);
  const price = Number(casePrice);
  if (!valid.length || !(price > 0)) return 0;
  const w = weights(valid, price, exponent);
  const total = w.reduce((a, b) => a + b, 0);
  return valid.reduce((sum, item, i) => sum + w[i] * Number(item.price), 0) / total / price;
}

const curveCache = new WeakMap();
export function caseCurve(items, casePrice) {
  const key = Array.isArray(items) ? items : null;
  const cached = key && curveCache.get(key);
  if (cached && cached.price === Number(casePrice)) return cached.exponent;
  const target = config.CASE_TARGET_RTP;
  let exponent = config.DROP_CURVE;
  if (target > 0 && expectedReturn(items, casePrice, exponent) < target) {
    // expectedReturn falls as the exponent grows: bisect for the target.
    let lo = config.DROP_CURVE_MIN,
      hi = config.DROP_CURVE;
    if (expectedReturn(items, casePrice, lo) <= target) exponent = lo;
    else {
      for (let step = 0; step < 40; step++) {
        const mid = (lo + hi) / 2;
        if (expectedReturn(items, casePrice, mid) > target) lo = mid;
        else hi = mid;
      }
      exponent = (lo + hi) / 2;
    }
  }
  if (key) curveCache.set(key, { price: Number(casePrice), exponent });
  return exponent;
}

export function dropWeights(items, casePrice, boosted = false) {
  return weights(items, casePrice, caseCurve(items, casePrice)).map((weight, index) =>
    weight * (boosted && Number(items[index].price) >= Number(casePrice) ? config.ADMIN_ODDS_MULTIPLIER : 1));
}
export function demoDropEngine(items, casePrice, random = Math.random, boosted = false) {
  const valid = validItems(items);
  if (!valid.length) throw Error("В этом кейсе нет корректных предметов");
  const w = dropWeights(valid, casePrice, boosted);
  let n = random() * w.reduce((a, b) => a + b, 0);
  return valid.find((_, i) => (n -= w[i]) < 0) || valid.at(-1);
}
