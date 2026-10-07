import { config } from "../config.js";
// DEMO ONLY: transparent local formula, unrelated to production Caser.
export function demoUpgradeFormula(input, target, addedBalance = 0) {
  const contribution = Number(addedBalance);
  const inputs = Array.isArray(input) ? input : input ? [input] : [];
  const a =
      inputs.reduce((sum, item) => sum + Number(item?.price || 0), 0) +
      contribution,
    b = Number(target?.price);
  if (!(
    inputs.length > 0 &&
    inputs.every((item) => Number(item?.price) > 0) &&
    Number.isFinite(contribution) &&
    contribution >= 0 &&
    a > 0 &&
    b > a
  ))
    return { chance: 0, multiplier: 0, valid: false };
  return {
    chance: Math.min(
      config.MAX_UPGRADE_CHANCE,
      (a / b) * config.UPGRADE_HOUSE_FACTOR,
    ),
    multiplier: b / a,
    valid: (a / b) * config.UPGRADE_HOUSE_FACTOR <= config.MAX_UPGRADE_CHANCE + 1e-12,
    effectiveInputValue: a,
    addedBalance: contribution,
  };
}
export function maxAddedBalance(input, target, balance) {
  const inputs = Array.isArray(input) ? input : input ? [input] : [];
  if (!inputs.length || !target || inputs.length >= 6) return 0;
  const inputValue = inputs.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0,
  );
  return Math.max(
    0,
    Math.floor(
      Math.min(
        Number(balance),
        (0.8 * Number(target.price)) / config.UPGRADE_HOUSE_FACTOR - inputValue,
      ) * 100,
    ) / 100,
  );
}
export function presetTarget(items, input, addedBalance, preset) {
  const inputs = Array.isArray(input) ? input : input ? [input] : [];
  const stake =
    inputs.reduce((sum, item) => sum + Number(item?.price || 0), 0) +
    Number(addedBalance);
  const percent = String(preset).endsWith("%");
  const desired = Number.parseFloat(preset) / (percent ? 100 : 1);
  const candidates = items.filter(
    (i) => demoUpgradeFormula(input, i, addedBalance).valid,
  );
  const distance = (i) =>
    percent
      ? Math.abs(demoUpgradeFormula(input, i, addedBalance).chance - desired)
      : Math.abs(i.price - stake * desired);
  return candidates.reduce(
    (best, i) =>
      !best ||
      distance(i) < distance(best) - 1e-12 ||
      (Math.abs(distance(i) - distance(best)) <= 1e-12 &&
        (i.price < best.price ||
          (i.price === best.price &&
            String(i.id).localeCompare(String(best.id), "en", {
              numeric: true,
            }) < 0)))
        ? i
        : best,
    null,
  );
}
