import {describe,it,expect} from 'vitest';
import {normalizeTestCode,TEST_CODE,validTestCodeReceipt} from './TestCode';
import {CozyRuntime} from '../runtime/CozyRuntime';
import {validateCozyCheckpoint} from './CozyCheckpoint';
import {checkpointChecksum,validateSaveEnvelope} from '../infrastructure/CozySaveRepository';
describe('TestCode checkpoint compatibility',()=>{
  it('normalizes only outer whitespace and case',()=>{expect(normalizeTestCode(' vietvuive ')).toBe(TEST_CODE);expect(normalizeTestCode('VIET VUIVE')).not.toBe(TEST_CODE);});
  it('bounds the receipt and rejects forged balances/report metadata',()=>{
    const r=new CozyRuntime(false,true);expect(r.claimTestCode(TEST_CODE)).toBe(true);const s=r.exportCheckpoint();expect(validTestCodeReceipt(s.testCodeReceipt,1)).toBe(true);
    for(const receipt of [{code:'x',coins:100000,day:1},{code:TEST_CODE,coins:1,day:1},{code:TEST_CODE,coins:100000,day:2},null])expect(validateCozyCheckpoint({...s,testCodeReceipt:receipt})).toBeNull();
    expect(validateCozyCheckpoint({...s,stock:{...s.stock,cash:300}})).toBeNull();expect(validateCozyCheckpoint({...s,testCodeReceipt:undefined})).toBeNull();
  });
  it('accepts original checksums without optional metadata and rejects tampering before normalization',()=>{
    const payload=new CozyRuntime(false,true).exportCheckpoint(),envelope={schemaVersion:2,contentVersion:payload.contentId,campaignId:'campaign',commitId:'commit',revision:1,payload,checksum:checkpointChecksum(payload)};
    expect(validateSaveEnvelope(envelope)).toMatchObject({campaignId:'campaign'});expect(Object.prototype.hasOwnProperty.call(payload,'testCodeReceipt')).toBe(false);
    expect(validateSaveEnvelope({...envelope,payload:{...payload,testCodeReceipt:{code:TEST_CODE,coins:100000,day:1}}})).toMatchObject({ok:false});
  });
});
