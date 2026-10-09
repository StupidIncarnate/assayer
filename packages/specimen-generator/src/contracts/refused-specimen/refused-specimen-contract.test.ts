import { refusedSpecimenContract } from './refused-specimen-contract';
import { RefusedSpecimenStub } from './refused-specimen.stub';

describe('refusedSpecimenContract', () => {
  describe('valid refusals', () => {
    it('VALID: {stub default} => parses a folder and TypeScript reason', () => {
      const refused = RefusedSpecimenStub();

      const result = refusedSpecimenContract.parse(refused);

      expect(result).toStrictEqual({
        folder: 'if-number-class-body-cond-param',
        reason: "Type 'string' is not assignable to type 'number'.",
      });
    });
  });

  describe('invalid refusals', () => {
    it('INVALID: {folder: ""} => throws, since a refusal names its folder', () => {
      expect(() => {
        return refusedSpecimenContract.parse({ ...RefusedSpecimenStub(), folder: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {reason: ""} => throws, since a refusal says why', () => {
      expect(() => {
        return refusedSpecimenContract.parse({ ...RefusedSpecimenStub(), reason: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {reason: missing} => throws, since a refusal needs a reason', () => {
      expect(() => {
        return refusedSpecimenContract.parse({ folder: 'a' });
      }).toThrow(/expected string, received undefined/u);
    });
  });
});
