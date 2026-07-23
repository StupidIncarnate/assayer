import { StubIndexStub } from '@assayer/shared/contracts';

import { stubIndexWriteBroker } from './stub-index-write-broker';
import { stubIndexWriteBrokerProxy } from './stub-index-write-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('stubIndexWriteBroker', () => {
  describe('writing a stub index for a namespace', () => {
    it('VALID: {configDir "/repo", namespace "feature-x", one-object-stub index} => writes the canonical index and returns success', async () => {
      const proxy = stubIndexWriteBrokerProxy();
      proxy.succeeds();

      const result = await stubIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: StubIndexStub(),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenIndex()).toStrictEqual({
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

    it('VALID: {two object stubs out of key order} => writes them sorted by key (determinism)', async () => {
      const proxy = stubIndexWriteBrokerProxy();
      proxy.succeeds();

      await stubIndexWriteBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        index: StubIndexStub({
          objectStubs: [
            {
              key: 'src/z/z.ts#Zed',
              definitionRelPath: 'src/z/z.ts',
              typeName: 'Zed',
              properties: [],
              readers: ['src/z/z.ts'],
            },
            {
              key: 'src/a/a.ts#Alpha',
              definitionRelPath: 'src/a/a.ts',
              typeName: 'Alpha',
              properties: [],
              readers: ['src/a/a.ts'],
            },
          ],
        }),
      });

      expect(proxy.getWrittenIndex()).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        objectStubs: [
          { key: 'src/a/a.ts#Alpha', definitionRelPath: 'src/a/a.ts', typeName: 'Alpha', properties: [], readers: ['src/a/a.ts'] },
          { key: 'src/z/z.ts#Zed', definitionRelPath: 'src/z/z.ts', typeName: 'Zed', properties: [], readers: ['src/z/z.ts'] },
        ],
        envStubs: [],
      });
    });

    it('VALID: {namespace "feature-x"} => writes to the tmp path under .assayer/cache/stubs before renaming', async () => {
      const proxy = stubIndexWriteBrokerProxy();
      proxy.succeeds();

      await stubIndexWriteBroker({ configDir: '/repo', namespace: 'feature-x', index: StubIndexStub() });

      expect(proxy.getWrittenPath()).toBe('/repo/.assayer/cache/stubs/feature-x.json.tmp');
    });
  });
});
