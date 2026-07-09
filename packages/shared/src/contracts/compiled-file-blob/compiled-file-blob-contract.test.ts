import { compiledFileBlobContract } from './compiled-file-blob-contract';
import { CompiledFileBlobStub } from './compiled-file-blob.stub';

const HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('compiledFileBlobContract', () => {
  describe('valid compiled file blobs', () => {
    it('VALID: {nodes: [one node]} => parses with exactly one node', () => {
      const result = compiledFileBlobContract.parse(CompiledFileBlobStub());

      expect(result.nodes).toStrictEqual([{ kind: 'function', startLine: 1, endLine: 5 }]);
    });

    it('EMPTY: {nodes: [], lines: []} => parses with empty arrays', () => {
      const result = compiledFileBlobContract.parse({
        relPath: 'packages/shared/src/index.ts',
        contentHash: HASH,
        nodes: [],
        lines: [],
      });

      expect(result.nodes).toStrictEqual([]);
    });
  });

  describe('invalid compiled file blobs', () => {
    it('INVALID: {relPath: ""} => throws validation error', () => {
      expect(() => {
        return compiledFileBlobContract.parse({
          relPath: '',
          contentHash: HASH,
          nodes: [],
          lines: [],
        });
      }).toThrow(/at least 1 character/u);
    });
  });
});
