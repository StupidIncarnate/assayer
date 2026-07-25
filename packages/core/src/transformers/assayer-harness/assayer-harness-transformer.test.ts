import { HarnessDeclarationStub } from '../../contracts/harness-declaration/harness-declaration.stub';
import { assayerHarnessTransformer } from './assayer-harness-transformer';

describe('assayerHarnessTransformer', () => {
  describe('validating an authored declaration', () => {
    it('VALID: {stub default} => returns the declaration keyed by entry then parameter', () => {
      const result = assayerHarnessTransformer(HarnessDeclarationStub());

      expect(result).toStrictEqual({ inputs: { audit: { report: expect.any(Function) } } });
    });

    it('VALID: {a callback value} => hands the same function reference back', () => {
      const declaration = HarnessDeclarationStub();

      const result = assayerHarnessTransformer(declaration);

      expect(result.inputs.audit?.report).toBe(declaration.inputs.audit?.report);
    });

    it('EMPTY: {no entries} => returns an empty inputs map', () => {
      const result = assayerHarnessTransformer({ inputs: {} });

      expect(result).toStrictEqual({ inputs: {} });
    });
  });

  describe('refusing a declaration the contract does not admit', () => {
    it('INVALID: {an entry whose value is a string} => throws validation error', () => {
      expect(() => {
        return assayerHarnessTransformer({ inputs: { audit: 'report' } as never });
      }).toThrow(/Expected object/u);
    });
  });
});
