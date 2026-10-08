import { ScriptTarget } from '#gateway/npm/ts-morph';

import { analysisHashTransformer } from '../../../transformers/analysis-hash/analysis-hash-transformer';
import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';

import { compileProcessFileBroker } from './compile-process-file-broker';
import { compileProcessFileBrokerProxy } from './compile-process-file-broker.proxy';

describe('compileProcessFileBroker', () => {
  describe('blob already present for the analysis hash', () => {
    it('VALID: {content: sha256 already has a blob file} => returns reused:true with the matching hashes and never writes a blob', async () => {
      const proxy = compileProcessFileBrokerProxy();
      const content = 'export function foo() { return 1; }';
      const contentHash = contentHashTransformer({ content });
      const analysisHash = analysisHashTransformer({ content, options: {} });
      proxy.blobExists({ blobsDir: '/repo/.assayer/cache/blobs', analysisHash });
      proxy.filesWithoutOwner({ absPaths: ['/repo/src/foo.ts'] });

      const result = await compileProcessFileBroker({
        root: '/repo',
        relPath: 'src/foo.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: true, contentHash, analysisHash });
      expect(
        proxy.wasWriteCalled({ path: `/repo/.assayer/cache/blobs/${analysisHash}.json.tmp` }),
      ).toBe(false);
    });
  });

  describe('no existing blob for new content', () => {
    it('VALID: {content: one function, no existing blob} => writes a new blob file and returns reused:false', async () => {
      const proxy = compileProcessFileBrokerProxy();
      const content = 'function foo() { return 1; }';
      const contentHash = contentHashTransformer({ content });
      const analysisHash = analysisHashTransformer({ content, options: {} });
      proxy.blobMissing({ blobsDir: '/repo/.assayer/cache/blobs', analysisHash });
      proxy.filesWithoutOwner({ absPaths: ['/repo/src/foo.ts'] });

      const result = await compileProcessFileBroker({
        root: '/repo',
        relPath: 'src/foo.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: false, contentHash, analysisHash });

      const writtenBlob = JSON.parse(
        String(
          proxy.getWrittenBlobFor({ path: `/repo/.assayer/cache/blobs/${analysisHash}.json.tmp` }),
        ),
      ) as unknown;

      expect(writtenBlob).toStrictEqual({
        relPath: 'src/foo.ts',
        contentHash,
        nodes: [{ kind: 'function', name: 'foo', startLine: 1, endLine: 1 }],
        displayLines: [{ n: 1, text: content, hash: contentHash }],
        analysis: { functions: [], enrichment: [], gaps: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [], declaringScopes: [] },
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
      });
    });
  });

  describe('unparseable content with no existing blob', () => {
    it('ERROR: {content: syntax error, no existing blob} => returns reused:false with a positioned parse error and writes no blob', async () => {
      const proxy = compileProcessFileBrokerProxy();
      const content = 'const x = ;;;{{{';
      const analysisHash = analysisHashTransformer({ content, options: {} });
      proxy.blobMissing({ blobsDir: '/repo/.assayer/cache/blobs', analysisHash });
      proxy.filesWithoutOwner({ absPaths: ['/repo/src/broken.ts'] });

      const result = await compileProcessFileBroker({
        root: '/repo',
        relPath: 'src/broken.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({
        reused: false,
        error: { line: 1, column: 11, message: 'Expression expected.' },
      });
      expect(
        proxy.wasWriteCalled({ path: `/repo/.assayer/cache/blobs/${analysisHash}.json.tmp` }),
      ).toBe(false);
    });
  });

  describe('tsx JSX content compiles via threaded relPath', () => {
    it('VALID: {relPath: src/app.tsx, content: JSX component, no existing blob} => writes a blob with one function node named App', async () => {
      const proxy = compileProcessFileBrokerProxy();
      const content = 'function App() {\n  return <div>hi</div>;\n}\n';
      const contentHash = contentHashTransformer({ content });
      const analysisHash = analysisHashTransformer({ content, options: {} });
      proxy.blobMissing({ blobsDir: '/repo/.assayer/cache/blobs', analysisHash });
      proxy.filesWithoutOwner({ absPaths: ['/repo/src/app.tsx'] });

      const result = await compileProcessFileBroker({
        root: '/repo',
        relPath: 'src/app.tsx',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });

      expect(result).toStrictEqual({ reused: false, contentHash, analysisHash });

      const writtenBlob = JSON.parse(
        String(
          proxy.getWrittenBlobFor({ path: `/repo/.assayer/cache/blobs/${analysisHash}.json.tmp` }),
        ),
      ) as unknown;

      expect(writtenBlob).toStrictEqual({
        relPath: 'src/app.tsx',
        contentHash,
        nodes: [{ kind: 'function', name: 'App', startLine: 1, endLine: 3 }],
        displayLines: [
          { n: 1, text: 'function App() {', hash: contentHashTransformer({ content: 'function App() {' }) },
          { n: 2, text: '  return <div>hi</div>;', hash: contentHashTransformer({ content: '  return <div>hi</div>;' }) },
          { n: 3, text: '}', hash: contentHashTransformer({ content: '}' }) },
          { n: 4, text: '', hash: contentHashTransformer({ content: '' }) },
        ],
        analysis: { functions: [], enrichment: [], gaps: [], darkSpots: [], undriven: [], lints: [], declaredTypes: [], declaringScopes: [] },
        moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
      });
    });
  });

  describe('a file its tsconfig owns', () => {
    it('VALID: {owner with the ES2022 library} => keys the blob on the owner options and walks under them', async () => {
      const proxy = compileProcessFileBrokerProxy();
      const content = 'export const last = (xs: number[]) => xs.at(-1);\n';
      const contentHash = contentHashTransformer({ content });
      const analysisHash = analysisHashTransformer({ content, options: { target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'] } });
      proxy.blobMissing({ blobsDir: '/repo/.assayer/cache/blobs', analysisHash });
      proxy.filesOwnedBy({
        absPaths: ['/repo/src/last.ts'],
        configFilePath: '/repo/tsconfig.json',
        options: { target: ScriptTarget.ES2022, lib: ['lib.es2022.d.ts'], outDir: '/repo/dist' },
      });

      const result = await compileProcessFileBroker({
        root: '/repo',
        relPath: 'src/last.ts',
        content,
        blobsDir: '/repo/.assayer/cache/blobs',
      });
      const writtenBlob = JSON.parse(
        String(proxy.getWrittenBlobFor({ path: `/repo/.assayer/cache/blobs/${analysisHash}.json.tmp` })),
      ) as unknown;

      expect({ result, writtenBlob }).toStrictEqual({
        result: { reused: false, contentHash, analysisHash },
        writtenBlob: {
          relPath: 'src/last.ts',
          contentHash,
          nodes: [],
          displayLines: [
            { n: 1, text: 'export const last = (xs: number[]) => xs.at(-1);', hash: contentHashTransformer({ content: 'export const last = (xs: number[]) => xs.at(-1);' }) },
            { n: 2, text: '', hash: contentHashTransformer({ content: '' }) },
          ],
          analysis: {
            functions: [
              {
                entry: {
                  name: 'last',
                  scopePath: ['*module*', 'last'],
                  params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
                  // ES2022 declares Array.prototype.at, so the return is read, not left as `any`.
                  returnType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
                  line: 1,
                  access: { kind: 'named' },
                },
                branches: [],
                exits: [{ coverageId: '*module*/last/return@top', kind: 'return', guardPath: [], line: 1 }],
                cases: [
                  { arrange: [{ kind: 'array', param: 'xs', value: [] }], reachesPath: ['*module*/last/return@top'], salient: true },
                  { arrange: [{ kind: 'array', param: 'xs', value: [7] }], reachesPath: ['*module*/last/return@top'], salient: false },
                  { arrange: [{ kind: 'array', param: 'xs', value: [7, 8] }], reachesPath: ['*module*/last/return@top'], salient: false },
                ],
              },
            ],
            enrichment: [{ line: 1, symbol: 'xs', typeText: 'number[]' }],
            gaps: [],
            darkSpots: [],
            undriven: [],
            lints: [],
            declaredTypes: [],
            declaringScopes: [],
          },
          moduleGraph: { edges: [], references: [], globalUses: [], envReads: [] },
        },
      });
    });
  });
});
