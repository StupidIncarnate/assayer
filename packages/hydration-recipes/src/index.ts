/**
 * PURPOSE: The starter surface for this `hydration-recipes` package — the three names
 * `recipesConventionStatics.exports` requires (`@dungeonmaster/shared/statics`), so
 * `dungeonmaster siegelense recipes` answers with an empty listing the moment this package is
 * built, instead of throwing `RecipesBuildMissingError`. Add a recipe under a sibling
 * `src/recipes-<name>/` folder and wire it into `StartHydrationRecipes.listing`'s return array
 * and `StartHydrationRecipes.seed`'s dispatch.
 *
 * USAGE:
 * RecipesListingResponder();
 * // Returns []
 */

import { StartHydrationRecipes } from './startup/start-hydration-recipes';

export const RecipesListingResponder = (): ReturnType<typeof StartHydrationRecipes.listing> =>
  StartHydrationRecipes.listing();

export const RecipesSeedResponder = (
  { ...params }: Parameters<typeof StartHydrationRecipes.seed>[0],
): ReturnType<typeof StartHydrationRecipes.seed> => StartHydrationRecipes.seed(params);

export const recipesManifest: readonly never[] = [];
