import { useCreds } from "~/composables/useCreds";
import { useMailgun } from "~/composables/useMailgun";

const cleanIngredientName = (name: string): string => {
  // 1. Lower case
  // 2. Replace all non-alphanumeric characters with a space
  // 3. Remove leading and trailing spaces
  // 4. Replace multiple spaces with a single space
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
}

const groupedIngredients = (ingredients: string[]): Map<String, Number> => {
  const ingredientMap = new Map<string, number>();
  for (const ingredient of ingredients) {
    const cleanName = cleanIngredientName(ingredient);
    ingredientMap.set(cleanName, (ingredientMap.get(cleanName) ?? 0) + 1);
  }
  return ingredientMap;
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

    const classifiedIngredients = await fetch(
      `${config.public.appURL}/api/internal/classifier`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({words: allIngredients})
    })
    .then(res => res.json())
    .then(data => data.prediction)
    .then(predictions => {
      const predictionToIngredient = new Map<string, string[]>();
      for (const [ingredient, category] of predictions) {
        const ingredients = predictionToIngredient.get(category) ?? [];
        ingredients.push(ingredient);
        predictionToIngredient.set(category, ingredients);
      }
      return predictionToIngredient;
    })
    
    const groupedIngrs = groupedIngredients(allIngredients);

    // Iterate over classes
    for (const category of classifiedIngredients.keys()) {
      mealplanHtml += `<h3>${category}</h3>`;
      mealplanHtml += "<ul>";
      const ingredients = classifiedIngredients.get(category) ?? [];
      for (const ingredient of ingredients) {
        const count = groupedIngrs.get(cleanIngredientName(ingredient));
        if (count) {
          mealplanHtml += `<li>${count}x ${ingredient}</li>`;
        }
      }
      mealplanHtml += "</ul>";
    }

    await useMailgun().send(mealplanHtml);
    return { status: 200, body: {message: 'Email sent'} };
  }    
)
  