import { sourceLineContract } from './source-line-contract';
import { SourceLineStub } from './source-line.stub';

describe('sourceLineContract', () => {
  describe('valid source lines', () => {
    it('VALID: {text: "const x = 1;"} => parses with exact text', () => {
      const line = SourceLineStub({ text: 'const x = 1;' });

      const result = sourceLineContract.parse(line);

      expect(result.text).toBe('const x = 1;');
    });

    it('EDGE: {text: ""} => parses with empty text', () => {
      const line = SourceLineStub({ text: '' });

      const result = sourceLineContract.parse(line);

      expect(result.text).toBe('');
    });
  });

  describe('invalid source lines', () => {
    it('INVALID: {hash: "not-a-valid-hash"} => throws validation error', () => {
      expect(() => {
        return sourceLineContract.parse({ n: 1, text: 'x', hash: 'not-a-valid-hash' });
      }).toThrow(/Invalid/u);
    });
  });
});
