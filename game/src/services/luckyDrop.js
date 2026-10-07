import { config } from '../config.js';

// A rare modifier to a normal upgrade. It never changes the success roll.
// Select a real catalogue item; do not invent a price or award duplicate skins.
export function luckyDrop(target, catalog, random = Math.random, forced = false) {
  if (!forced && random() >= config.LUCKY_DROP_CHANCE) return null;
  const base = Number(target.price);
  const candidates = catalog.filter(item => Number(item.price) >= base * config.LUCKY_DROP_MULTIPLIER_MIN
    && Number(item.price) <= base * config.LUCKY_DROP_MULTIPLIER_MAX);
  if (!candidates.length) return forced ? { item: target, multiplier: 1, capped: true } : null;
  const desired = base * (config.LUCKY_DROP_MULTIPLIER_MIN
    + random() * (config.LUCKY_DROP_MULTIPLIER_MAX - config.LUCKY_DROP_MULTIPLIER_MIN));
  const item = candidates.reduce((best, item) => Math.abs(Number(item.price) - desired) < Math.abs(Number(best.price) - desired) ? item : best);
  return { item, multiplier: Number(item.price) / base };
}
