import { PredicateStub } from '@assayer/shared/contracts/predicate/predicate.stub';
import { RepresentativeValueStub } from '@assayer/shared/contracts/representative-value/representative-value.stub';

import { predicateTransformer } from './predicate-transformer';

describe('predicateTransformer', () => {
  describe('length comparisons', () => {
    it('VALID: {=== 0 on .length} => length-eq carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 0 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-eq', literal: 0 }));
    });

    it('VALID: {> 0 on .length} => length-gt carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: true,
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 0 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gt', literal: 0 }));
    });

    it('VALID: {!== 0 on .length} => length-neq carrying the threshold', () => {
      expect(
        predicateTransformer({
          opKind: 'ExclamationEqualsEqualsToken',
          isLengthAccess: true,
          isTypeofAccess: false,
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
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 2 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gte', literal: 2 }));
    });

    it('VALID: {<= 5 on .length} => length-lte', () => {
      expect(
        predicateTransformer({
          opKind: 'LessThanEqualsToken',
          isLengthAccess: true,
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 5 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-lte', literal: 5 }));
    });

    it('VALID: {< 1 on .length} => length-lt', () => {
      expect(
        predicateTransformer({
          opKind: 'LessThanToken',
          isLengthAccess: true,
          isTypeofAccess: false,
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
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'a' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('EDGE: {.length compared to a non-literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          isTypeofAccess: false,
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
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'open' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'eq', literal: 'open' }));
    });

    it('VALID: {> 5} => gt carrying the numeric literal', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: false,
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 5 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'gt', literal: 5 }));
    });

    it('VALID: {comparison with no literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          isTypeofAccess: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('VALID: {unrecognized operator with a literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'PlusToken',
          isLengthAccess: false,
          isTypeofAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'open' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });
  });

  describe('typeof comparisons', () => {
    it("VALID: {typeof x === 'string'} => typeof-eq carrying the tag", () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          isTypeofAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 'string' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'typeof-eq', literal: 'string' }));
    });

    it("VALID: {typeof x !== 'string'} => typeof-neq carrying the tag", () => {
      expect(
        predicateTransformer({
          opKind: 'ExclamationEqualsEqualsToken',
          isLengthAccess: false,
          isTypeofAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 'string' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'typeof-neq', literal: 'string' }));
    });

    // `typeof` never produces a number, so a numeric right-hand side names no real tag. Classifying it
    // anyway would hand the domain engine a tag no member could ever carry.
    it('EDGE: {typeof x === 3} => unrecognized, since a typeof tag must be a string', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          isTypeofAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 3 }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    // `>`/`<` over a runtime tag names no domain this engine can order — only `===`/`!==` carry a
    // typeof comparison's meaning.
    it("EDGE: {typeof x > 'string'} => unrecognized, since only eq/neq name a typeof comparison", () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: false,
          isTypeofAccess: true,
          rightLiteral: RepresentativeValueStub({ value: 'string' }),
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('EDGE: {typeof x compared to a non-literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          isTypeofAccess: true,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });
  });
});
