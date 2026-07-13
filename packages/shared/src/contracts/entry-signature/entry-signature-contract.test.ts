import { entrySignatureContract } from './entry-signature-contract';
import { EntrySignatureStub } from './entry-signature.stub';

describe('entrySignatureContract', () => {
  describe('valid entry signatures', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const entry = EntrySignatureStub();

      const result = entrySignatureContract.parse(entry);

      expect(result).toStrictEqual(entry);
    });

    it('VALID: {params: [], returnType: void} => parses a no-arg void entry', () => {
      const entry = EntrySignatureStub({ name: 'run', params: [], returnType: { kind: 'unknown', text: 'void' } });

      const result = entrySignatureContract.parse(entry);

      expect(result).toStrictEqual(entry);
    });
  });

  describe('invalid entry signatures', () => {
    it('INVALID: {name: ""} => throws validation error', () => {
      expect(() => {
        return entrySignatureContract.parse({ name: '', params: [], returnType: { kind: 'string' } });
      }).toThrow(/at least 1 character/u);
    });
  });
});
