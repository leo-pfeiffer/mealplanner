import { Ingredient, Recipe, RecipeIngredient, sequelize } from '../dao/models';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const updateId = Number(body.id);
    const name = body.name;
    const note = body.note;
    const ingredients = body.ingredients;
    
    const fieldsToUpdate = body.fieldsToUpdate;

    // if no ID is provided, this is a new recipe
    if (!updateId) {
      const t = await sequelize.transaction();

      try {
        const newRecipe = await Recipe.create({ name: name, note: note }, { transaction: t });
  
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
    }

    // if ID is provided, this is an update
    if (updateId) {
      const recipe = await Recipe.findByPk(updateId);
      
      if (!recipe || !fieldsToUpdate || fieldsToUpdate.length === 0) {
          return { status: 400, body: {message: 'Bad request.'} };
      }

      const t = await sequelize.transaction();

      try {
        // Apply updates to recipe
        let updates = {};
        if (fieldsToUpdate.includes('name')) {
          updates = { ...updates, name: name };
        }
        if (fieldsToUpdate.includes('note')) {
          updates = { ...updates, note: note };
        }
        if (Object.keys(updates).length > 0) {
          await Recipe.update(updates, { where: { id: updateId }, transaction: t });
        }

        // Create new ingredients
        if (fieldsToUpdate.includes('ingredients')) {
          // Delete existing ingredients
          await RecipeIngredient.destroy({ where: { recipeId: updateId }, transaction: t });

          if (ingredients && ingredients.length > 0) {
            for (const ingredient of ingredients) {
              const [newIngredient, created] = await Ingredient.findOrCreate({ where: { name: ingredient } , transaction: t});
              await RecipeIngredient.create({ recipeId: updateId, ingredientId: newIngredient.id }, { transaction: t });
            }
          }
        }

        await t.commit();
        return {
          status: 200
        }
      }
      catch (error) {
        await t.rollback();
        console.log('An error occurred while updating the recipe:', error);
        return createError({
          statusCode: 400,
          statusMessage: 'Error updating recipe',
        });
      }
    } 
  }    
)
  