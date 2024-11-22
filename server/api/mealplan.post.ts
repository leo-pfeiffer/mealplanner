import { sequelize, Mealplan, MealplanIngredient, MealplanRecipe, Recipe } from '../dao/models';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const id = body.id;
  const name = body.name;
  const recipes = body.recipes;
  const ingredients = body.ingredients;

  if (!recipes && !ingredients) {
    // update only name
    return await Mealplan.update({name: String(body.name)}, {where: {id: Number(body.id)}});
  }

  const t = await sequelize.transaction();

  try {
    const [mealplan, created] = await Mealplan.findOrCreate({ where: { name: name } });
    // delete existing recipes and ingredients if mealplan already exists
    if (!created) {
      await MealplanRecipe.destroy({ where: { mealplanId: mealplan.id } });
      await MealplanIngredient.destroy({ where: { mealplanId: mealplan.id } });
    }
    // create recipes
    for (const recipeId of recipes) {
      await MealplanRecipe.create({ recipeId: recipeId, mealplanId: mealplan.id }, { transaction: t });
    }
    // create ingredients
    for (const ingredientId of ingredients) {
      await MealplanIngredient.create({ ingredientId: ingredientId, mealplanId: mealplan.id }, { transaction: t });
    }
    await t.commit();
    return {
      status: 200,
      body: {
        message: 'Mealplan created successfully',
        mealplanId: mealplan.id,
      }
    }
  } catch (error) {
    await t.rollback();
    console.log('An error occurred while creating the mealplan:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Could not create mealplan',
    });
  }
})
  