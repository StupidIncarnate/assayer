import { representativeValueContract } from '@assayer/shared/contracts';

import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { isLengthInDomainGuard } from './is-length-in-domain-guard';

describe('isLengthInDomainGuard', () => {
  describe('a length-bounded domain', () => {
    it("VALID: {'aa' in 2 <= length <= 5} => within", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse('aa'),
        domain: ValueDomainStub({ lengthMin: 2, lengthMax: 5 }),
      });

      expect(result).toBe(true);
    });

    it("VALID: {'a' in 2 <= length <= 5} => outside, since it is too short", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ lengthMin: 2, lengthMax: 5 }),
      });

      expect(result).toBe(false);
    });

    it("EDGE: {'' in length < 1} => within, since the bound is exclusive and nothing is shorter", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse(''),
        domain: ValueDomainStub({ lengthMax: 1, lengthMaxExclusive: true }),
      });

      expect(result).toBe(true);
    });

    it("EDGE: {'a' in length > 1} => outside, since the bound is exclusive", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ lengthMin: 1, lengthMinExclusive: true }),
      });

      expect(result).toBe(false);
    });
  });

  describe('ruled-out lengths', () => {
    it("VALID: {'' against length !== 0} => outside", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse(''),
        domain: ValueDomainStub({ lengthExcluded: [0] }),
      });

      expect(result).toBe(false);
    });

    it("VALID: {'a' against length !== 0} => within", () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ lengthExcluded: [0] }),
      });

      expect(result).toBe(true);
    });
  });

  describe('values the length axis cannot speak about', () => {
    // A number has no length, so a length guard holds no opinion on it. Reading "no opinion" as
    // "excluded" would wipe out an enumeration the moment an unrelated `.length` guard shared the
    // operand — the same trap `is-within-domain-bounds` avoids from the other side.
    it('EDGE: {a number against a length bound} => within', () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse(5),
        domain: ValueDomainStub({ lengthMin: 10 }),
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {no domain} => within', () => {
      const result = isLengthInDomainGuard({ value: representativeValueContract.parse('a') });

      expect(result).toBe(true);
    });

    it('EMPTY: {an open domain} => within', () => {
      const result = isLengthInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub(),
      });

      expect(result).toBe(true);
    });
  });
});
