import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { arrayArrangeTransformer } from './array-arrange-transformer';

describe('arrayArrangeTransformer', () => {
  it('VALID: {element: number, count: 0} => the empty array', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 0 })).toStrictEqual([]);
  });

  it('VALID: {element: number, count: 1} => a one-element array of the number representative', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 1 })).toStrictEqual([7]);
  });

  it('VALID: {element: number, count: 2} => a two-element array with distinct elements', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'number' }), count: 2 })).toStrictEqual([7, 8]);
  });

  it('VALID: {element: string, count: 1} => the string representative per element', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'string' }), count: 1 })).toStrictEqual([
      'abc123',
    ]);
  });

  it('VALID: {element: string, count: 2} => distinct string values per position', () => {
    expect(arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'string' }), count: 2 })).toStrictEqual([
      'abc123',
      'abc123_1',
    ]);
  });

  // A nested array element arranges as a REAL nested array — its own element at the `one` cardinality —
  // so number[][] fills as [[7]] rather than a scalar placeholder.
  it('VALID: {element: array, count: 1} => a real nested array [[7]]', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }), count: 1 }),
    ).toStrictEqual([[7]]);
  });

  it('VALID: {element: array, count: 2} => two nested arrays [[7], [8]]', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'array', element: { kind: 'number' } }), count: 2 }),
    ).toStrictEqual([[7], [8]]);
  });

  // An OBJECT element is built out too, so `Config[]` is a real array of real objects rather than an
  // array of placeholders.
  it('VALID: {element: object, count: 1} => a real array of real objects', () => {
    expect(
      arrayArrangeTransformer({
        element: TypeDescriptorStub({ kind: 'object', typeName: 'Db', properties: [{ name: 'host', type: { kind: 'string' } }] }),
        count: 1,
      }),
    ).toStrictEqual([{ host: 'abc123' }]);
  });

  // The element type is what decides, so a callback list is refused at every count — including the
  // empty one, because the caller is asking about the parameter and the answer does not vary by size.
  it('INVALID: {element: callable, count: 1} => undefined', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'callable', text: '() => void' }), count: 1 }),
    ).toBe(undefined);
  });

  it('INVALID: {element: callable, count: 0} => undefined, not the empty array', () => {
    expect(
      arrayArrangeTransformer({ element: TypeDescriptorStub({ kind: 'callable', text: '() => void' }), count: 0 }),
    ).toBe(undefined);
  });

  // A TRUNCATED element is the reader stopping on a self-reference, and the empty array is the only
  // complete value of it — at every count, since there is no element to repeat.
  it('VALID: {element: the truncated re-entry, count: 1} => the empty array', () => {
    expect(
      arrayArrangeTransformer({
        element: TypeDescriptorStub({ kind: 'object', typeName: 'TreeNode', truncated: true, properties: [] }),
        count: 1,
      }),
    ).toStrictEqual([]);
  });

  it('VALID: {element: the truncated re-entry, count: 2} => the empty array too', () => {
    expect(
      arrayArrangeTransformer({
        element: TypeDescriptorStub({ kind: 'object', typeName: 'TreeNode', truncated: true, properties: [] }),
        count: 2,
      }),
    ).toStrictEqual([]);
  });
});
