import { compiledTreeResolveBroker } from './compiled-tree-resolve-broker';
import { compiledTreeResolveBrokerProxy } from './compiled-tree-resolve-broker.proxy';
import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';
import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';

// A caller whose parameter is declared as an IMPORTED type. The persisted analysis refuses that
// parameter and carries a gap. The sibling file on disk declares the type, so the overlays build the
// parameter and the gap closes.
const READER_SOURCE =
  "import type { Config } from './types';\n\nexport function readMode(config: Config): string {\n  return config.mode;\n}\n";
const TYPES_SOURCE = 'export interface Config {\n  mode: string;\n  region: string;\n}\n';
const READER_ANALYSIS = FileAnalysisStub({
  functions: [
    {
      entry: {
        name: 'readMode',
        scopePath: ['*module*', 'readMode'],
        params: [{ name: 'config', type: { kind: 'unknown', text: 'Config', typeRef: 'Config' } }],
        returnType: { kind: 'string' },
        line: 3,
        access: { kind: 'named' },
      },
      branches: [],
      exits: [{ coverageId: '*module*/readMode/return@top', kind: 'return', guardPath: [], line: 4 }],
      cases: [],
    },
  ],
  enrichment: [{ line: 3, symbol: 'config', typeText: 'Config' }],
  gaps: [{ name: 'readMode', reason: '`readMode` derives no case, because Assayer cannot construct `config: Config`.' }],
  darkSpots: [],
  undriven: [],
  lints: [],
  declaredTypes: [],
  declaringScopes: [],
});

