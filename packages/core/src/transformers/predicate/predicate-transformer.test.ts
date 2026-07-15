import { PredicateStub, RepresentativeValueStub } from '@assayer/shared/contracts';

import { predicateTransformer } from './predicate-transformer';

describe('predicateTransformer', () => {
  describe('length comparisons', () => {
    it('VALID: {=== 0 on .length} => length-eq-zero', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          rightIsZero: true,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-eq-zero' }));
    });

    it('VALID: {> 0 on .length} => length-gt-zero', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: true,
          rightIsZero: true,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gt-zero' }));
    });

    it('VALID: {!== 0 on .length} => length-gt-zero', () => {
      expect(
        predicateTransformer({
          opKind: 'ExclamationEqualsEqualsToken',
          isLengthAccess: true,
          rightIsZero: true,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'length-gt-zero' }));
    });

    it('VALID: {.length compared to non-zero} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: true,
          rightIsZero: false,
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
          rightIsZero: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'eq', literal: 'open' }));
    });

    it('VALID: {> 5} => gt carrying the numeric literal', () => {
      expect(
        predicateTransformer({
          opKind: 'GreaterThanToken',
          isLengthAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 5 }),
          rightIsZero: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'gt', literal: 5 }));
    });

    it('VALID: {comparison with no literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'EqualsEqualsEqualsToken',
          isLengthAccess: false,
          rightIsZero: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });

    it('VALID: {unrecognized operator with a literal} => unrecognized', () => {
      expect(
        predicateTransformer({
          opKind: 'PlusToken',
          isLengthAccess: false,
          rightLiteral: RepresentativeValueStub({ value: 'open' }),
          rightIsZero: false,
        }),
      ).toStrictEqual(PredicateStub({ kind: 'unrecognized' }));
    });
  });
});
