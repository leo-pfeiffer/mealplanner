import { Recipe, RecipeIngredient } from '../dao/models';

export default defineEventHandler(async (event) => {
    const userId = event.context.userId;
    const query = getQuery(event);
    const id = query.id;
    if (id) {
      return await Recipe.findOne({
        where: { id: Number(id), userId },
        include: [
          {
            model: RecipeIngredient,
            attributes: ['name'],
            order: [['name', 'ASC']]
          }
        ]
      });
    }
    return await Recipe.findAll({
      where: { userId },
      include: [
        {
          model: RecipeIngredient,
          attributes: ['name'],
          order: [['name', 'ASC']]
        }
      ],
      order: [['name', 'ASC']]
    });
  })
  