import { sequelize, Mealplan, MealplanIngredient, MealplanRecipe, MealplanRecipeIngredient } from '../dao/models';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const id = body.id;
  const name = body.name;
  const recipes = body.recipes;
  const ingredients = body.ingredients;

  if (!recipes && !ingredients) {
    // update only name
    return await Mealplan.update(
      {name: String(body.name)}, 
      {where: {id: Number(id)}}
    );
  }

  const t = await sequelize.transaction();

  try {
    let mealplan;
    let created;
    if (!id) {
      [mealplan, created] = await Mealplan.findOrCreate({ where: { name: name } });
    } else {
      mealplan = await Mealplan.findByPk(Number(id));
      if (!mealplan) {
        return createError({
          statusCode: 400,
          statusMessage: 'Could not create mealplan',
        });
      }
      if (name) {
        await Mealplan.update({name: name}, {where: {id: Number(id)}});
        mealplan.name = name;  // so that update is reflected in the response, todo this is ugly
      }
    }
    const mealpanId = mealplan.id ? mealplan.id : Number(id);

    // delete existing recipes and ingredients
    await MealplanRecipe.destroy({ where: { mealplanId: mealpanId } });
    await MealplanIngredient.destroy({ where: { mealplanId: mealpanId } });
    await MealplanIngredient.bulkCreate(
      ingredients.map((ingredient: string) => (
        { 
          mealplanId: mealpanId, 
          name: ingredient 
        }
      )),
      { ignoreDuplicates: true, transaction: t }
    );

    const created_mealplan_recipes = await MealplanRecipe.bulkCreate(
      recipes.map((recipe: MealplanRecipe) => (
        { 
          mealplanId: mealpanId,
          name: recipe.name,
          note: recipe.note ? recipe.note : null,
          tags: recipe.tags ? recipe.tags : null,
        })
      ),
      { ignoreDuplicates: true, transaction: t }
    );

    // map the mealplanRecipeId to the recipe_ingredients
    for (const createdMealplanRecipe of created_mealplan_recipes) {
      const recipe = recipes.find((recipe: MealplanRecipe) => recipe.name === createdMealplanRecipe.name);
      if (recipe) {
        recipe.mealplanRecipeId = createdMealplanRecipe.id;
      }
    }

    interface MealplanRecipeWithIngredients extends MealplanRecipe {
      recipe_ingredients: MealplanRecipeIngredient[];
      mealplanRecipeId: number;
    };

    await MealplanRecipeIngredient.bulkCreate(
      recipes.map(
        (recipe: MealplanRecipeWithIngredients) => (
          recipe.recipe_ingredients.map(
            (ingredient: MealplanRecipeIngredient) => (
              { 
                mealplanRecipeId: recipe.mealplanRecipeId,
                name: ingredient.name,
              }
            )
          )
        )
      ).flat(),
      { ignoreDuplicates: true, transaction: t }
    );

    await t.commit();
    return {
      status: 200,
      body: {
        message: 'Mealplan created successfully',
        mealplanId: mealplan.id,
        mealplan: mealplan
      }
    }
  } catch (error) {
    await t.rollback();
    return createError({
      statusCode: 500,
      statusMessage: 'Could not create mealplan',
    });
  }
})
  