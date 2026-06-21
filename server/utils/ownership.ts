import { createError } from 'h3';
import type { Model, ModelStatic } from 'sequelize';

export async function assertOwnedByUser<M extends Model & { userId: number }>(
    model: ModelStatic<M>,
    id: number,
    userId: number
): Promise<M> {
    const row = await model.findByPk(id);
    if (!row) {
        throw createError({ statusCode: 404, statusMessage: 'Not found' });
    }
    if (row.userId !== userId) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }
    return row;
}
