import {describe,expect,it} from 'vitest';
import {selectWorkbenchDrink} from './WorkbenchDrink';

describe('drink follows the cutting-board order',()=>{
  const tickets=[
    {id:'pizza-owner',drink:'cola' as const,drinkAttached:true},
    {id:'inspected',drink:'water' as const,drinkAttached:true},
    {id:'unattached',drink:'orange' as const,drinkAttached:false},
    {id:'no-drink',drinkAttached:true},
  ];
  it('shows the selected attached bottle before a pizza owns the board',()=>{
    expect(selectWorkbenchDrink(tickets,null,'inspected')).toEqual({ticketId:'inspected',drink:'water'});
  });
  it('keeps the production owner bottle while another customer is inspected',()=>{
    expect(selectWorkbenchDrink(tickets,'pizza-owner','inspected')).toEqual({ticketId:'pizza-owner',drink:'cola'});
  });
  it('does not borrow another drink when the owner has none attached',()=>{
    expect(selectWorkbenchDrink(tickets,'unattached','inspected')).toBeNull();
    expect(selectWorkbenchDrink(tickets,'no-drink','inspected')).toBeNull();
  });
  it('does not borrow another drink when the board owner has abandoned their pizza',()=>{
    expect(selectWorkbenchDrink(tickets,'abandoned-owner','inspected')).toBeNull();
  });
  it('clears a delivered bottle even if its selection is briefly retained',()=>{
    expect(selectWorkbenchDrink([],null,'pizza-owner')).toBeNull();
  });
  it('shows no drink without an attached selected order',()=>{
    expect(selectWorkbenchDrink(tickets,null,'unattached')).toBeNull();
    expect(selectWorkbenchDrink(tickets,null,null)).toBeNull();
  });
});
