import { arrayCardinalityStatics } from './array-cardinality-statics';

describe('arrayCardinalityStatics', () => {
  // `empty` leads so the empty array is the salient must-run representative for a branchless array; `one`
  // and `many` follow as the grayed breadth. `max` is not in the fan-out.
  it('VALID: {order} => empty leads, then one, then many', () => {
    expect(arrayCardinalityStatics.order).toStrictEqual(['empty', 'one', 'many']);
  });

  it('VALID: {counts} => empty is 0, one is 1, many is 2', () => {
    expect(arrayCardinalityStatics.counts).toStrictEqual({ empty: 0, one: 1, many: 2 });
  });
});
