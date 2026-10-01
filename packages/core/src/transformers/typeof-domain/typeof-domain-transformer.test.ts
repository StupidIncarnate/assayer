import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

import { typeofDomainTransformer } from './typeof-domain-transformer';

describe('typeofDomainTransformer', () => {
  describe('a union of scalar members', () => {
    const TYPE = TypeDescriptorStub({ kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] });

    it("VALID: {string|number, tag 'string', wantMatch: true} => the string member's representative", () => {
      expect(typeofDomainTransformer({ type: TYPE, tag: 'string', wantMatch: true })).toStrictEqual({ members: ['abc123'] });
    });

    it("VALID: {string|number, tag 'string', wantMatch: false} => the number member's representative", () => {
      expect(typeofDomainTransformer({ type: TYPE, tag: 'string', wantMatch: false })).toStrictEqual({ members: [7] });
    });
  });

  describe('a union with a non-scalar matching member', () => {
    const TYPE = TypeDescriptorStub({
      kind: 'union',
      members: [{ kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] }, { kind: 'string' }],
    });

    // The object member DOES belong to the non-matching side (its tag is 'object', not 'string'), but
    // this engine cannot name a scalar point inside it — so the side stays unconstrained rather than
    // falsely reporting nothing satisfies it.
    it("EMPTY: {Plain|string, tag 'string', wantMatch: false} => unconstrained, since the object member has no scalar point", () => {
      expect(typeofDomainTransformer({ type: TYPE, tag: 'string', wantMatch: false })).toStrictEqual({});
    });

    it("VALID: {Plain|string, tag 'string', wantMatch: true} => the string member's representative", () => {
      expect(typeofDomainTransformer({ type: TYPE, tag: 'string', wantMatch: true })).toStrictEqual({ members: ['abc123'] });
    });
  });

  describe('a non-union type, treated as one member of itself', () => {
    // Every value of a bare `string` type carries the 'string' tag, so the non-matching side is a
    // genuine impossibility — not merely unconstrained.
    it("EMPTY: {string, tag 'string', wantMatch: false} => a genuine empty domain, since every value matches the other side", () => {
      expect(typeofDomainTransformer({ type: { kind: 'string' }, tag: 'string', wantMatch: false })).toStrictEqual({ members: [] });
    });

    it("VALID: {string, tag 'string', wantMatch: true} => the representative point", () => {
      expect(typeofDomainTransformer({ type: { kind: 'string' }, tag: 'string', wantMatch: true })).toStrictEqual({ members: ['abc123'] });
    });
  });

  describe('a type this engine cannot read a tag for at all', () => {
    // Nothing about the type is determinate, so the non-matching side is UNKNOWN, never a false
    // "impossible" — the same safety property an unrecognized predicate relies on.
    it("EMPTY: {unknown, tag 'string', wantMatch: false} => unconstrained, never impossible", () => {
      expect(
        typeofDomainTransformer({ type: TypeDescriptorStub({ kind: 'unknown', text: 'Map<string, number>' }), tag: 'string', wantMatch: false }),
      ).toStrictEqual({});
    });
  });
});
