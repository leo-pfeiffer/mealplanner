import { useCreds } from "~/composables/useCreds";
import { useMailgun } from "~/composables/useMailgun";
import { MealplanRecipeIngredient } from "~/server/dao/models";

const cleanIngredientName = (name: string): string => {
  // 1. Lower case
  // 2. Replace all non-alphanumeric characters with a space
  // 3. Remove leading and trailing spaces
  // 4. Replace multiple spaces with a single space
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
}

const groupedIngredients = (ingredients: string[]): [string, number][] => {
  console.log(ingredients);
  const ingredientMap = new Map<string, number>();
  for (const ingredient of ingredients) {
    const cleanName = cleanIngredientName(ingredient);
    console.log(cleanName, ingredientMap.get(cleanName));
    ingredientMap.set(cleanName, (ingredientMap.get(cleanName) ?? 0) + 1);
  }
  return Array.from(ingredientMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}


export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    if (!query.mealplanId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing mealplanId',
      });
    }

    // pass on token
    const cookieHeader = getHeader(event, 'Cookie');
    const authHeaders = getHeader(event, 'Authorization');
    let token;

    // use auth header first if present
    if (authHeaders) {
      token = useCreds().getTokenFromHeaderString(authHeaders);
    }
    else if (cookieHeader) {
      token = useCreds().getTokenFromCookieString(cookieHeader);
    }
    
    if (!token) {
      throw createError({statusCode: 401, statusMessage: 'Unauthorized'});
    }
    const config = useRuntimeConfig();
    const mealplan = await fetch(
      `${config.public.appURL}/api/mealplan?id=${query.mealplanId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
    }
    ).then(res => {
        return res.json()
      });
    if (!mealplan) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No mealplan found for mealplanId not found',
      });
    }

    const allIngredients = [];

    let mealplanHtml = "<h2><b>" + mealplan.name + "</b></h2>";
    mealplanHtml += "<h3><b>Recipes:</b></h3>";
    for (const mealplanRecipe of mealplan.mealplan_recipes) {
      mealplanHtml += `<b>${mealplanRecipe.name}</b><br>`;
      mealplanHtml += "<ul>";
      for (const recipeIngredient of mealplanRecipe.recipe_ingredients) {
        allIngredients.push(recipeIngredient.name);
        mealplanHtml += `<li>${recipeIngredient.name}</li>`;
      }
      mealplanHtml += "</ul>";
    }
    mealplanHtml += "<h3><b>Extra ingredients:</b></h3>";
    mealplanHtml += "<ul>";
    for (const mealplanIngredient of mealplan.mealplan_ingredients) {
      allIngredients.push(mealplanIngredient.name);
      mealplanHtml += `<li>${mealplanIngredient.name}</li>`;
    }
    mealplanHtml += "</ul><b>";

    mealplanHtml += "<h2><b>Shopping list:</b></h3>";
    mealplanHtml += "<ul>";
    for (const [ingredient, count] of groupedIngredients(allIngredients)) {
      mealplanHtml += `<li>${count}x ${ingredient}</li>`;
    }
    mealplanHtml += "</ul>";

    await useMailgun().send(mealplanHtml);
    return { status: 200, body: {message: 'Email sent'} };
  }    
)
  