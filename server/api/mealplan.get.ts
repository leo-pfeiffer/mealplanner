import { FindOptions } from 'sequelize';
import { Mealplan, MealplanIngredient, MealplanRecipe, MealplanRecipeIngredient } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id;

  const findOptions: FindOptions = {
    include: [
      {
        model: MealplanRecipe,
        attributes: ['name', 'note', 'tags'],
        order: [['name', 'ASC']],
        include: [
          {
            model: MealplanRecipeIngredient,
            as: 'recipe_ingredients',
            attributes: ['name'],
            order: [['name', 'ASC']]
          }
        ]
      },
      {
        model: MealplanIngredient,
        attributes: ['name'],
        order: [['name', 'ASC']]
      }
    ],
    order: [['name', 'ASC']]
  }

  if (id) {
    return await Mealplan.findByPk(Number(id), findOptions);
  }

  return await Mealplan.findAll(findOptions);
})
  