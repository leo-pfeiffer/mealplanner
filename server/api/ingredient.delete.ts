import { Ingredient } from '../dao/models';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id;
  return await Ingredient.destroy({where: {id: Number(id)}})
})
  