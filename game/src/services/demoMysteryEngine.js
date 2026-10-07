// DEMO ONLY. Local Mystery outcome: "you exchange your stake for a random
// item that can be worth more or less" (original FAQ). caser.one decides this
// on its server; here the result is fixed before the animation from stake x a
// multiplier drawn from config.MYSTERY_TIERS, then the catalog item closest to
// that value is chosen (a random one of the closest few, for variety).
import { config } from "../config.js";

export function drawMultiplier(random = Math.random, tiers = config.MYSTERY_TIERS) {
  const total = tiers.reduce((sum, t) => sum + t.weight, 0);
  let n = random() * total;
  const tier = tiers.find((t) => (n -= t.weight) < 0) || tiers.at(-1);
  return tier.from + random() * (tier.to - tier.from);
}
export function expectedMultiplier(tiers = config.MYSTERY_TIERS) {
  const total = tiers.reduce((sum, t) => sum + t.weight, 0);
  return tiers.reduce((sum, t) => sum + (t.weight * (t.from + t.to)) / 2, 0) / total;
}
// force: "success" (worth >= stake), "fail" (< stake), "rare" (>= 2x stake)
export function demoMysteryEngine(catalog, stake, random = Math.random, force = null) {
  const items = catalog.filter((i) => i && i.id && Number(i.price) > 0);
  if (!items.length) throw Error("Каталог предметов пуст");
  let multiplier = drawMultiplier(random);
  if (force === "rare") multiplier = 2 + random() * 3;
  else if (force === "success") multiplier = Math.max(multiplier, 1.1 + random() * 0.9);
  else if (force === "fail") multiplier = Math.min(multiplier, 0.2 + random() * 0.6);
  const value = stake * multiplier;
  const pool =
    force === "rare" ? items.filter((i) => Number(i.price) >= 2 * stake)
    : force === "success" ? items.filter((i) => Number(i.price) >= stake)
    : force === "fail" ? items.filter((i) => Number(i.price) < stake)
    : items;
  const source = pool.length ? pool : items;
  const closest = source
    .map((item) => ({ item, d: Math.abs(Math.log(Number(item.price) / value)) }))
    .sort((a, b) => a.d - b.d || String(a.item.id).localeCompare(String(b.item.id)))
    .slice(0, 5);
  const pick = closest[Math.floor(random() * closest.length)].item;
  return { item: pick, multiplier, value };
}
