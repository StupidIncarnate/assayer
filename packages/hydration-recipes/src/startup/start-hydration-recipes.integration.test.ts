import { StartHydrationRecipes } from './start-hydration-recipes';

describe('StartHydrationRecipes', () => {
  it('VALID: {} => listing returns an empty array', () => {
    expect(StartHydrationRecipes.listing()).toStrictEqual([]);
  });

  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    expect(() => StartHydrationRecipes.seed({})).toThrow(/no recipes defined yet/u);
  });
});
