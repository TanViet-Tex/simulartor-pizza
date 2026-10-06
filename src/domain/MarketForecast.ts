import {MARKET_FORECAST_RULES} from '../config/marketForecast';
import {STOCK_INGREDIENTS,recipeIngredients,type StockIngredient,type StockRecipe} from './CozyStock';
import type {CozyDaySummary} from './CozyCheckpoint';

export function marketForecast(day:number,menu:readonly StockRecipe[],scheduled:Partial<Record<StockRecipe,number>>,reports:readonly CozyDaySummary[],available:(id:StockIngredient)=>number,rules=MARKET_FORECAST_RULES,finishing:Partial<Record<StockIngredient,number>>={}){
  const history=reports.filter(report=>report.day<day&&report.salesByRecipe!==undefined).slice(-rules.recentReports);
  const historical=new Map<StockRecipe,number>();
  for(const report of history)for(const row of report.salesByRecipe??[])if(menu.includes(row.recipe))historical.set(row.recipe,(historical.get(row.recipe)??0)+row.quantity);
  const scheduledTotal=menu.reduce((n,recipe)=>n+(scheduled[recipe]??0),0),historyTotal=[...historical.values()].reduce((a,b)=>a+b,0);
  const expectations=[...new Set(menu)].map(recipe=>{
    const expected=scheduled[recipe]??0;
    const blended=historyTotal?expected*(1-rules.historyWeight)+scheduledTotal*(historical.get(recipe)??0)/historyTotal*rules.historyWeight:expected;
    return {recipe,expected:blended};
  });
  const portions=expectations.map(({recipe,expected})=>({recipe,quantity:Math.floor(expected)}));
  let remainder=scheduledTotal-portions.reduce((sum,p)=>sum+p.quantity,0);
  const ranked=expectations.map((p,index)=>({index,fraction:p.expected-Math.floor(p.expected)})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
  for(const row of ranked)if(remainder>0){portions[row.index].quantity++;remainder--;}
  const needs=new Map<StockIngredient,number>(Object.entries(finishing) as [StockIngredient,number][]);
  for(const portion of portions)for(const ingredient of recipeIngredients(portion.recipe))if(portion.quantity)needs.set(ingredient,(needs.get(ingredient)??0)+portion.quantity);
  const rows=STOCK_INGREDIENTS.filter(id=>needs.has(id)).map(ingredient=>{const needed=Math.ceil(needs.get(ingredient)!*(1+rules.reservePercent/100)),owned=Math.max(0,available(ingredient));return {ingredient,needed,available:owned,missing:Math.max(0,needed-owned)};});
  return {day,portions,rows,reservePercent:rules.reservePercent,historyDays:history.map(report=>report.day)};
}
