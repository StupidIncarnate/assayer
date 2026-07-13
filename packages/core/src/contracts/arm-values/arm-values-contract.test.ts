import { armValuesContract } from './arm-values-contract';
import { ArmValuesStub } from './arm-values.stub';

describe('armValuesContract', () => {
  describe('valid arm values', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const armValues = ArmValuesStub();

      const result = armValuesContract.parse(armValues);

      expect(result).toStrictEqual(armValues);
    });
  });

  describe('invalid arm values', () => {
    it('INVALID: {satisfying: [{}]} => throws validation error', () => {
      expect(() => {
        return armValuesContract.parse({ satisfying: [{}], violating: [] });
      }).toThrow(/Invalid input/u);
    });
  });
});
