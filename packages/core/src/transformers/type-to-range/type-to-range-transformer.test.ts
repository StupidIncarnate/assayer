import { TypeDescriptorStub } from '@assayer/shared/contracts';

import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { typeToRangeTransformer } from './type-to-range-transformer';

describe('typeToRangeTransformer', () => {
  describe('length predicates', () => {
    // A length comparison lands on the LENGTH axis, never on the value axis. `min: 0` would claim the
    // string itself is ordered against zero, which the source never said.
    it('VALID: {string, length-eq 0} => a length pinned to zero vs a length that is not zero', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-eq', literal: 0 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthMin: 0, lengthMax: 0 }),
        violating: ValueDomainStub({ lengthExcluded: [0] }),
      });
    });

    it('VALID: {string, length-gt 0} => an exclusive lower length bound vs an inclusive upper one', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-gt', literal: 0 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthMin: 0, lengthMinExclusive: true }),
        violating: ValueDomainStub({ lengthMax: 0 }),
      });
    });

    it('VALID: {string, length-neq 0} => a ruled-out length vs a length pinned to it', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-neq', literal: 0 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthExcluded: [0] }),
        violating: ValueDomainStub({ lengthMin: 0, lengthMax: 0 }),
      });
    });

    // Kept as a BOUND rather than realized into a string of that length. Realizing it here would be
    // sampling, and a second length guard would then intersect against one string instead of a bound —
    // the exact failure the domain model exists to remove.
    it('VALID: {string, length-gte 2} => an inclusive lower length bound, not a two-character sample', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-gte', literal: 2 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthMin: 2 }),
        violating: ValueDomainStub({ lengthMax: 2, lengthMaxExclusive: true }),
      });
    });

    it('VALID: {string, length-lte 5} => an inclusive upper length bound vs an exclusive lower one', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-lte', literal: 5 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthMax: 5 }),
        violating: ValueDomainStub({ lengthMin: 5, lengthMinExclusive: true }),
      });
    });

    it('VALID: {string, length-lt 1} => an exclusive upper length bound vs an inclusive lower one', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'length-lt', literal: 1 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ lengthMax: 1, lengthMaxExclusive: true }),
        violating: ValueDomainStub({ lengthMin: 1 }),
      });
    });
  });

  describe('equality predicates', () => {
    // A union ENUMERATES its values, so "not 'a'" is the closed set of the rest — which is what fans
    // out one case per remaining member. Only an enumerated type can answer this way.
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

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['a'] }),
        violating: ValueDomainStub({ members: ['b', 'c'] }),
      });
    });

    // An OPEN type cannot name the others, so "not 5" is the whole domain minus a point. Sampling it
    // as a single stand-in value is what let a later `> 10` on the same operand intersect to nothing
    // and report a reachable exit as dead.
    it('VALID: {number, eq 5} => the member vs an exclusion, never a stand-in sample', () => {
      const result = typeToRangeTransformer({ type: { kind: 'number' }, predicateKind: 'eq', literal: 5 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: [5] }),
        violating: ValueDomainStub({ excluded: [5] }),
      });
    });
  });

  describe('numeric predicates', () => {
    // A comparison states a BOUND. Keeping it as a bound rather than a boundary sample is what lets
    // two guards on one operand be intersected before any value is chosen.
    it('VALID: {number, gt 5} => an exclusive lower bound vs an inclusive upper one', () => {
      const result = typeToRangeTransformer({ type: { kind: 'number' }, predicateKind: 'gt', literal: 5 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ min: 5, minExclusive: true }),
        violating: ValueDomainStub({ max: 5 }),
      });
    });

    it('VALID: {number, lte 100} => an inclusive upper bound vs an exclusive lower one', () => {
      const result = typeToRangeTransformer({ type: { kind: 'number' }, predicateKind: 'lte', literal: 100 });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ max: 100 }),
        violating: ValueDomainStub({ min: 100, minExclusive: true }),
      });
    });
  });

  describe('unrecognized predicates', () => {
    // Both arms OPEN, and this is a safety property rather than a default. A predicate the analyzer
    // could not read must be incapable of narrowing anything — otherwise an unread guard could make a
    // perfectly reachable exit look impossible, and the reader would be told to delete working code.
    it('VALID: {string, unrecognized} => neither arm constrains anything', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'unrecognized' });

      expect(result).toStrictEqual({ satisfying: ValueDomainStub(), violating: ValueDomainStub() });
    });
  });
});
