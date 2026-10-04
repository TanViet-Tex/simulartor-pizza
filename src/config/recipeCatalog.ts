import type {IngredientId} from './ingredientCatalog';
/** Provisional Epic 5 balance; each component consumes one portion. */
export const RECIPE_CATALOG = [
 {id:'cheese',name:'Phô mai',price:50,purchasePrice:0,ingredients:['dough','sauce','cheese']},
 {id:'mushroom',name:'Nấm',price:65,purchasePrice:0,ingredients:['dough','sauce','cheese','mushroom']},
 {id:'sausage',name:'Xúc xích',price:75,purchasePrice:150,ingredients:['dough','sauce','cheese','sausage']},
 {id:'pepperoni',name:'Pepperoni',price:85,purchasePrice:200,ingredients:['dough','sauce','cheese','pepperoni']},
 {id:'vegetable',name:'Rau củ',price:80,purchasePrice:200,ingredients:['dough','sauce','cheese','pepper','onion','corn','olive']},
 {id:'chicken-bbq',name:'Gà BBQ',price:90,purchasePrice:250,ingredients:['dough','sauce-bbq','cheese','chicken','onion']},
 {id:'seafood',name:'Hải sản',price:100,purchasePrice:300,ingredients:['dough','sauce','cheese','shrimp','squid']},
 {id:'ham-pineapple',name:'Giăm bông dứa',price:95,purchasePrice:250,ingredients:['dough','sauce','cheese','ham','pineapple']},
] as const satisfies readonly {id:string;name:string;price:number;purchasePrice:number;ingredients:readonly IngredientId[]}[];
export type RecipeId=typeof RECIPE_CATALOG[number]['id'];
export const recipeDefinition=(id:RecipeId)=>RECIPE_CATALOG.find(recipe=>recipe.id===id)!;
export const defaultRecipePercents=()=>Object.fromEntries(RECIPE_CATALOG.map(r=>[r.id,100])) as Record<RecipeId,number>;
