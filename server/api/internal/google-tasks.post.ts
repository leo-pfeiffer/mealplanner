import { google } from 'googleapis';
import { useGemini } from '~/composables/useGemini';
import { groupedIngredients } from './email.utils';
import { buildClassifyPrompt, buildRepairPrompt, parseClassifiedIngredients, buildTasklistTitle } from './google-tasks.utils';
import { getTokenFromEvent } from '../../utils/session';
import { getAuthenticatedClient } from '../../utils/googleAuth';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    if (!query.mealplanId) {
        throw createError({ statusCode: 400, statusMessage: 'Missing mealplanId' });
    }

    const token = getTokenFromEvent(event);
    if (!token) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const userId = event.context.userId as number;

    const config = useRuntimeConfig();
    const mealplan = await fetch(
        `${config.public.appURL}/api/mealplan?id=${query.mealplanId}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        },
    ).then(res => res.json());

    if (!mealplan) {
        throw createError({ statusCode: 400, statusMessage: 'Mealplan not found' });
    }

    const allIngredients: string[] = [];
    for (const mealplanRecipe of mealplan.mealplan_recipes) {
        for (const ingredient of mealplanRecipe.recipe_ingredients) {
            allIngredients.push(ingredient.name);
        }
    }
    for (const ingredient of mealplan.mealplan_ingredients) {
        allIngredients.push(ingredient.name);
    }

    let classified: Record<string, string[]> | null = null;
    try {
        const primary = await useGemini().generate(buildClassifyPrompt(allIngredients), { responseMimeType: 'application/json' });
        classified = parseClassifiedIngredients(primary);
        if (!classified) {
            const repaired = await useGemini().generate(buildRepairPrompt(primary), { responseMimeType: 'application/json' });
            classified = parseClassifiedIngredients(repaired);
        }
    } catch (error) {
        console.error('Gemini classification failed, using fallback:', error);
        classified = null;
    }

    const authClient = await getAuthenticatedClient(userId);
    const tasks = google.tasks({ version: 'v1', auth: authClient });

    const title = buildTasklistTitle(mealplan.name);
    const newList = await tasks.tasklists.insert({ requestBody: { title } });
    const tasklistId = newList.data.id!;

    // Display order isn't required, so aisle tasks and their ingredient subtasks are inserted
    // concurrently rather than chained via `previous` — this is the main latency cost otherwise.
    if (classified) {
        await Promise.all(Object.entries(classified).map(async ([aisle, items]) => {
            const aisleTask = await tasks.tasks.insert({
                tasklist: tasklistId,
                requestBody: { title: aisle },
            });
            await Promise.all(items.map(item =>
                tasks.tasks.insert({
                    tasklist: tasklistId,
                    parent: aisleTask.data.id!,
                    requestBody: { title: item },
                })
            ));
        }));
    } else {
        await Promise.all(groupedIngredients(allIngredients).map(([ingredient, count]) =>
            tasks.tasks.insert({
                tasklist: tasklistId,
                requestBody: { title: `${count}x ${ingredient}` },
            })
        ));
    }

    return { status: 200, body: { message: 'Tasklist created in Google Tasks', tasklistId, title } };
});
