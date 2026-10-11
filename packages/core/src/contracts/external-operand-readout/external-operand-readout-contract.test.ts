import { externalOperandReadoutContract } from './external-operand-readout-contract';
import { ExternalOperandReadoutStub } from './external-operand-readout.stub';

describe('externalOperandReadoutContract', () => {
  describe('valid readouts', () => {
    it('VALID: {stub default} => parses a Number-coerced environment read', () => {
      const readout = ExternalOperandReadoutStub();

      expect(externalOperandReadoutContract.parse(readout)).toStrictEqual({
        root: { kind: 'env', name: 'VALUE' },
        steps: [{ kind: 'number' }],
      });
    });

    it('VALID: {root: argv element 2, steps: []} => parses a raw command-line read', () => {
      expect(
        externalOperandReadoutContract.parse({ root: { kind: 'argv', shape: 'element', index: 2 }, steps: [] }),
      ).toStrictEqual({ root: { kind: 'argv', shape: 'element', index: 2 }, steps: [] });
    });
  });

  describe('invalid readouts', () => {
    it('INVALID: {root: env with name ""} => throws validation error', () => {
      expect(() => {
        return externalOperandReadoutContract.parse({ root: { kind: 'env', name: '' }, steps: [] });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
