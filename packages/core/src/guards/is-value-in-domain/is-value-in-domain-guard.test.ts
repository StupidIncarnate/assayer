import { representativeValueContract } from '@assayer/shared/contracts';

import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';

import { isValueInDomainGuard } from './is-value-in-domain-guard';

describe('isValueInDomainGuard', () => {
  describe('an enumerated domain', () => {
    it('VALID: {value: "a", domain: members [a, b]} => true, a listed member', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ members: [representativeValueContract.parse('a'), representativeValueContract.parse('b')] }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: {value: "c", domain: members [a, b]} => false, not a listed member', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse('c'),
        domain: ValueDomainStub({ members: [representativeValueContract.parse('a'), representativeValueContract.parse('b')] }),
      });

      expect(result).toBe(false);
    });
  });

  describe('an exclusion domain — the else side of an equality', () => {
    it('VALID: {value: "dev", domain: excluded [a]} => true, not the excluded value', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse('dev'),
        domain: ValueDomainStub({ excluded: [representativeValueContract.parse('a')] }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: {value: "a", domain: excluded [a]} => false, the excluded value', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ excluded: [representativeValueContract.parse('a')] }),
      });

      expect(result).toBe(false);
    });
  });

  describe('a numeric bound', () => {
    it('VALID: {value: 51, domain: min 50 exclusive} => true, above the bound', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse(51),
        domain: ValueDomainStub({ min: 50, minExclusive: true }),
      });

      expect(result).toBe(true);
    });

    it('INVALID: {value: 50, domain: min 50 exclusive} => false, at the excluded bound', () => {
      const result = isValueInDomainGuard({
        value: representativeValueContract.parse(50),
        domain: ValueDomainStub({ min: 50, minExclusive: true }),
      });

      expect(result).toBe(false);
    });
  });

  describe('a missing operand', () => {
    it('EMPTY: {no domain} => false, nothing to admit against', () => {
      expect(isValueInDomainGuard({ value: representativeValueContract.parse('a') })).toBe(false);
    });
  });
});
