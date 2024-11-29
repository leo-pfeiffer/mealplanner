import { Recipe, RecipeIngredient, sequelize } from '../dao/models';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const updateId = Number(body.id);
    const name = body.name;
    const note = body.note;
    const tags = body.tags;
    const ingredients = body.ingredients || [];
    
    const fieldsToUpdate = body.fieldsToUpdate;

    // if no ID is provided, this is a new recipe
    if (!updateId) {
      const t = await sequelize.transaction();
      try {
        const newRecipe = await Recipe.create(
          { name: name, note: note, tags: tags }, 
          { transaction: t }
        );

        await RecipeIngredient.bulkCreate(
          ingredients.map((ingredient: string) => ({ recipeId: newRecipe.id, name: ingredient })),
          { ignoreDuplicates: true, transaction: t }
        );
        await t.commit();
        return {
          status: 200
        }
      } catch (error) {
        await t.rollback();
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
        if (fieldsToUpdate.includes('tags')) {
          updates = { ...updates, tags: tags };
        }
        if (Object.keys(updates).length > 0) {
          await Recipe.update(updates, { where: { id: updateId }, transaction: t });
        }

        // Create new ingredients
        if (fieldsToUpdate.includes('ingredients')) {
          // Delete existing ingredients
          await RecipeIngredient.destroy({ where: { recipeId: updateId }, transaction: t });

          await RecipeIngredient.bulkCreate(
            ingredients.map((ingredient: string) => ({ recipeId: updateId, name: ingredient })),
            { ignoreDuplicates: true, transaction: t }
          );
        }
        await t.commit();
        return {
          status: 200
        }
      }
      catch (error) {
        await t.rollback();
        return createError({
          statusCode: 400,
          statusMessage: 'Error updating recipe',
        });
      }
    } 
  }    
)
  