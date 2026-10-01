import { RecipesSeedResponder } from './recipes-seed-responder';
import { RecipesSeedResponderProxy } from './recipes-seed-responder.proxy';

describe('RecipesSeedResponder', () => {
  it('ERROR: {seed request} => throws naming where to add a recipe', () => {
    RecipesSeedResponderProxy();

    expect(() => RecipesSeedResponder({})).toThrow(/no recipes defined yet/u);
  });
});
