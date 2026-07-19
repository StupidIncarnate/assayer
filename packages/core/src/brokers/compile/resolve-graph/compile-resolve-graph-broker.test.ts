import {
  CompiledFileBlobStub,
  ContentHashStub,
  ModuleEdgeStub,
  RelPathStub,
} from '@assayer/shared/contracts';

import { cryptoSha256Adapter } from '../../../adapters/crypto/sha256/crypto-sha256-adapter';
import { compileResolveGraphBroker } from './compile-resolve-graph-broker';
import { compileResolveGraphBrokerProxy } from './compile-resolve-graph-broker.proxy';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const HASH = ContentHashStub();

describe('compileResolveGraphBroker', () => {
  describe('an empty file set', () => {
    it('EMPTY: {no files} => an index with no edges and no errors', async () => {
      compileResolveGraphBrokerProxy();

      const result = await compileResolveGraphBroker({ root: '/repo', blobsDir: '/blobs', files: [] });

      expect(result).toStrictEqual({
        index: {
          layoutHash: cryptoSha256Adapter({ content: JSON.stringify([]) }),
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
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: './missing', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.resolvesUnresolved();

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: cryptoSha256Adapter({
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
        blob: CompiledFileBlobStub({
          relPath: 'src/a/caller.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: '../b/foo', bindings: [{ kind: 'named', name: 'foo' }] })],
            references: [],
          },
        }),
      });
      proxy.resolvesLocal({ fileName: '/repo/src/b/foo.ts' });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a/caller.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: cryptoSha256Adapter({
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
        blob: CompiledFileBlobStub({
          relPath: 'src/a.ts',
          moduleGraph: {
            edges: [ModuleEdgeStub({ kind: 'import', specifier: 'node:fs', bindings: [{ kind: 'named', name: 'readFile' }] })],
            references: [],
          },
        }),
      });

      const result = await compileResolveGraphBroker({
        root: '/repo',
        blobsDir: '/blobs',
        files: [{ relPath: RelPathStub({ value: 'src/a.ts' }), contentHash: HASH }],
      });

      expect(result).toStrictEqual({
        index: {
          layoutHash: cryptoSha256Adapter({
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
});
