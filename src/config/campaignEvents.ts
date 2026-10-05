export const CAMPAIGN_EVENT_A = Object.freeze({id:'A' as const,probability:.1,loss:200 as const,cooldownDays:3});
/** Stable legacy fallback; existing saves never acquire a new random seed on load. */
export const LEGACY_EVENT_SEED = 48;
export const MAX_EVENT_SEED = 0xffffffff;
