export const cleanIngredientName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
};

export const groupedIngredients = (ingredients: string[]): [string, number][] => {
  console.log(ingredients);
  const ingredientMap = new Map<string, number>();
  for (const ingredient of ingredients) {
    const cleanName = cleanIngredientName(ingredient);
    console.log(cleanName, ingredientMap.get(cleanName));
    ingredientMap.set(cleanName, (ingredientMap.get(cleanName) ?? 0) + 1);
  }
  return Array.from(ingredientMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
};
