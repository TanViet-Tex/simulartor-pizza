import type {IngredientId} from './ingredientCatalog.js';
/** Provisional Epic 5 balance; each component consumes one portion. */
export const RECIPE_CATALOG = [
 {id:'cheese',name:'Phô mai',price:60,purchasePrice:0,ingredients:['dough','sauce','cheese']},
 {id:'mushroom',name:'Nấm',price:78,purchasePrice:0,ingredients:['dough','sauce','cheese','mushroom']},
 {id:'sausage',name:'Xúc xích',price:90,purchasePrice:150,ingredients:['dough','sauce','cheese','sausage']},
 {id:'pepperoni',name:'Pepperoni',price:102,purchasePrice:200,ingredients:['dough','sauce','cheese','pepperoni']},
 {id:'vegetable',name:'Rau củ',price:96,purchasePrice:200,ingredients:['dough','sauce','cheese','pepper','onion','corn','olive']},
 {id:'chicken-bbq',name:'Gà BBQ',price:108,purchasePrice:250,ingredients:['dough','sauce-bbq','cheese','chicken','onion']},
 {id:'seafood',name:'Hải sản',price:120,purchasePrice:300,ingredients:['dough','sauce','cheese','shrimp','squid']},
 {id:'ham-pineapple',name:'Giăm bông dứa',price:114,purchasePrice:250,ingredients:['dough','sauce','cheese','ham','pineapple']},
] as const satisfies readonly {id:string;name:string;price:number;purchasePrice:number;ingredients:readonly IngredientId[]}[];
export type RecipeId=typeof RECIPE_CATALOG[number]['id'];
export const recipeDefinition=(id:RecipeId)=>RECIPE_CATALOG.find(recipe=>recipe.id===id)!;
export const defaultRecipePercents=()=>Object.fromEntries(RECIPE_CATALOG.map(r=>[r.id,100])) as Record<RecipeId,number>;
