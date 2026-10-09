import { ArmReachedError } from './arm-reached-error';

describe('ArmReachedError', () => {
  describe('with an arm', () => {
    it('VALID: {arm: then} => creates error naming the arm', () => {
      const error = new ArmReachedError({ arm: 'then' });

      expect({ message: error.message, name: error.name, arm: error.arm }).toStrictEqual({
        message: "the syntax reached its 'then' arm",
        name: 'ArmReachedError',
        arm: 'then',
      });
    });

    it('VALID: {arm: else} => message names the else arm', () => {
      const error = new ArmReachedError({ arm: 'else' });

      expect(error.message).toBe("the syntax reached its 'else' arm");
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof ArmReachedError => returns true', () => {
      const error = new ArmReachedError({ arm: 'then' });

      expect(error instanceof ArmReachedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new ArmReachedError({ arm: 'then' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
