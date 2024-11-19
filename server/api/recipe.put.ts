import { sequelize, Recipe, RecipeIngredient, Ingredient } from '../dao/models';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    
    const name = body.name;
    const ingredients = body.ingredients;


    const t = await sequelize.transaction();

    try {
      const newRecipe = await Recipe.create({ name: name }, { transaction: t });

      // first create ingredients, if they don't exist yet
      for (const ingredient of ingredients) {
        const [newIngredient, created] = await Ingredient.findOrCreate({ where: { name: ingredient } , transaction: t});
        await RecipeIngredient.create({ recipeId: newRecipe.id, ingredientId: newIngredient.id }, { transaction: t });
      }

      await t.commit();
      return {
        status: 200
      }
    } catch (error) {
      await t.rollback();
      console.log('An error occurred while creating the recipe:', error);
      return createError({
        statusCode: 400,
        statusMessage: 'Recipe already exists',
      });
  }    
})
  