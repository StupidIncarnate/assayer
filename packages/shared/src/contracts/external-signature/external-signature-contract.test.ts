import { externalSignatureContract } from './external-signature-contract';
import { ExternalSignatureStub } from './external-signature.stub';

describe('externalSignatureContract', () => {
  describe('valid external signatures', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const signature = ExternalSignatureStub();

      const result = externalSignatureContract.parse(signature);

      expect(result).toStrictEqual(signature);
    });

    it('VALID: {params: [], union-literal return} => parses a no-arg fanned-out union return', () => {
      const signature = ExternalSignatureStub({
        params: [],
        returnType: { kind: 'union', members: [{ kind: 'literal', value: 'a' }, { kind: 'literal', value: 'b' }] },
      });

      const result = externalSignatureContract.parse(signature);

      expect(result).toStrictEqual(signature);
    });
  });

  describe('invalid external signatures', () => {
    it('INVALID: {params: "nope"} => throws validation error', () => {
      expect(() => {
        return externalSignatureContract.parse({ params: 'nope', returnType: { kind: 'string' } });
      }).toThrow(/[Ee]xpected array/u);
    });
  });
});
