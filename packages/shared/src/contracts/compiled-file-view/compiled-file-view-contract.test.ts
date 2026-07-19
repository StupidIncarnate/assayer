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
        displayLines: [],
        nodes: [],
      });

      expect(result.nodes).toStrictEqual([]);
    });

    it('EMPTY: {view without resolvedEdges} => defaults resolvedEdges to an empty array', () => {
      const result = compiledFileViewContract.parse({
        relPath: 'src/foo.ts',
        displayLines: [],
        nodes: [],
      });

      expect(result.resolvedEdges).toStrictEqual([]);
    });

    it('VALID: {view with one resolved local edge} => carries the edge through', () => {
      const result = compiledFileViewContract.parse({
        relPath: 'src/a/caller.ts',
        displayLines: [],
        nodes: [],
        resolvedEdges: [
          {
            from: 'src/a/caller.ts',
            specifier: '../b/foo',
            importedName: 'foo',
            line: 1,
            column: 1,
            target: { kind: 'local', relPath: 'src/b/foo.ts' },
          },
        ],
      });

      expect(result.resolvedEdges).toStrictEqual([
        {
          from: 'src/a/caller.ts',
          specifier: '../b/foo',
          importedName: 'foo',
          line: 1,
          column: 1,
          target: { kind: 'local', relPath: 'src/b/foo.ts' },
        },
      ]);
    });
  });

  describe('invalid compiled file views', () => {
    it('INVALID: {relPath: ""} => throws validation error', () => {
      expect(() => {
        return compiledFileViewContract.parse({ relPath: '', displayLines: [], nodes: [] });
      }).toThrow(/at least 1 character/u);
    });
  });
});
