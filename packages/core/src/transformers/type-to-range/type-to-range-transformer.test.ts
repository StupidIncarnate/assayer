import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { typeToRangeTransformer } from './type-to-range-transformer';

describe('typeToRangeTransformer', () => {
  describe('length predicates', () => {
    it('VALID: {string, length-eq-zero} => empty vs non-empty', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-eq-zero' });

      expect(result).toStrictEqual({ satisfying: [''], violating: ['a'] });
    });
  });

  describe('equality predicates', () => {
    it('VALID: {union, eq "a"} => the member vs the rest of the union', () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            TypeDescriptorStub({ kind: 'literal', value: 'a' }),
            TypeDescriptorStub({ kind: 'literal', value: 'b' }),
            TypeDescriptorStub({ kind: 'literal', value: 'c' }),
          ],
        }),
        predicateKind: 'eq',
        literal: 'a',
      });

      expect(result).toStrictEqual({ satisfying: ['a'], violating: ['b', 'c'] });
    });
  });

  describe('numeric predicates', () => {
    it('VALID: {number, gt 5} => boundary representatives', () => {
      const result = typeToRangeTransformer({ type: { kind: 'number' }, predicateKind: 'gt', literal: 5 });

      expect(result).toStrictEqual({ satisfying: [6], violating: [5] });
    });
  });

  describe('unrecognized predicates', () => {
    it('VALID: {string, unrecognized} => a single representative on each arm', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'unrecognized' });

      expect(result).toStrictEqual({ satisfying: ['a'], violating: ['a'] });
    });
  });
});
