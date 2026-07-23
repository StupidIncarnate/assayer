import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { arrayArrangeTransformer } from './array-arrange-transformer';

describe('arrayArrangeTransformer', () => {
  it('VALID: {element: number, count: 0} => the empty array', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 0 })).toStrictEqual([]);
  });

  it('VALID: {element: number, count: 1} => a one-element array of the number representative', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 1 })).toStrictEqual([7]);
  });

  it('VALID: {element: number, count: 2} => a two-element array, the many class', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 2 })).toStrictEqual([7, 7]);
  });

  it('VALID: {element: string, count: 1} => the string representative per element', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'string' }), count: 1 })).toStrictEqual([
      'abc123',
    ]);
  });

  // A nested array element arranges as a REAL nested array — its own element at the `one` cardinality —
  // so number[][] fills as [[7]] rather than a scalar placeholder.
  it('VALID: {element: array, count: 1} => a real nested array [[7]]', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }), count: 1 }),
    ).toStrictEqual([[7]]);
  });

  it('VALID: {element: array, count: 2} => two nested arrays [[7], [7]]', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }), count: 2 }),
    ).toStrictEqual([[7], [7]]);
  });
});
