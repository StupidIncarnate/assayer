import { PredicateStub, RepresentativeValueStub } from '@assayer/shared/contracts';

import { predicateTransformer } from './predicate-transformer';

describe('predicateTransformer', () => {
  describe('length comparisons', () => {
    it('VALID: {=== 0 on .length} => length-eq carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 0 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-eq', literal: 0 }));
    });

    it('VALID: {> 0 on .length} => length-gt carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 0 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gt', literal: 0 }));
    });

    it('VALID: {!== 0 on .length} => length-neq carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'ExclamationEqualsEqualsToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 0 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-neq', literal: 0 }));
    });

    // Zero is not a special case, and this is the assertion that says so. A threshold of 2 classifies
    // exactly as a threshold of 0 does — before, anything but zero fell out as `unrecognized` and the
    // domain engine was handed nothing to intersect.
    it('VALID: {>= 2 on .length} => length-gte, since a non-zero threshold is not a special case', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanEqualsToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 2 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gte', literal: 2 }));
    });

    it('VALID: {<= 5 on .length} => length-lte', () => {
      expect(
        predicateTransformer({
          opKind: 'LessThanEqualsToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 5 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-lte', literal: 5 }));
    });

    it('VALID: {< 1 on .length} => length-lt', () => {
      expect(
        predicateTransformer({
          opKind: 'LessThanToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 1 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-lt', literal: 1 }));
    });

    // A length is a number, so a string threshold is not an orderable bound. Classifying it anyway
    // would hand the domain engine a limit it cannot compare against.
    it("EDGE: {.length === 'a'} => unrecognized, since a length threshold must be numeric", () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 'a' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('EDGE: {.length compared to a non-literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });
  });

  describe('literal comparisons', () => {
    it('VALID: {=== "open"} => eq carrying the literal', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'open' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'eq', literal: 'open' }));
    });

    it('VALID: {> 5} => gt carrying the numeric literal', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 5 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'gt', literal: 5 }));
    });

    it('VALID: {comparison with no literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('VALID: {unrecognized operator with a literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'PlusToken',
          isLengthAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'open' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });
  });
});
