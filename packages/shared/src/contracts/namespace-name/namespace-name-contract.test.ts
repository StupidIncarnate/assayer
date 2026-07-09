import { namespaceNameContract } from './namespace-name-contract';
import { NamespaceNameStub } from './namespace-name.stub';

describe('namespaceNameContract', () => {
  describe('valid namespace names', () => {
    it('VALID: {value: "master"} => parses successfully', () => {
      const result = namespaceNameContract.parse('master');

      expect(result).toBe('master');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const namespace = NamespaceNameStub();

      const result = namespaceNameContract.parse(namespace);

      expect(result).toBe('master');
    });
  });

  describe('invalid namespace names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return namespaceNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
