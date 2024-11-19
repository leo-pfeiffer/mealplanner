import { Ingredient, Recipe, RecipeIngredient } from '../dao/models';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const id = query.id;
    if (id) {
      return await Recipe.findByPk(Number(id), {
        include: [
          {
            model: RecipeIngredient, 
            include: [Ingredient],
            order: [['name', 'ASC']]
          }
        ]
      });
    }
    return await Recipe.findAll({
      include: [
        {
          model: RecipeIngredient, 
          include: [Ingredient],
          order: [['name', 'ASC']]
        }
      ], 
      order: [['name', 'ASC']]
    });
  })
  