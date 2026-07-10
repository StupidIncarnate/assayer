import { fileContentsContract } from './file-contents-contract';
import { FileContentsStub } from './file-contents.stub';

describe('fileContentsContract', () => {
  describe('valid file contents', () => {
    it('VALID: {value: "hello world"} => parses successfully', () => {
      const result = fileContentsContract.parse('hello world');

      expect(result).toBe('hello world');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const contents = FileContentsStub();

      const result = fileContentsContract.parse(contents);

      expect(result).toBe('export const x = 1;\n');
    });

    it('EDGE: {value: ""} => parses with empty contents', () => {
      const result = fileContentsContract.parse('');

      expect(result).toBe('');
    });
  });
});
