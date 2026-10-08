/** Isolated artwork from the approved finance reference; no sample labels/numbers. */
export const FINANCE_ART={
  profit:[253,303,70,68],sales:[154,400,47,45],cost:[151,637,59,55],expense:[156,877,52,54],cash:[157,1192,48,45],
  cheese:[185,457,50,44],mushroom:[186,506,51,45],sausage:[181,557,56,47],dough:[176,694,59,44],sauce:[172,744,34,55],toppings:[162,800,84,43],
  rent:[179,934,52,48],wage:[179,985,51,49],trash:[180,1038,49,48],bag:[170,1244,37,38],cart:[168,1287,42,39],stock:[169,1327,42,39],paid:[169,1368,41,39],ending:[165,1415,50,44],
} as const;
export type FinanceArtId=keyof typeof FINANCE_ART;
