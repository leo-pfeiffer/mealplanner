import { Mealplan, MealplanIngredient, MealplanRecipe, sequelize } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = Number(query.id);
  return await Mealplan.destroy({where: {id: id}});
})
  