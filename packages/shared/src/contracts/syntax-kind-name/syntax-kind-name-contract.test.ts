import { syntaxKindNameContract } from './syntax-kind-name-contract';
import { SyntaxKindNameStub } from './syntax-kind-name.stub';

describe('syntaxKindNameContract', () => {
  describe('valid syntax kind names', () => {
    it('VALID: {stub default} => parses to the same value', () => {
      const kind = SyntaxKindNameStub();

      const result = syntaxKindNameContract.parse(kind);

      expect(result).toBe(kind);
    });

    it('VALID: {value: "MethodDeclaration"} => parses to the same value', () => {
      const kind = SyntaxKindNameStub({ value: 'MethodDeclaration' });

      const result = syntaxKindNameContract.parse(kind);

      expect(result).toBe(kind);
    });
  });

  describe('invalid syntax kind names', () => {
    it('EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        return syntaxKindNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });

    it('INVALID: {value: 12} => throws validation error', () => {
      expect(() => {
        return syntaxKindNameContract.parse(12);
      }).toThrow(/Expected string/u);
    });
  });
});
