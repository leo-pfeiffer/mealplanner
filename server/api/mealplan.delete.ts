import { Mealplan, MealplanIngredient, MealplanRecipe, sequelize } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = Number(query.id);
  const userId = event.context.userId;
  return await Mealplan.destroy({where: {id: id, userId}});
})
  