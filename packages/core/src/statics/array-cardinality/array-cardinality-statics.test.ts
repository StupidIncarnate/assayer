import { arrayCardinalityStatics } from './array-cardinality-statics';

describe('arrayCardinalityStatics', () => {
  // `one` leads so the ordinary non-empty array is the salient must-run representative; `empty` and
  // `many` follow as the grayed breadth. `max` is not in the fan-out.
  it('VALID: {order} => one leads, then empty, then many', () => {
    expect(arrayCardinalityStatics.order).toStrictEqual(['one', 'empty', 'many']);
  });

  it('VALID: {counts} => empty is 0, one is 1, many is 2', () => {
    expect(arrayCardinalityStatics.counts).toStrictEqual({ empty: 0, one: 1, many: 2 });
  });
});
