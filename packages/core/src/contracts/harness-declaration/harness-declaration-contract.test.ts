import { harnessDeclarationContract } from './harness-declaration-contract';
import { HarnessDeclarationStub } from './harness-declaration.stub';

describe('harnessDeclarationContract', () => {
  describe('valid harness declarations', () => {
    it('VALID: {stub default} => keys the callback under its entry and parameter', () => {
      const result = harnessDeclarationContract.parse(HarnessDeclarationStub());

      expect(result).toStrictEqual({ inputs: { audit: { report: expect.any(Function) } } });
    });

    it('VALID: {a callback value} => passes the function through by reference', () => {
      const declaration = HarnessDeclarationStub();

      const result = harnessDeclarationContract.parse(declaration);

      expect(result.inputs.audit?.report).toBe(declaration.inputs.audit?.report);
    });

    it('VALID: {two entries} => carries both entries', () => {
      const result = harnessDeclarationContract.parse({
        inputs: { audit: { report: 1 }, collect: { sink: 2 } },
      });

      expect(result).toStrictEqual({ inputs: { audit: { report: 1 }, collect: { sink: 2 } } });
    });

    it('EMPTY: {no entries} => parses an empty inputs map', () => {
      const result = harnessDeclarationContract.parse({ inputs: {} });

      expect(result).toStrictEqual({ inputs: {} });
    });
  });

  describe('invalid harness declarations', () => {
    it('INVALID: {no inputs} => throws validation error', () => {
      expect(() => {
        return harnessDeclarationContract.parse({});
      }).toThrow(/Invalid input: expected object, received undefined/u);
    });

    it('INVALID: {a value under an entry that is not an object} => throws validation error', () => {
      expect(() => {
        return harnessDeclarationContract.parse({ inputs: { audit: 'report' } });
      }).toThrow(/Invalid input: expected object, received string/u);
    });
  });
});
