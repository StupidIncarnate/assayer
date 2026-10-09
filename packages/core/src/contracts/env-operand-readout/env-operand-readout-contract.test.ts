import { envOperandReadoutContract } from './env-operand-readout-contract';
import { EnvOperandReadoutStub } from './env-operand-readout.stub';

describe('envOperandReadoutContract', () => {
  describe('valid readouts', () => {
    it('VALID: {stub default} => parses a Number-coerced read', () => {
      const readout = EnvOperandReadoutStub();

      expect(envOperandReadoutContract.parse(readout)).toStrictEqual({ name: 'VALUE', steps: [{ kind: 'number' }] });
    });

    it('EMPTY: {steps: []} => parses a raw read with no transformation', () => {
      expect(envOperandReadoutContract.parse({ name: 'MODE', steps: [] })).toStrictEqual({ name: 'MODE', steps: [] });
    });
  });

  describe('invalid readouts', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return envOperandReadoutContract.parse({ name: '', steps: [] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
