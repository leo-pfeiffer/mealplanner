import { Ingredient } from '../dao/models';

export default defineEventHandler(async (event) => {;
  const body = await readBody(event);
  const name = body.name;
    return await Ingredient.findOrCreate({where: {name: name}})
  })
  