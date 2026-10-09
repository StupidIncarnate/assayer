import { provenanceContract } from './provenance-contract';
import { ProvenanceStub } from './provenance.stub';

describe('provenanceContract', () => {
  describe('valid provenances', () => {
    it('VALID: {stub default} => parses to param', () => {
      const provenance = ProvenanceStub();

      const result = provenanceContract.parse(provenance);

      expect(result).toBe('param');
    });

    it.each(provenanceContract.options)('VALID: {value: %s} => parses to the same value', (value) => {
      const provenance = ProvenanceStub({ value });

      const result = provenanceContract.parse(provenance);

      expect(result).toBe(value);
    });
  });

  describe('invalid provenances', () => {
    it('INVALID: {value: "made-up"} => throws, since only declared provenances exist', () => {
      expect(() => {
        return provenanceContract.parse('made-up' as never);
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
