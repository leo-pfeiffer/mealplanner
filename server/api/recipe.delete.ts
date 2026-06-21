import { Recipe } from '../dao/models';

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  const query = getQuery(event);
  const id = query.id;
  return await Recipe.destroy({where: {id: Number(id), userId}})
})
  