import { Mealplan, MealplanIngredient, MealplanRecipe, sequelize } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = Number(query.id);
  const t = await sequelize.transaction();
  try {
    await MealplanIngredient.destroy({where: {mealplanId: id}, transaction: t});
    await MealplanRecipe.destroy({where: {id: id}, transaction: t});
    await Mealplan.destroy({where: {id: id}, transaction: t});
    await t.commit();
  } catch (error) {
    await t.rollback();
    console.log('An error occurred while deleting the mealplan:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Could not delete mealplan',
    });
  }

})
  