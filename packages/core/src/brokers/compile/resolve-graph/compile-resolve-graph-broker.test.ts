import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { ContentHashStub } from '@assayer/shared/contracts/content-hash/content-hash.stub';
import { ExternalSignatureStub } from '@assayer/shared/contracts/external-signature/external-signature.stub';
import { GlobalUseStub } from '@assayer/shared/contracts/global-use/global-use.stub';
import { ModuleEdgeStub } from '@assayer/shared/contracts/module-edge/module-edge.stub';
import { RelPathStub } from '@assayer/shared/contracts/rel-path/rel-path.stub';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { compileResolveGraphBroker } from './compile-resolve-graph-broker';
import { compileResolveGraphBrokerProxy } from './compile-resolve-graph-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HASH = ContentHashStub();
const BLOB_PATH = `/blobs/${String(HASH)}.json`;

describe('compileResolveGraphBroker', () => {
  describe('an empty file set', () => {
    it('EMPTY: {no files} => an index with no edges and no errors', async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.noTsconfigAt({ root: '/repo' });

      const result = await compileResolveGraphBroker({ root: '/repo', blobsDir: '/blobs', files: [] });

      expect(result).toStrictEqual({
        index: {
          layoutHash: contentHashTransformer({ content: JSON.stringify([]) }),
          tsconfigHash: EMPTY_HASH,
          edges: [],
        },
        errors: [],
      });
    });
  });

  describe('a file whose import cannot be resolved', () => {
    it("ERROR: {import { foo } from './missing' resolves to nothing} => a cannot-resolve error at the declaration, no edge", async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: './missing', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.noTsconfigAt({ root: '/repo' });
      proxy.resolvesUnresolved({ specifier: './missing' });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: contentHashTransformer({
            content: JSON.stringify([{ relPath: 'src/a.ts', contentHash: String(HASH) }]),
          }),
          tsconfigHash: EMPTY_HASH,
          edges: [],
        },
        errors: [
          { relPath: 'src/a.ts', line: 1, column: 1, message: "cannot resolve import './missing'" },
        ],
      });
    });
  });

  describe('a file whose import resolves to a sibling file', () => {
    it("VALID: {import { foo } from '../b/foo' resolves in-repo} => one local edge keyed by the definition path", async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/a/caller.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: '../b/foo', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.noTsconfigAt({ root: '/repo' });
      proxy.resolvesLocal({ specifier: '../b/foo', fileName: '/repo/src/b/foo.ts' });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a/caller.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: contentHashTransformer({
            content: JSON.stringify([{ relPath: 'src/a/caller.ts', contentHash: String(HASH) }]),
          }),
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
        },
        errors: [],
      });
    });
  });

  describe('a file that imports a node builtin', () => {
    it("VALID: {import { readFile } from 'node:fs'} => one builtin edge, never touching the resolver", async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: 'node:fs', bindings: [{ kind: 'named', name: 'readFile' }] })],
            references: [],
          },
        }),
      });
      proxy.noTsconfigAt({ root: '/repo' });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: contentHashTransformer({
            content: JSON.stringify([{ relPath: 'src/a.ts', contentHash: String(HASH) }]),
          }),
          tsconfigHash: EMPTY_HASH,
          edges: [
            {
              from: 'src/a.ts',
              specifier: 'node:fs',
              importedName: 'readFile',
              line: 1,
              column: 1,
              target: { kind: 'builtin', packageName: 'fs' },
            },
          ],
        },
        errors: [],
      });
    });
  });

  describe('two files importing the same package export', () => {
    it("VALID: {src/a.ts and src/b.ts both import { foo } from 'left-pad'} => reads the external signature exactly once, keyed by the shared dtsPath and export name", async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.configFilePath({ root: '/repo', path: '/repo/tsconfig.json' });
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: 'left-pad', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/b.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: 'left-pad', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.resolvesLocal({ specifier: 'left-pad', fileName: '/repo/node_modules/left-pad/index.d.ts' });
      const signature = ExternalSignatureStub();
      proxy.packageSignatureCacheMiss({
        dtsPath: '/repo/node_modules/left-pad/index.d.ts',
        dtsContent: 'export declare const foo: (value: string) => string;',
        exportName: 'foo',
        cacheDir: '/repo/.assayer/cache',
        signature,
      });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        cacheDir: '/repo/.assayer/cache',
        files: [
          { relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH },
          { relPath: RelPathStub({ value: 'src/b.ts' }), contentHash: HASH },
        ],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: contentHashTransformer({
            content: JSON.stringify([
              { relPath: 'src/a.ts', contentHash: String(HASH) },
              { relPath: 'src/b.ts', contentHash: String(HASH) },
            ]),
          }),
          tsconfigHash: EMPTY_HASH,
          edges: [
            {
              from: 'src/a.ts',
              specifier: 'left-pad',
              importedName: 'foo',
              line: 1,
              column: 1,
              target: { kind: 'package', packageName: 'left-pad', signature },
            },
            {
              from: 'src/b.ts',
              specifier: 'left-pad',
              importedName: 'foo',
              line: 1,
              column: 1,
              target: { kind: 'package', packageName: 'left-pad', signature },
            },
          ],
        },
        errors: [],
      });
      expect(proxy.packageSignatureReadCount()).toBe(1);
    });
  });

  describe('two files reading the same ambient global', () => {
    it("VALID: {src/a.ts and src/b.ts both read process.env, uncalled} => reads the global signature exactly once, keyed by the shared reference", async () => {
      const proxy = compileResolveGraphBrokerProxy();
      proxy.configFilePath({ root: '/repo', path: '/repo/tsconfig.json' });
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [],
            references: [],
            globalUses: [GlobalUseStub({ name: 'process', member: 'env', called: false })],
          },
        }),
      });
      proxy.queueBlob({
        path: BLOB_PATH,
        blob: CompiledFileBlobStub({
          relPath: 'src/b.ts',
          moduleGraph: {
            edges: [],
            references: [],
            globalUses: [GlobalUseStub({ name: 'process', member: 'env', called: false })],
          },
        }),
      });
      proxy.globalReadsNothing({
        tsConfigFilePath: '/repo/tsconfig.json',
        cacheDir: '/repo/.assayer/cache',
        name: 'process',
        member: 'env',
        called: false,
      });

      await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        cacheDir: '/repo/.assayer/cache',
        files: [
          { relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH },
          { relPath: RelPathStub({ value: 'src/b.ts' }), contentHash: HASH },
        ],
      });

      expect(proxy.getExternalSignatureReadGlobalCalls({ cacheDir: '/repo/.assayer/cache' })).toStrictEqual([
        {
          tsConfigFilePath: '/repo/tsconfig.json',
          reference: { kind: 'global', name: 'process', member: 'env', called: false },
          cacheDir: '/repo/.assayer/cache',
        },
      ]);
    });
  });
});
