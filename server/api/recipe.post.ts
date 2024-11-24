import { Recipe } from '../dao/models';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const updateId = Number(body.id);
    if (!updateId) {
        return { status: 400, body: {status: 'Bad Request'} };
    }

    let updateData = {};
    if (body.name) {
        updateData = {...updateData, name: String(body.name)};
    }
    if (body.note) {
        updateData = {...updateData, note: String(body.note)};
    }

    return await Recipe.update(
      updateData, 
      {
        where: {id: Number(body.id)}
      }
    )
  }    
)
  