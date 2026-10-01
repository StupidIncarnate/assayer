import { RecipesListingResponder, RecipesSeedResponder, recipesManifest } from './index';

describe('hydration-recipes starter index', () => {
  it('VALID: {} => RecipesListingResponder returns an empty array', () => {
    expect(RecipesListingResponder()).toStrictEqual([]);
  });

  it('VALID: {} => recipesManifest is an empty array', () => {
    expect(recipesManifest).toStrictEqual([]);
  });

  it('ERROR: {seed request} => RecipesSeedResponder throws naming where to add a recipe', () => {
    expect(() => RecipesSeedResponder({})).toThrow(/no recipes defined yet/u);
  });
});
