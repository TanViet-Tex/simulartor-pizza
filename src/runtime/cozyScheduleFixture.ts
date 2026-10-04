import type {CozyScheduleDependencies} from './CozyRuntime';

/** Explicit arrival data for order/economy regressions; never injected by production. */
export const ORDER_TEST_SCHEDULE:CozyScheduleDependencies={
  schedule:day=>({day,duration:16000,grace:120,slots:Array.from({length:800},(_,i)=>({id:'arrival-'+i,at:i*20,kind:(['regular','hurry','picky','bargain'] as const)[i%4],opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:true}))}),
  resolveRecipe:(_slot,_enabled,selected)=>selected,
};
