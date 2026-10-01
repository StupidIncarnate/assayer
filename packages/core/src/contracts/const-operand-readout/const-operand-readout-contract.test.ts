import { constOperandReadoutContract } from './const-operand-readout-contract';
import { ConstOperandReadoutStub } from './const-operand-readout.stub';

describe('constOperandReadoutContract', () => {
  describe('valid readouts', () => {
    it('VALID: {stub default} => parses a welded scalar value', () => {
      const readout = ConstOperandReadoutStub();

      expect(constOperandReadoutContract.parse(readout)).toStrictEqual({ value: 7 });
    });

    it('VALID: {length: 3} => parses a welded array length', () => {
      expect(constOperandReadoutContract.parse({ length: 3 })).toStrictEqual({ length: 3 });
    });

    it('VALID: {value: false} => parses a welded boolean value', () => {
      expect(constOperandReadoutContract.parse({ value: false })).toStrictEqual({ value: false });
    });
  });

  describe('invalid readouts', () => {
    it('INVALID: {length: "3"} => throws validation error', () => {
      expect(() => {
        return constOperandReadoutContract.parse({ length: '3' });
      }).toThrow(/expected number, received string/u);
    });

    it('INVALID: {value: {}} => throws validation error', () => {
      expect(() => {
        return constOperandReadoutContract.parse({ value: {} });
      }).toThrow(/Invalid input/u);
    });
  });
});
