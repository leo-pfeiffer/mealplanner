export const cleanIngredientName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
};