describe('compiledTreeResolveBroker', () => {
  it('VALID: {current namespace main with a.ts, b.tsx} => returns CompiledTree with counts and nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const manifest = AssayerCacheManifestStub({
      namespaces: {
        main: {
          files: [
            { relPath: 'a.ts', contentHash: 'a'.repeat(64), analysisHash: 'a'.repeat(64) },
            { relPath: 'b.tsx', contentHash: 'b'.repeat(64), analysisHash: 'b'.repeat(64) },
          ],
        },
      },
    });
    proxy.setupManifest({ repoPath: '/repo', manifest });

    const result = await compiledTreeResolveBroker({ repoPath: '/repo' });

    expect(result).toStrictEqual({
      summary: { repoName: 'assayer', branchName: 'main', rootFolderName: 'smoke-repo', tsCount: 1, tsxCount: 1 },
      nodes: [
        { name: 'a.ts', path: 'a.ts', kind: 'file' },
        { name: 'b.tsx', path: 'b.tsx', kind: 'file' },
      ],
    });
  });

  it('EMPTY: {current namespace main with no files} => returns CompiledTree with zero counts and no nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const manifest = AssayerCacheManifestStub({ namespaces: { main: { files: [] } } });
    proxy.setupManifest({ repoPath: '/repo', manifest });

    const result = await compiledTreeResolveBroker({ repoPath: '/repo' });

    expect(result).toStrictEqual({
      summary: { repoName: 'assayer', branchName: 'main', rootFolderName: 'smoke-repo', tsCount: 0, tsxCount: 0 },
      nodes: [],
    });
  });

  it('EMPTY: {no cache manifest on disk} => returns an empty CompiledTree with placeholder summary, zero counts, and no nodes', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    proxy.setupMissingManifest({ repoPath: '/repo' });

    const result = await compiledTreeResolveBroker({ repoPath: '/repo' });

    expect(result).toStrictEqual({
      summary: { repoName: 'default', branchName: 'default', rootFolderName: 'default', tsCount: 0, tsxCount: 0 },
      nodes: [],
    });
  });

  it('ERROR: {manifest disappears after the exists check} => propagates the read rejection', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    proxy.setupManifestVanishes({ repoPath: '/repo' });

    await expect(compiledTreeResolveBroker({ repoPath: '/repo' })).rejects.toThrow(
      /ENOENT/u,
    );
  });

  it('VALID: {cached blob analysis has errors} => attaches errorCount to file node', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const hashA = 'a'.repeat(64);
    const hashB = 'b'.repeat(64);
    const manifest = AssayerCacheManifestStub({
      namespaces: {
        main: {
          files: [
            { relPath: 'a.ts', contentHash: hashA, analysisHash: hashA },
            { relPath: 'b.tsx', contentHash: hashB, analysisHash: hashB },
          ],
        },
      },
    });
    proxy.setupManifest({ repoPath: '/repo', manifest });
    proxy.setupBlob({
      repoPath: '/repo',
      analysisHash: hashA,
      blob: CompiledFileBlobStub({
        relPath: 'a.ts',
        analysis: FileAnalysisStub({
          undriven: [{ name: 'u1', reason: 'r1', startLine: 1, endLine: 1 }],
          lints: [
            { rule: 'dead-surface', name: 'l1', message: 'm1', startLine: 2, endLine: 2 },
            { rule: 'dead-surface', name: 'l2', message: 'm2', startLine: 3, endLine: 3 },
          ],
          gaps: [{ name: 'g1', reason: 'r2' }],
        }),
      }),
    });
    proxy.sourceRootRepoRoot({ repoPath: '/repo', repoRoot: '.' });
    proxy.sourceMissing({ root: '/repo', relPath: 'a.ts' });
    proxy.harnessMissing({ path: '/repo/a.harness.ts' });
    proxy.setupBlob({
      repoPath: '/repo',
      analysisHash: hashB,
      blob: CompiledFileBlobStub({ relPath: 'b.tsx', analysis: FileAnalysisStub() }),
    });

    const result = await compiledTreeResolveBroker({ repoPath: '/repo' });

    expect(result.nodes).toStrictEqual([
      { name: 'a.ts', path: 'a.ts', kind: 'file', errorCount: 4 },
      { name: 'b.tsx', path: 'b.tsx', kind: 'file' },
    ]);
  });

  it('VALID: {cached blob carries a gap that the sibling file on disk closes} => the file node carries no errorCount', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const hashA = 'a'.repeat(64);
    const manifest = AssayerCacheManifestStub({
      namespaces: { main: { files: [{ relPath: 'src/reader.ts', contentHash: hashA, analysisHash: hashA }] } },
    });
    proxy.setupManifest({ repoPath: '/config', manifest });
    proxy.setupBlob({
      repoPath: '/config',
      analysisHash: hashA,
      blob: CompiledFileBlobStub({ relPath: 'src/reader.ts', analysis: READER_ANALYSIS }),
    });
    proxy.sourceRootRepoRoot({ repoPath: '/config', repoRoot: '../repo' });
    proxy.sourceReads({ root: '/repo', relPath: 'src/reader.ts', content: READER_SOURCE });
    proxy.siblingResolvesTo({ fileName: '/repo/src/types.ts', source: TYPES_SOURCE, specifier: './types' });

    const result = await compiledTreeResolveBroker({ repoPath: '/config' });

    expect(result.nodes).toStrictEqual([
      { name: 'src', path: 'src', kind: 'dir', children: [{ name: 'reader.ts', path: 'src/reader.ts', kind: 'file' }] },
    ]);
  });

  it('VALID: {cached blob is missing on disk} => gracefully skips error count and returns file without errorCount', async () => {
    const proxy = compiledTreeResolveBrokerProxy();
    const hashA = 'a'.repeat(64);
    const manifest = AssayerCacheManifestStub({
      namespaces: {
        main: {
          files: [
            { relPath: 'a.ts', contentHash: hashA, analysisHash: hashA },
          ],
        },
      },
    });
    proxy.setupManifest({ repoPath: '/repo', manifest });
    proxy.missingBlob({ repoPath: '/repo', analysisHash: hashA });

    const result = await compiledTreeResolveBroker({ repoPath: '/repo' });

    expect(result.nodes).toStrictEqual([
      { name: 'a.ts', path: 'a.ts', kind: 'file' },
    ]);
  });
});
