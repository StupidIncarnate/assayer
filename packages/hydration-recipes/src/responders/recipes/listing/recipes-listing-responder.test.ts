import { RecipesListingResponder } from './recipes-listing-responder';
import { RecipesListingResponderProxy } from './recipes-listing-responder.proxy';

describe('RecipesListingResponder', () => {
  it('VALID: {} => returns an empty array', () => {
    RecipesListingResponderProxy();

    expect(RecipesListingResponder()).toStrictEqual([]);
  });
});
