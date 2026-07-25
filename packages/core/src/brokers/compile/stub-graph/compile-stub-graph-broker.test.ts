import {
  CompiledFileBlobStub,
  ContentHashStub,
  FileAnalysisStub,
  RelPathStub,
  ResolvedIndexStub,
} from '@assayer/shared/contracts';

import { compileStubGraphBroker } from './compile-stub-graph-broker';
import { compileStubGraphBrokerProxy } from './compile-stub-graph-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HASH = ContentHashStub();

const CONFIG_BLOB = CompiledFileBlobStub({
  relPath: 'src/config/config.ts',
  analysis: FileAnalysisStub({
    declaredTypes: [
      {
        name: 'Config',
        properties: [
          { name: 'mode', type: { kind: 'string' } },
          { name: 'retries', type: { kind: 'number' } },
        ],
      },
    ],
    functions: [
      {
        entry: {
          name: 'decide',
          scopePath: ['*module*', 'decide'],
          params: [
            {
              name: 'config',
              type: {
                kind: 'object',
                typeName: 'Config',
                properties: [
                  { name: 'mode', type: { kind: 'string' } },
                  { name: 'retries', type: { kind: 'number' } },
                ],
              },
            },
          ],
          returnType: { kind: 'string' },
          line: 5,
          access: { kind: 'named' },
        },
        branches: [
          {
            coverageId: 'decide/if:config.mode===a',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: 'decide/if:config.mode===a#leaf',
              operandParamName: 'config',
              operandPropertyPath: ['mode'],
              operandTypeRef: 'Config',
              operandType: { kind: 'string' },
              predicate: { kind: 'eq', literal: 'a' },
            },
            startLine: 6,
            endLine: 8,
          },
        ],
        exits: [
          {
            coverageId: 'decide/return@then',
            kind: 'return',
            guardPath: [{ branchCoverageId: 'decide/if:config.mode===a', arm: 'then' }],
            line: 7,
          },
        ],
        cases: [],
      },
    ],
  }),
});

describe('compileStubGraphBroker', () => {
  describe('a blob declaring a type it reads on one property', () => {
    it('VALID: {Config{mode,retries}, reads config.mode === "a"} => mode demanded, retries unknown, this file the reader', async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: CONFIG_BLOB });

      const result = await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/config/config.ts' }), contentHash: HASH }],
      });

      expect(result.index).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        objectStubs: [
          {
            key: 'src/config/config.ts#Config',
            definitionRelPath: 'src/config/config.ts',
            typeName: 'Config',
            properties: [
              { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
              { name: 'retries', demand: { kind: 'unknown' } },
            ],
            readers: ['src/config/config.ts'],
          },
        ],
        envStubs: [],
      });
    });

    it("VALID: {Config{mode,retries}, reads config.mode === 'a'} => one property guard naming Config#mode, this file as reader, the branch's line, eq 'a', string operand type", async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: CONFIG_BLOB });

      const result = await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/config/config.ts' }), contentHash: HASH }],
      });

      expect(result.guards).toStrictEqual([
        {
          key: 'src/config/config.ts#Config',
          property: 'mode',
          reader: 'src/config/config.ts',
          line: 6,
          predicate: { kind: 'eq', literal: 'a' },
          operandType: { kind: 'string' },
        },
      ]);
    });

    it('VALID: {a config-dir + namespace} => writes the index to the tmp path under .assayer/cache/stubs', async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: CONFIG_BLOB });

      await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/config/config.ts' }), contentHash: HASH }],
      });

      expect(proxy.getWrittenPath()).toBe('/repo/.assayer/cache/stubs/feature-x.json.tmp');
    });

    // `stubIndexWriteBroker` re-canonicalizes (re-sorts objectStubs/envStubs by key) independently of the
    // sort this broker already applied before handing it the index — the bytes on disk must agree with
    // the value every caller reads back in-process, or a reader of the RETURNED index and a reader of the
    // WRITTEN cache file could disagree about one compile.
    it('VALID: {Config{mode,retries}, reads config.mode === "a"} => the written index is byte-identical to the returned index', async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: CONFIG_BLOB });

      const result = await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/config/config.ts' }), contentHash: HASH }],
      });

      expect(proxy.getWrittenIndex()).toStrictEqual(result.index);
    });
  });

  describe('a blob that declares no types', () => {
    it('EMPTY: {no declared types} => a stub index with no object stubs and no env stubs', async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: CompiledFileBlobStub({ relPath: 'src/plain.ts', analysis: FileAnalysisStub({ functions: [], declaredTypes: [] }) }) });

      const result = await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/plain.ts' }), contentHash: HASH }],
      });

      expect(result.index).toStrictEqual({ layoutHash: EMPTY_HASH, tsconfigHash: EMPTY_HASH, objectStubs: [], envStubs: [] });
    });
  });

  describe('a blob reading a process.env property in a branch comparison', () => {
    const ENV_BLOB = CompiledFileBlobStub({
      relPath: 'src/flags/flags.ts',
      moduleGraph: {
        edges: [],
        references: [],
        globalUses: [],
        envReads: [{ property: 'MODE', literals: ['production'] }],
      },
    });

    it("VALID: {process.env.MODE === 'production'} => one env stub, MODE guessed ['abc123','production'], this file the reader", async () => {
      const proxy = compileStubGraphBrokerProxy();
      proxy.queueBlob({ blob: ENV_BLOB });

      const result = await compileStubGraphBroker({
        configDir: '/repo',
        namespace: 'feature-x',
        blobsDir: '/blobs',
        resolvedIndex: ResolvedIndexStub(),
        files: [{ relPath: RelPathStub({ value: 'src/flags/flags.ts' }), contentHash: HASH }],
      });

      expect(result.index).toStrictEqual({
        layoutHash: EMPTY_HASH,
        tsconfigHash: EMPTY_HASH,
        objectStubs: [],
        envStubs: [
          { key: 'process.env#MODE', property: 'MODE', values: ['abc123', 'production'], guessed: true, readers: ['src/flags/flags.ts'] },
        ],
      });
    });
  });
});
