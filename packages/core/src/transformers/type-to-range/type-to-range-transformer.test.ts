import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

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

    // `x === null`: the literal is exactly `null`, which is a value, not an absence. `null ?? rep` would
    // treat it as nullish and fall through to the type's representative value, wrongly claiming `x ===
    // null` is satisfied by 'abc123'. The satisfying member must be `null` itself.
    it('VALID: {string, eq null} => the satisfying member is null, never the representative value', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'eq', literal: null });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: [null] }),
        violating: ValueDomainStub({ excluded: [null] }),
      });
    });

    // The neq twin of the case above: null moves to the violating arm, and satisfying excludes it.
    it('VALID: {string, neq null} => the violating member is null, the satisfying arm excludes it', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'neq', literal: null });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ excluded: [null] }),
        violating: ValueDomainStub({ members: [null] }),
      });
    });

    // The ABSENT literal (no comparison value supplied at all) must stay distinguishable from an
    // explicit `null` literal — the two never conflate, so this falls back to the representative value
    // exactly as it did before `null` was a possibility, never to `null` itself.
    it('EMPTY: {string, eq with no literal} => falls back to the representative value, not to null', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'eq' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['abc123'] }),
        violating: ValueDomainStub({ excluded: ['abc123'] }),
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

  describe('truthy and falsy predicates', () => {
    // A truthy string's non-empty member is the representative value, not a single letter — the same
    // 'abc123' every unconstrained string fills. It reads clearly and never collides with the empty
    // string it is the negation of.
    it('VALID: {string, truthy} => the representative value satisfies, the empty string violates', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'truthy' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['abc123'] }),
        violating: ValueDomainStub({ members: [''] }),
      });
    });

    it('VALID: {string, falsy} => the empty string satisfies, the representative value violates', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'falsy' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: [''] }),
        violating: ValueDomainStub({ members: ['abc123'] }),
      });
    });

    // A union with a falsy point reads like a lone number: an exclusion on the truthy side, the points
    // on the falsy side. A sampled truthy side would intersect a welded constant to nothing.
    it('VALID: {undefined | number, truthy} => everything but 0 satisfies, 0 violates', () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] }),
        predicateKind: 'truthy',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ excluded: [0] }),
        violating: ValueDomainStub({ members: [0] }),
      });
    });

    it('VALID: {undefined | false | true, truthy} => everything but false satisfies, false violates', () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'unknown', text: 'undefined' },
            { kind: 'literal', value: false },
            { kind: 'literal', value: true },
          ],
        }),
        predicateKind: 'truthy',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ excluded: [false] }),
        violating: ValueDomainStub({ members: [false] }),
      });
    });

    it("VALID: {string | number, falsy} => '' and 0 satisfy, everything else violates", () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
        predicateKind: 'falsy',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['', 0] }),
        violating: ValueDomainStub({ excluded: ['', 0] }),
      });
    });

    it("VALID: {'a' | 'b', truthy} => a union with no falsy point keeps the representative reading", () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [
            { kind: 'literal', value: 'a' },
            { kind: 'literal', value: 'b' },
          ],
        }),
        predicateKind: 'truthy',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['a'] }),
        violating: ValueDomainStub({ members: [''] }),
      });
    });
  });

  describe('non-nullish predicate', () => {
    // The `??` operand: satisfying is every value but null, violating is null. Null is the value the
    // fall-through arm needs, and it is drawn from the declared type, never from running the code. The
    // satisfying side is an exclusion rather than a sample, so a truthiness read of the same operand
    // (`a ?? b` used as a condition) can still intersect it with `{0}`.
    it('VALID: {string, non-nullish} => everything but null satisfies, null violates', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'non-nullish' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ excluded: [null] }),
        violating: ValueDomainStub({ members: [null] }),
      });
    });

    // A type with no scalar point still violates non-nullishness on exactly `null` — nullish-ness is a
    // fact about the VALUE, not about the operand's own type, so an object/array/callable/unknown
    // operand's else arm needs `null` from this engine exactly as a string-typed one does. Only the
    // satisfying side has nothing to NAME (the fill seam builds the real non-null shape; this engine
    // narrows nothing there), never the violating one — narrowing the violating side to `{}` here would
    // be the G1 `??`-discards-a-legitimate-`null` mistake (`plan/open-defects.md`) one operand kind over.
    it.each([
      ['object', TypeDescriptorStub({ kind: 'object', properties: [] })],
      ['array', TypeDescriptorStub({ kind: 'array', element: { kind: 'string' } })],
      ['callable', TypeDescriptorStub({ kind: 'callable', text: '() => void' })],
      ['unknown', TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' })],
    ] as const)('VALID: {%s, non-nullish} => nothing satisfies by name, but null still violates', (_label, type) => {
      const result = typeToRangeTransformer({ type, predicateKind: 'non-nullish' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub(),
        violating: ValueDomainStub({ members: [null] }),
      });
    });
  });

  describe('typeof predicates', () => {
    // Every member has a scalar point, so both sides realize a real value — the case that actually
    // steers a branch.
    it("VALID: {string|number, typeof-eq 'string'} => the string member's point vs the number member's", () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
        predicateKind: 'typeof-eq',
        literal: 'string',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['abc123'] }),
        violating: ValueDomainStub({ members: [7] }),
      });
    });

    it("VALID: {string|number, typeof-neq 'string'} => the exact mirror of typeof-eq", () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] }),
        predicateKind: 'typeof-neq',
        literal: 'string',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: [7] }),
        violating: ValueDomainStub({ members: ['abc123'] }),
      });
    });

    // The `Plain` member IS on the non-matching side, but it has no scalar point this engine can name —
    // so that side constrains nothing rather than falsely claiming no value satisfies it.
    it("VALID: {Plain|string, typeof-eq 'string'} => the string member's point vs an unconstrained domain", () => {
      const result = typeToRangeTransformer({
        type: TypeDescriptorStub({
          kind: 'union',
          members: [{ kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] }, { kind: 'string' }],
        }),
        predicateKind: 'typeof-eq',
        literal: 'string',
      });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['abc123'] }),
        violating: ValueDomainStub(),
      });
    });

    // A bare, non-union type is one member of itself: every value shares its one tag, so the
    // non-matching side is a genuine impossibility, not merely unconstrained.
    it("VALID: {string, typeof-eq 'string'} => the representative point vs a genuine empty domain", () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'typeof-eq', literal: 'string' });

      expect(result).toStrictEqual({
        satisfying: ValueDomainStub({ members: ['abc123'] }),
        violating: ValueDomainStub({ members: [] }),
      });
    });

    // A non-string literal names no real typeof tag at all — `typeof` never produces one — so both
    // arms stay open rather than being narrowed by a tag nothing could ever carry.
    it('VALID: {typeof-eq with a non-string literal} => neither arm constrains anything', () => {
      const result = typeToRangeTransformer({ type: { kind: 'string' }, predicateKind: 'typeof-eq', literal: 3 });

      expect(result).toStrictEqual({ satisfying: ValueDomainStub(), violating: ValueDomainStub() });
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
