export const config = {
  INITIAL_DEMO_BALANCE: 100000,
  UPGRADE_HOUSE_FACTOR: 0.9,
  MAX_UPGRADE_CHANCE: 0.8,
  ADMIN_ODDS_MULTIPLIER: 2.5,
  // Local approximation: Caser's server-side Lucky Drop odds are unavailable.
  LUCKY_DROP_CHANCE: 0.03,
  LUCKY_DROP_MULTIPLIER_MIN: 2,
  LUCKY_DROP_MULTIPLIER_MAX: 5,
  REWARD_TIMERS: { hourly: 3600000, daily: 86400000, weekly: 604800000 },
  LIVE_DROP_INTERVAL: 4500, // not used any more, see LIVE_DROP_BURST_*
  // Fake live drops: every 1.2-3.2 s a burst of 1-4 drops is queued and they
  // come in one by one with the original pacing (components/liveDrops.js).
  LIVE_DROP_BURST_EVERY_MS: [1200, 3200],
  LIVE_DROP_BURST_SIZE: [1, 4],
  ANIMATION_SPEED: 1,
  // Case odds: base drop curve and the minimum average return per case.
  // Cases returning less than CASE_TARGET_RTP get a softer curve (see
  // services/demoDropEngine.js). Set CASE_TARGET_RTP to 0 for the old odds.
  DROP_CURVE: 1.8,
  DROP_CURVE_MIN: 0,
  CASE_TARGET_RTP: 0.95,
  // Mystery Mode (original constants MIN/MAX_MYSTERY_BET_AMOUNT and the
  // win-card timing from the saved caser.one bundle).
  MIN_MYSTERY_BET_AMOUNT: 20,
  MAX_MYSTERY_BET_AMOUNT: 300000,
  MYSTERY_WIN_CARD_DELAY_MS: 3000,
  MYSTERY_WIN_CARD_POST_DELAY_MS: 1500,
  MYSTERY_WIN_CARD_REVEAL_EXTRA_MS: 500,
  // DEMO-only Mystery outcome: the original decides on the server and does not
  // publish odds. Locally the result value is stake x multiplier, the
  // multiplier drawn from these fixed tiers (weights sum to 1, average ~0.91).
  MYSTERY_TIERS: [
    { weight: 0.58, from: 0.15, to: 0.7 },
    { weight: 0.24, from: 0.7, to: 1.1 },
    { weight: 0.12, from: 1.1, to: 2 },
    { weight: 0.048, from: 2, to: 5 },
    { weight: 0.012, from: 5, to: 10 },
  ],
  AUDIO_ENABLED_DEFAULT: true,
  // Historical JSON includes this case, absent from the current reference.
  EXCLUDED_CASE_IDS: ["167"],
  EXCLUDED_CASE_SLUGS: ["six-seven"],
};
export const excludedCase = c => config.EXCLUDED_CASE_IDS.includes(String(c?.id)) || config.EXCLUDED_CASE_SLUGS.includes(c?.slug);
