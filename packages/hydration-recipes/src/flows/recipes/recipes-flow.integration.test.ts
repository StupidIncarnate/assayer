import { RecipesFlow } from './recipes-flow';

describe('RecipesFlow', () => {
  it('VALID: {} => listing returns an empty array', () => {
    expect(RecipesFlow.listing()).toStrictEqual([]);
  });

  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    expect(() => RecipesFlow.seed({})).toThrow(/no recipes defined yet/u);
  });
});
