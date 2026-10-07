import {it,expect} from 'vitest';
import {advertisedVisitors} from './Advertising';
import type {CozySchedule} from '../config/cozySchedule';
it('reports seeded shop groups and app separately without counting pizzas as visitors',()=>{
 const slot=(id:string,at:number)=>({id,at,kind:'picky' as const,opportunity:'commercial' as const,commercialOrdinal:1,takeaway:false});
 const schedule={day:8,duration:240,grace:120,slots:[slot('a',0),slot('b',10),slot('c',10),{...slot('app',20),source:'app',quantity:3}]} as CozySchedule;
 expect(advertisedVisitors(schedule)).toEqual({day:8,groups:2,shopVisits:3,appOrders:1,total:4});
});
