/**
 * PURPOSE: Application initialization and public API entry point for this package. Wires up
 * recipe flows for listing and seeding.
 *
 * USAGE:
 * import { StartHydrationRecipes } from '<packageName>';
 * const listing = StartHydrationRecipes.listing();
 * StartHydrationRecipes.seed({});
 */

import { RecipesFlow } from '../flows/recipes/recipes-flow';

type ListingResult = ReturnType<typeof RecipesFlow.listing>;
type SeedParams = Parameters<typeof RecipesFlow.seed>[0];
type SeedResult = ReturnType<typeof RecipesFlow.seed>;

export const StartHydrationRecipes = {
  listing: (): ListingResult => RecipesFlow.listing(),

  seed: (params: SeedParams): SeedResult => RecipesFlow.seed(params),
};
