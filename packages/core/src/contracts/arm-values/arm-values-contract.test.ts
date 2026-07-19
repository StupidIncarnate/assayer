import { armValuesContract } from './arm-values-contract';
import { ArmValuesStub } from './arm-values.stub';

describe('armValuesContract', () => {
  describe('valid arm values', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const armValues = ArmValuesStub();

      const result = armValuesContract.parse(armValues);

      expect(result).toStrictEqual(armValues);
    });

    // Both arms of an unread predicate are OPEN domains, and that has to parse: it is how an
    // unrecognized predicate declines to narrow anything.
    it('EMPTY: {both arms unconstrained} => parses to two open domains', () => {
      const result = armValuesContract.parse({ satisfying: {}, violating: {} });

      expect(result).toStrictEqual({
        satisfying: {
          minExclusive: false,
          maxExclusive: false,
          lengthMinExclusive: false,
          lengthMaxExclusive: false,
          lengthExcluded: [],
          excluded: [],
        },
        violating: {
          minExclusive: false,
          maxExclusive: false,
          lengthMinExclusive: false,
          lengthMaxExclusive: false,
          lengthExcluded: [],
          excluded: [],
        },
      });
    });
  });

  describe('invalid arm values', () => {
    it('INVALID: {satisfying: "everything"} => throws validation error', () => {
      expect(() => {
        return armValuesContract.parse({ satisfying: 'everything', violating: {} });
      }).toThrow(/Expected object, received string/u);
    });
  });
});
