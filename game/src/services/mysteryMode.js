// Mystery Mode flag, stored like the original read/writeUpgradeMysteryMode*:
// key "upgrader_mystery_mode" ("true"/"false") plus game-settings JSON.
export const MYSTERY_KEY = "upgrader_mystery_mode";
const SETTINGS_KEY = "game-settings";
const parse = (value) =>
  value === null ? null : value === "true" || value === "1" ? true : value === "false" || value === "0" ? false : null;
export function readUpgradeMysteryModeFromStorage(storage = localStorage) {
  try {
    const direct = parse(storage.getItem(MYSTERY_KEY));
    if (direct !== null) return direct;
    const settings = JSON.parse(storage.getItem(SETTINGS_KEY) || "{}");
    return settings?.isMysteryModeEnabled === true;
  } catch {
    return false;
  }
}
export function writeUpgradeMysteryModeToStorage(enabled, storage = localStorage) {
  try {
    storage.setItem(MYSTERY_KEY, String(!!enabled));
  } catch {}
  try {
    const settings = JSON.parse(storage.getItem(SETTINGS_KEY) || "{}");
    storage.setItem(SETTINGS_KEY, JSON.stringify({ ...(settings && typeof settings === "object" ? settings : {}), isMysteryModeEnabled: !!enabled }));
  } catch {}
}
