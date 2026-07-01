export const buildClassifyPrompt = (ingredients: string[]): string => {
  return 'Classify this shopping list by where in the supermarket I would find the respective item.\n'
    + 'Do not add or remove any items from the list. If there are duplicates, combine them into a single entry (do not include counts/quantities in the item text).\n'
    + 'Use these supermarket sections as keys: Produce, Meat/Seafood, Dairy, Pantry, Bakery, Frozen. Add additional section keys if an item does not fit into any of these.\n'
    + 'Respond with ONLY a single JSON object — no markdown, no backticks, no commentary before or after.\n'
    + 'Keys are section names (strings); each value is an array of ingredient name strings belonging to that section.\n'
    + 'Example shape: {"Produce": ["Apples", "Carrots"], "Dairy": ["Milk"]}\n'
    + 'Here is the list: ' + ingredients.join(', ');
};

export const buildRepairPrompt = (brokenResponse: string): string => {
  return 'The following text was supposed to be a single JSON object whose keys are supermarket section names '
    + 'and whose values are arrays of ingredient name strings (example shape: {"Produce": ["Apples", "Carrots"], "Dairy": ["Milk"]}), '
    + 'but it is not valid JSON in that shape.\n'
    + 'Fix it and respond with ONLY the corrected JSON object — no markdown, no backticks, no commentary before or after.\n'
    + 'Here is the text to fix: ' + brokenResponse;
};

export const isValidClassifiedIngredients = (value: unknown): value is Record<string, string[]> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return false;
  }

  return entries.every(([key, items]) => {
    if (key.trim().length === 0) {
      return false;
    }
    if (!Array.isArray(items) || items.length === 0) {
      return false;
    }
    return items.every((item) => typeof item === 'string' && item.trim().length > 0);
  });
};

export const parseClassifiedIngredients = (raw: string): Record<string, string[]> | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  return isValidClassifiedIngredients(parsed) ? parsed : null;
};

export const buildTasklistTitle = (mealplanName: string, now: Date = new Date()): string => {
  return `${mealplanName} - ${now.toISOString()}`;
};
