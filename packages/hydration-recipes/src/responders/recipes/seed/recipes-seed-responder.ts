/**
 * PURPOSE: Answers a recipe seed request — throws until a real recipe is added under a sibling
 * `src/recipes-<name>/` folder and wired into this responder's own dispatch.
 *
 * USAGE:
 * RecipesSeedResponder({});
 * // Throws: no recipes defined yet
 */

const NO_RECIPES_MESSAGE =
  'no recipes defined yet — add one under packages/hydration-recipes/src/recipes-<name>/';

export const RecipesSeedResponder = ({
  recipeName: _recipeName,
}: Record<string, unknown>): never => {
  throw new Error(NO_RECIPES_MESSAGE);
};
