import { propertyGuardContract } from './property-guard-contract';
import { PropertyGuardStub } from './property-guard.stub';

describe('propertyGuardContract', () => {
  describe('valid property guard', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const guard = PropertyGuardStub();

      const result = propertyGuardContract.parse(guard);

      expect(result).toStrictEqual(guard);
    });

    it("VALID: {mode === 'a' read on Config} => parses key, property, reader, line, predicate, operandType", () => {
      const result = propertyGuardContract.parse({
        key: 'src/config/config.ts#Config',
        property: 'mode',
        reader: 'src/decide.ts',
        line: 6,
        predicate: { kind: 'eq', literal: 'a' },
        operandType: { kind: 'string' },
      });

      expect(result).toStrictEqual({
        key: 'src/config/config.ts#Config',
        property: 'mode',
        reader: 'src/decide.ts',
        line: 6,
        predicate: { kind: 'eq', literal: 'a' },
        operandType: { kind: 'string' },
      });
    });
  });

  describe('invalid property guard', () => {
    it('INVALID: {line: "six"} => throws validation error', () => {
      expect(() => {
        return propertyGuardContract.parse({
          key: 'src/config/config.ts#Config',
          property: 'mode',
          reader: 'src/decide.ts',
          line: 'six' as never,
          predicate: { kind: 'eq', literal: 'a' },
          operandType: { kind: 'string' },
        });
      }).toThrow(/Expected number/u);
    });
  });
});
