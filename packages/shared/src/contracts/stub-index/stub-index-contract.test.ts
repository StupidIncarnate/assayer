import { stubIndexContract } from './stub-index-contract';
import { StubIndexStub } from './stub-index.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('stubIndexContract', () => {
  describe('valid stub indexes', () => {
    it('VALID: {stub default} => carries its hashes, one object stub, and no env stubs', () => {
      const result = stubIndexContract.parse(StubIndexStub());

      expect(result).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        objectStubs: [
          {
            key: 'src/config/config.ts#Config',
            definitionRelPath: 'src/config/config.ts',
            typeName: 'Config',
            properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
            readers: ['src/config/config.ts'],
          },
        ],
        envStubs: [],
      });
    });

    it('EMPTY: {no stubs} => a stub index with empty object and env lists', () => {
      const result = stubIndexContract.parse({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        objectStubs: [],
        envStubs: [],
      });

      expect(result).toStrictEqual({ layoutHash: EMPTY_HASH, tsconfigHash: EMPTY_HASH, objectStubs: [], envStubs: [] });
    });
  });

  describe('invalid stub indexes', () => {
    it('INVALID: {layoutHash not a sha256} => throws validation error', () => {
      expect(() => {
        return stubIndexContract.parse({ layoutHash: 'nope', tsconfigHash: EMPTY_HASH, objectStubs: [], envStubs: [] });
      }).toThrow(/Invalid/u);
    });
  });
});
