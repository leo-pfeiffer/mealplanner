import { Ingredient } from '../dao/models';

export default defineEventHandler(async (event) => {;
    return await Ingredient.findAll(
      {
        attributes: ['id', 'name'], 
        order: [['name', 'ASC']],
      },
    );
  })
  