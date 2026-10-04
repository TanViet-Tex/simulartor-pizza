import {describe,it,expect} from 'vitest';
import {validateCozyCheckpoint,COZY_CONTENT_VERSION,COZY_LEGACY_CONTENT_VERSION,COZY_SCHEMA_VERSION} from './CozyCheckpoint';
import {CozyRuntime} from '../runtime/CozyRuntime';
import {checkpointChecksum,validateSaveEnvelope} from '../infrastructure/CozySaveRepository';
const fsModule:string='node:fs';
const {readFileSync}:{readFileSync:(path:string,encoding:string)=>string}=await import(fsModule);
const fixtures=JSON.parse(readFileSync('tests/fixtures/epic5-legacy.json','utf8'));
const envelope=(payload:unknown)=>({schemaVersion:1,contentVersion:COZY_LEGACY_CONTENT_VERSION,campaignId:'legacy-campaign',commitId:'legacy-commit',revision:4,checksum:checkpointChecksum(payload),payload});
describe('real compiled v1 save compatibility',()=>{
 it('preserves initial money and opens only owned starter recipes through a v2 round trip',()=>{
  const original=structuredClone(fixtures.initial),result=validateSaveEnvelope(envelope(original));
  expect(result).not.toHaveProperty('ok',false);if('ok' in result)throw new Error(result.code);
  expect(result.schemaVersion).toBe(COZY_SCHEMA_VERSION);expect(result.payload.contentId).toBe(COZY_CONTENT_VERSION);
  expect(result.payload.stock).toEqual(original.stock);expect(result.payload.ownedRecipes).toEqual(['cheese','mushroom']);
  const runtime=CozyRuntime.restoreCheckpoint(result.payload);expect(runtime).not.toBeNull();expect(runtime!.state.cash).toBe(300);
  expect(validateCozyCheckpoint(runtime!.exportCheckpoint())).not.toBeNull();expect(fixtures.initial).toEqual(original);
 });
 it('continues the real old completed day-three checkpoint at day four without replay or reset',()=>{
  const original=structuredClone(fixtures.terminal),result=validateSaveEnvelope(envelope(original));
  expect(result).not.toHaveProperty('ok',false);if('ok' in result)throw new Error(result.code);
  expect(result.payload.day).toBe(4);expect(result.payload.terminal).toBe(false);expect(result.payload.stock.cash).toBe(original.stock.cash);
  expect(result.payload.reports).toHaveLength(3);expect(result.payload.progression).toEqual(original.progression);
  const runtime=CozyRuntime.restoreCheckpoint(result.payload);expect(runtime).not.toBeNull();expect(runtime!.day).toBe(4);
  expect(runtime!.openShop()).toBe(true);expect(runtime!.closeDay()).toBe(true);expect(runtime!.daySummary!.ending).toBeNull();
  expect(validateCozyCheckpoint(runtime!.exportCheckpoint())).not.toBeNull();expect(fixtures.terminal).toEqual(original);
 });
 it('checks the original checksum before allowing migration',()=>{
  const saved=envelope(structuredClone(fixtures.initial));(saved.payload as {stock:{cash:number}}).stock.cash++;
  expect(validateSaveEnvelope(saved)).toMatchObject({ok:false,code:'corrupt'});
 });
 it('keeps the sausage unlocked by actual old deliveries without charging its new recipe price',()=>{
  const original=structuredClone(fixtures.sausageUnlocked),result=validateSaveEnvelope(envelope(original));
  expect(result).not.toHaveProperty('ok',false);if('ok' in result)throw new Error(result.code);
  expect(result.payload.ownedRecipes).toContain('sausage');expect(result.payload.stock.cash).toBe(original.stock.cash);
  expect(result.payload.progression).toEqual(original.progression);expect(result.payload.recipePurchases.spent).toBe(0);
  const runtime=CozyRuntime.restoreCheckpoint(result.payload);expect(runtime).not.toBeNull();expect(runtime!.availableRecipes).toContain('sausage');
  expect(runtime!.buyRecipe('sausage','do-not-buy-again')).toBe(false);expect(runtime!.state.cash).toBe(original.stock.cash);
  expect(validateCozyCheckpoint(runtime!.exportCheckpoint())).not.toBeNull();
 });
});
