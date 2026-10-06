/** Provisional preparation guidance; recommendations never purchase or reserve stock. */
export interface MarketForecastRules {reservePercent:number;recentReports:number;historyWeight:number}
export const MARKET_FORECAST_RULES:Readonly<MarketForecastRules>=Object.freeze({reservePercent:10,recentReports:3,historyWeight:.5});
