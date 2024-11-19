import { Ingredient } from '../dao/models';

export default defineEventHandler(async (event) => {;
  const body = await readBody(event);
  return await Ingredient.update({name: String(body.name)}, {where: {id: Number(body.id)}})
})
  