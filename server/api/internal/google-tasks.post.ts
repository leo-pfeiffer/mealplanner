import { google } from 'googleapis';
import { useGemini } from '~/composables/useGemini';
import { groupedIngredients } from './email.utils';
import { getTokenFromEvent } from '../../utils/session';
import { getAuthenticatedClient } from '../../utils/googleAuth';

function buildPlainTextContent(mealplan: any, classifiedList: string | null, allIngredients: string[]): string {
    let text = `=== ${mealplan.name} ===\n\n`;

    text += `Recipes:\n`;
    for (const mealplanRecipe of mealplan.mealplan_recipes) {
        text += `${mealplanRecipe.name}\n`;
        for (const ingredient of mealplanRecipe.recipe_ingredients) {
            text += `  - ${ingredient.name}\n`;
        }
        text += '\n';
    }

    if (mealplan.mealplan_ingredients.length > 0) {
        text += `Extra ingredients:\n`;
        for (const ingredient of mealplan.mealplan_ingredients) {
            text += `  - ${ingredient.name}\n`;
        }
        text += '\n';
    }

    text += `Shopping list:\n`;
    if (classifiedList) {
        text += classifiedList;
    } else {
        for (const [ingredient, count] of groupedIngredients(allIngredients)) {
            text += `  ${count}x ${ingredient}\n`;
        }
    }

    return text.trimEnd();
}

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

    let classifiedList: string | null = null;
    try {
        const classifyPrompt = 'Classify this shopping list by where in the supermarket I would find the respective item.\n'
            + 'Do not add or remove any items from the list. If there are duplicates in the list, add up the quantities into a single item.\n'
            + 'You should use the following supermarket sections: Produce, Meat/Seafood, Dairy, Pantry, Baker, Frozen.\n'
            + 'If an item does not fit into any of these sections, you can add additional sections.\n'
            + 'Format the output as plain text only — no HTML, no markdown, no backticks.\n'
            + 'Add a section header on its own line followed by the items indented with "  - ".\n'
            + 'Here is the list: ' + allIngredients.join(', ');
        classifiedList = await useGemini().generate(classifyPrompt);
    } catch (error) {
        console.error('Gemini classification failed, using fallback:', error);
    }

    const notes = buildPlainTextContent(mealplan, classifiedList, allIngredients);

    const authClient = await getAuthenticatedClient(userId);
    const tasks = google.tasks({ version: 'v1', auth: authClient });

    const existingTasks = await tasks.tasks.list({ tasklist: '@default', showDeleted: false });
    const match = existingTasks.data.items?.find(t => t.title === mealplan.name);

    if (match?.id) {
        await tasks.tasks.update({
            tasklist: '@default',
            task: match.id,
            requestBody: { id: match.id, title: mealplan.name, notes },
        });
    } else {
        await tasks.tasks.insert({
            tasklist: '@default',
            requestBody: { title: mealplan.name, notes },
        });
    }

    return { status: 200, body: { message: 'Task created in Google Tasks' } };
});
