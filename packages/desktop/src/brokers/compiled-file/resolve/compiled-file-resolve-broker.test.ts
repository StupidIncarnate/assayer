import {
  AssayerCacheManifestStub,
  CompiledFileBlobStub,
  FileAnalysisStub,
  RelPathStub,
  ResolvedEdgeStub,
  ResolvedIndexStub,
} from '@assayer/shared/contracts';

import { compiledFileResolveBroker } from './compiled-file-resolve-broker';
import { compiledFileResolveBrokerProxy } from './compiled-file-resolve-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('compiledFileResolveBroker', () => {
  describe('successful resolve', () => {
    it('VALID: {relPath present in current namespace} => resolves the compiled file view with no edges', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64) }],
          },
        },
      });
      const blob = CompiledFileBlobStub();

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/index.ts' }),
      });

      const { displayLines, nodes, contentHash } = blob;

      expect(result).toStrictEqual({ relPath: 'src/index.ts', contentHash, displayLines, nodes, resolvedEdges: [] });
    });

    it('VALID: {resolved index has edges from this file and others} => keeps only the edges whose from is this file', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/index.ts', contentHash: 'a'.repeat(64) }] } },
      });
      const ownEdge = ResolvedEdgeStub({
        from: 'src/index.ts',
        specifier: './greeting',
        importedName: 'greeting',
        target: { kind: 'local', relPath: 'src/greeting.ts' },
      });
      const otherEdge = ResolvedEdgeStub({ from: 'src/other.ts', specifier: './x', importedName: 'x' });
      const index = ResolvedIndexStub({ edges: [ownEdge, otherEdge] });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub() });
      proxy.setupResolvedIndex({ index });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/index.ts' }),
      });

      expect(result.resolvedEdges).toStrictEqual([ownEdge]);
    });
  });

  describe('cross-file predicate overlay', () => {
    it('VALID: {caller with a cross-file import-predicate guard} => serves the composed cases and the unreachable-exit lint', async () => {
      const composed = FileAnalysisStub({
        lints: [
          {
            rule: 'unreachable-exit',
            name: 'pick',
            message:
              '`pick` can never reach the exit on line 10: the guards on lines 5, 9 cannot all hold at once. Either a comparison is wrong, or this branch is dead and should be deleted.',
            startLine: 10,
            endLine: 10,
          },
        ],
      });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: FileAnalysisStub() }) });
      // Config dir is /config; the source root resolves a level away to /repo. The overlay must be
      // handed the SOURCE root, not the config dir.
      proxy.sourceRootRepoRoot({ repoRoot: '../repo' });
      proxy.composesTo({ analysis: composed });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/config' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(composed);
      expect(proxy.composeReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts' });
    });

    it('VALID: {plain caller with no imported-predicate guard} => serves the persisted analysis unchanged', async () => {
      const analysis = FileAnalysisStub();
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/grade.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/grade.ts', analysis }) });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/grade.ts' }),
      });

      expect(result.analysis).toStrictEqual(analysis);
    });

    it('EMPTY: {caller source cannot be read} => falls back to the opaque persisted analysis', async () => {
      const analysis = FileAnalysisStub();
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis }) });
      proxy.sourceMissing();

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(analysis);
    });
  });

  // The remaining links in the overlay chain (param-type, stub-arrange, cross-file-map, harness) all
  // default to a same-reference identity, exactly like the compose overlay above. Each gets its own
  // test proving TWO things a suite of identity-only mocks cannot: the link actually sits in the
  // chain (its distinguishing output reaches the final view) and it receives the true output of the
  // link before it (not the raw persisted analysis skipping past an earlier link).
  describe('param-type overlay', () => {
    it('VALID: {caller with an imported-type parameter} => serves the resolved-type analysis', async () => {
      const persisted = FileAnalysisStub();
      const typed = FileAnalysisStub({ gaps: [{ name: 'paramTypeMarker', reason: 'param-type overlay applied' }] });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: persisted }) });
      proxy.sourceRootRepoRoot({ repoRoot: '../repo' });
      proxy.resolvesParamTypesTo({ analysis: typed });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/config' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(typed);
      expect(proxy.paramTypeReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts', analysis: persisted });
    });
  });

  describe('stub-arrange overlay', () => {
    it('VALID: {caller with an object-member branch} => serves the arranged analysis', async () => {
      const persisted = FileAnalysisStub();
      const realized = FileAnalysisStub({ gaps: [{ name: 'arrangeMarker', reason: 'stub-arrange overlay applied' }] });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: persisted }) });
      proxy.sourceRootRepoRoot({ repoRoot: '../repo' });
      proxy.arrangesTo({ analysis: realized });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/config' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(realized);
      expect(proxy.arrangeReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts', analysis: persisted });
    });
  });

  describe('cross-file-map overlay', () => {
    it('VALID: {caller mapping an imported function over an array param} => serves the folded analysis', async () => {
      const persisted = FileAnalysisStub();
      const mapped = FileAnalysisStub({ gaps: [{ name: 'mapMarker', reason: 'cross-file-map overlay applied' }] });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: persisted }) });
      proxy.sourceRootRepoRoot({ repoRoot: '../repo' });
      proxy.mapsTo({ analysis: mapped });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/config' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(mapped);
      expect(proxy.mapReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts', analysis: persisted });
    });
  });

  describe('harness overlay', () => {
    it('VALID: {entry whose input gap a colocated harness pays} => serves the harness-driven analysis', async () => {
      const persisted = FileAnalysisStub();
      const harnessed = FileAnalysisStub({ gaps: [{ name: 'harnessMarker', reason: 'harness overlay applied' }] });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: persisted }) });
      proxy.sourceRootRepoRoot({ repoRoot: '../repo' });
      proxy.harnessesTo({ analysis: harnessed });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/config' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(harnessed);
      expect(proxy.harnessReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts', analysis: persisted });
    });

    // The harness overlay reads the COLOCATED harness file itself, never the caller's own walked AST
    // (its call carries no `walked`, unlike the other four overlays) — so unlike them it still applies
    // when the caller's OWN source cannot be read. A guard that skipped it alongside the others would
    // silently stop paying a harness-closed gap the moment a caller file went briefly unreadable.
    it('VALID: {caller source cannot be read} => the harness overlay still applies, since it never reads the caller AST', async () => {
      const persisted = FileAnalysisStub();
      const harnessed = FileAnalysisStub({ gaps: [{ name: 'harnessMarker', reason: 'harness overlay applied' }] });
      const manifest = AssayerCacheManifestStub({
        namespaces: { main: { files: [{ relPath: 'src/pick.ts', contentHash: 'a'.repeat(64) }] } },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });
      proxy.setupBlob({ blob: CompiledFileBlobStub({ relPath: 'src/pick.ts', analysis: persisted }) });
      proxy.sourceMissing();
      proxy.harnessesTo({ analysis: harnessed });

      const result = await compiledFileResolveBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        relPath: RelPathStub({ value: 'src/pick.ts' }),
      });

      expect(result.analysis).toStrictEqual(harnessed);
      expect(proxy.harnessReceived()).toStrictEqual({ root: '/repo', relPath: 'src/pick.ts', analysis: persisted });
    });
  });

  describe('error cases', () => {
    it('ERROR: {relPath not present in current namespace} => throws naming the requested relPath', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          main: {
            files: [{ relPath: 'other.ts', contentHash: 'a'.repeat(64) }],
          },
        },
      });

      const proxy = compiledFileResolveBrokerProxy();
      proxy.setupManifest({ manifest });

      await expect(
        compiledFileResolveBroker({
          repoPath: RepoPathStub({ value: '/repo' }),
          relPath: RelPathStub({ value: 'missing.ts' }),
        }),
      ).rejects.toThrow(/missing\.ts/u);
    });
  });
});
