import { useCreds } from "~/composables/useCreds";
import { useMailgun } from "~/composables/useMailgun";
import { useGemini } from "~/composables/useGemini";
import { groupedIngredients } from "./email.utils";



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
    mealplanHtml += "</ul>";


    try {
      // Classify the ingredients
      const classifyPrompt = "Classify this shopping list by where in the supermarket I would find the respective item.\n"
        + "Do not add or remove any items from the list. If there are duplicates in the list, add up the quantities into a single item.\n"
        + "You should use the following supermarket sections: Produce, Meat/Seafood, Dairy, Pantry, Baker, Frozen.\n"
        + "If an item does not fit into any of these sections, you can add additional sections.\n"
        + "Format the output as a HTML list, but do not include any other HTML elements and return the list as plain text, i.e. without backticks.\n"
        + "Add a headline for each supermarket section, and add the items under the respective headline.\n"
        + "Here is the list: " + allIngredients.join(", ");
      const geminiList = await useGemini().generate(classifyPrompt);
      mealplanHtml += "<h3><b>Classified shopping list:</b></h3>";
      mealplanHtml += geminiList;
    } catch (error) {
      console.error(error);

      // Fallback to unclassified list
      mealplanHtml += "<h2><b>Shopping list:</b></h2>";
      mealplanHtml += "<ul>";
      for (const [ingredient, count] of groupedIngredients(allIngredients)) {
        mealplanHtml += `<li>${count}x ${ingredient}</li>`;
      }
      mealplanHtml += "</ul>";
    }

    await useMailgun().send(mealplanHtml);
    return { status: 200, body: {message: 'Email sent'} };
  }    
)
  