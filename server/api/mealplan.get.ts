import { FindOptions } from 'sequelize';
import { Ingredient, Mealplan, MealplanIngredient, MealplanRecipe, Recipe, RecipeIngredient } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id;

  const findOptions: FindOptions = {
    include: [
      {
        model: MealplanRecipe,
        include: [
          {
            model: Recipe,
            attributes: ['id', 'name'],
            include: [
              {
                model: RecipeIngredient,
                include: [Ingredient],
                order: [['name', 'ASC']]
              }
            ],
            order: [['name', 'ASC']]
          }
        ]
      },
      {
        model: MealplanIngredient,
        include: [
          {
            model: Ingredient,
            attributes: ['id', 'name']
          }
        ],
        order: [['name', 'ASC']]
      }
    ],
  }

  if (id) {
    return await Mealplan.findByPk(Number(id), findOptions);
  }

  return await Mealplan.findAll(findOptions);
})
  