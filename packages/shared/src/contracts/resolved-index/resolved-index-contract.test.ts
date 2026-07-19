import { resolvedIndexContract } from './resolved-index-contract';
import { ResolvedIndexStub } from './resolved-index.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('resolvedIndexContract', () => {
  describe('valid resolved indexes', () => {
    it('VALID: {stub default} => carries its layout/tsconfig hashes and one edge', () => {
      const index = ResolvedIndexStub();

      const result = resolvedIndexContract.parse(index);

      expect(result).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        edges: [
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
    });

    it('EMPTY: {no edges} => a resolved index with an empty edge list', () => {
      const result = resolvedIndexContract.parse({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        edges: [],
      });

      expect(result).toStrictEqual({ layoutHash: EMPTY_HASH, tsconfigHash: EMPTY_HASH, edges: [] });
    });
  });

  describe('invalid resolved indexes', () => {
    it('INVALID: {layoutHash not a sha256} => throws validation error', () => {
      expect(() => {
        return resolvedIndexContract.parse({ layoutHash: 'nope', tsconfigHash: EMPTY_HASH, edges: [] });
      }).toThrow(/Invalid/u);
    });
  });
});
