import { compiledFileViewContract } from './compiled-file-view-contract';
import { CompiledFileViewStub } from './compiled-file-view.stub';

describe('compiledFileViewContract', () => {
  describe('valid compiled file views', () => {
    it('VALID: {view with relPath \'src/foo.ts\', two source lines, one function node} => parses successfully and result.relPath is \'src/foo.ts\'', () => {
      const result = compiledFileViewContract.parse(CompiledFileViewStub());

      expect(result.relPath).toBe('src/foo.ts');
    });

    it('EMPTY: {view with empty lines and empty nodes arrays} => parses successfully', () => {
      const result = compiledFileViewContract.parse({
        relPath: 'src/foo.ts',
        lines: [],
        nodes: [],
      });

      expect(result.nodes).toStrictEqual([]);
    });
  });

  describe('invalid compiled file views', () => {
    it('INVALID: {relPath: ""} => throws validation error', () => {
      expect(() => {
        return compiledFileViewContract.parse({ relPath: '', lines: [], nodes: [] });
      }).toThrow(/at least 1 character/u);
    });
  });
});
