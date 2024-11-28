import { useCreds } from "~/composables/useCreds";
import { useMailgun } from "~/composables/useMailgun";


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

    console.log('mealplan:', mealplan);

    let mealplanHtml = "<h2><b>" + mealplan.name + "</b></h2>";
    mealplanHtml += "<h3><b>Recipes:</b></h3>";
    for (const mealplanRecipe of mealplan.mealplan_recipes) {
      mealplanHtml += `<b>${mealplanRecipe.name}</b><br>`;
      mealplanHtml += "<ul>";
      for (const recipeIngredient of mealplanRecipe.recipe_ingredients) {
        mealplanHtml += `<li>${recipeIngredient.name}</li>`;
      }
      mealplanHtml += "</ul>";
    }
    mealplanHtml += "<h3><b>Extra ingredients:</b></h3>";
    mealplanHtml += "<ul>";
    for (const mealplanIngredient of mealplan.mealplan_ingredients) {
      mealplanHtml += `<li>${mealplanIngredient.name}</li>`;
    }
    mealplanHtml += "</ul>";

    await useMailgun().send(mealplanHtml);
    return { status: 200, body: {message: 'Email sent'} };
  }    
)
  