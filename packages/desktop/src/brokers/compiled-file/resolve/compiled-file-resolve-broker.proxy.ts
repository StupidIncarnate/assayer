import { registerMock } from '@dungeonmaster/testing/register-mock';
import { composeCrossFilePredicatesBroker, composeCrossFileMapBroker, harnessRealizeBroker, paramTypeResolveBroker, stubRealizeBroker, stubOverlayLoadBroker } from '@assayer/core/brokers';
import {
  composeCrossFilePredicatesBrokerProxy,
  composeCrossFileMapBrokerProxy,
  harnessRealizeBrokerProxy,
  paramTypeResolveBrokerProxy,
  stubRealizeBrokerProxy,
  stubOverlayLoadBrokerProxy,
  walkFileTransformerProxy,
} from '@assayer/core/testing';

import { cacheLoadManifestBrokerProxy } from '../../cache/load-manifest/cache-load-manifest-broker.proxy';
import { cacheLoadBlobBrokerProxy } from '../../cache/load-blob/cache-load-blob-broker.proxy';
import { cacheLoadResolvedIndexBrokerProxy } from '../../cache/load-resolved-index/cache-load-resolved-index-broker.proxy';
import { repoSourceRootBrokerProxy } from '../../repo/source-root/repo-source-root-broker.proxy';
import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';
import type { AssayerCacheManifestStub, CompiledFileBlobStub, FileAnalysisStub, ResolvedIndexStub } from '@assayer/shared/contracts';

export const compiledFileResolveBrokerProxy = (): {
  setupManifest: (params: {
    repoPath: string;
    manifest: ReturnType<typeof AssayerCacheManifestStub>;
  }) => void;
  setupBlob: (params: {
    repoPath: string;
    contentHash: string;
    blob: ReturnType<typeof CompiledFileBlobStub>;
  }) => void;
  setupResolvedIndex: (params: {
    repoPath: string;
    namespace: string;
    index: ReturnType<typeof ResolvedIndexStub>;
  }) => void;
  setupNoResolvedIndex: (params: { repoPath: string; namespace: string }) => void;
  sourceRootRepoRoot: (params: { repoRoot: string }) => void;
  sourceReads: (params: { root: string; relPath: string; content: string }) => void;
  sourceMissing: (params: { root: string; relPath: string }) => void;
  composesTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  composeReceived: () => unknown;
  resolvesParamTypesTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  paramTypeReceived: () => unknown;
  arrangesTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  arrangeReceived: () => unknown;
  mapsTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  mapReceived: () => unknown;
  harnessesTo: (params: { analysis: ReturnType<typeof FileAnalysisStub> }) => void;
  harnessReceived: () => unknown;
} => {
  const manifestProxy = cacheLoadManifestBrokerProxy();
  const blobProxy = cacheLoadBlobBrokerProxy();
  const resolvedIndexProxy = cacheLoadResolvedIndexBrokerProxy();
  // The source root resolves through a mocked config; each test stages the caller source it reads.
  const sourceRootProxy = repoSourceRootBrokerProxy();
  const sourceReadProxy = readFileIfExistsProxy();
  // The overlay is mocked at the seam it crosses: composing an imported predicate reaches for the
  // sibling file + tsconfig on disk, I/O a unit test cannot stage from another package. This mirrors
  // repoSourceRootBroker's proxy mocking configLoadBroker — the child proxy satisfies structure, the
  // direct registerMock is the intercept. The walk runs real (empty proxy); its result feeds the
  // mocked compose and is otherwise inert.
  // Imported-type resolution is mocked at the same seam and for the same reason: giving a parameter its
  // declared shape reaches for the sibling definition + tsconfig on disk. Its child proxy satisfies
  // structure; the direct registerMock is the intercept, a same-reference pass-through by default.
  paramTypeResolveBrokerProxy();
  const paramTypeHandle = registerMock({ fn: paramTypeResolveBroker });
  // Each of these six overlay brokers is its own distinct function reference (not shared with any
  // other proxy), and the resolve broker calls each at most once per resolve — one relPath, one
  // straight-line pipeline — so there is no second real call any of these could be confused with.
  // `calledWith([])`/`onceFor([])` are a blanket match on purpose, not a stand-in for a real argument.
  paramTypeHandle.calledWith([]).implement(({ analysis }) => analysis);
  composeCrossFilePredicatesBrokerProxy();
  walkFileTransformerProxy();
  const composeHandle = registerMock({ fn: composeCrossFilePredicatesBroker });
  // Default: a same-reference pass-through, so a file with no imported-predicate guard serves its
  // persisted analysis untouched.
  composeHandle.calledWith([]).implement(({ analysis }) => analysis);
  // The object-arrange overlay is mocked at the same seam for the same reason: driving an object-member
  // branch reaches for the type definition + the committed overlay on disk. Its child proxy satisfies
  // structure; the direct registerMock is the intercept, a same-reference pass-through by default.
  stubRealizeBrokerProxy();
  stubOverlayLoadBrokerProxy();
  const stubRealizeHandle = registerMock({ fn: stubRealizeBroker });
  stubRealizeHandle.calledWith([]).implement(({ analysis }) => analysis);
  const overlayLoadHandle = registerMock({ fn: stubOverlayLoadBroker });
  overlayLoadHandle.calledWith([]).resolves([]);
  // The cross-file-map fold is mocked at the same seam and for the same reason: folding an imported
  // callee reaches for the sibling file on disk. Its child proxy satisfies structure; the direct
  // registerMock is the intercept, a same-reference pass-through by default.
  composeCrossFileMapBrokerProxy();
  const composeMapHandle = registerMock({ fn: composeCrossFileMapBroker });
  composeMapHandle.calledWith([]).implement(({ analysis }) => analysis);
  // The harness overlay is mocked at the same seam and for the same reason: paying an input gap reaches
  // for the colocated harness on disk and RUNS it. Its child proxy satisfies structure; the direct
  // registerMock is the intercept, a same-reference pass-through by default.
  harnessRealizeBrokerProxy();
  const harnessRealizeHandle = registerMock({ fn: harnessRealizeBroker });
  harnessRealizeHandle.calledWith([]).implement(({ analysis }) => analysis);

  // The { root, relPath } the broker hands the overlay, captured off the real call so a test can
  // prove the SOURCE root (not the config dir) is threaded.
  const composeCalls: unknown[] = [];
  // The remaining three overlays (param-type, stub-arrange, cross-file-map) plus the harness overlay
  // all default to the SAME same-reference identity as compose, which means no test proves any one of
  // them is actually IN the chain rather than skipped: an identity mock can never disagree with "this
  // overlay was never called". Each capture below also records the `analysis` the overlay itself
  // received, so a test can prove it is the true output of the PRIOR link, not merely that a value
  // reaches the final result.
  const paramTypeCalls: unknown[] = [];
  const arrangeCalls: unknown[] = [];
  const mapCalls: unknown[] = [];
  const harnessCalls: unknown[] = [];

  return {
    setupManifest: ({ repoPath, manifest }): void => {
      manifestProxy.resolves({ repoPath, manifest });
    },
    setupBlob: ({ repoPath, contentHash, blob }): void => {
      blobProxy.resolves({ repoPath, contentHash, blob });
    },
    setupResolvedIndex: ({ repoPath, namespace, index }): void => {
      resolvedIndexProxy.resolves({ repoPath, namespace, index });
    },
    setupNoResolvedIndex: ({ repoPath, namespace }): void => {
      resolvedIndexProxy.absent({ repoPath, namespace });
    },
    sourceRootRepoRoot: ({ repoRoot }): void => {
      sourceRootProxy.configHasRepoRoot({ repoRoot });
    },
    sourceReads: ({ root, relPath, content }): void => {
      sourceReadProxy.returns({ path: `${root}/${relPath}`, contents: content });
    },
    sourceMissing: ({ root, relPath }): void => {
      sourceReadProxy.missing({ path: `${root}/${relPath}` });
    },
    composesTo: ({ analysis }): void => {
      composeHandle.onceFor([]).implement(({ root, relPath }) => {
        composeCalls.push({ root, relPath });

        return analysis;
      });
    },
    composeReceived: (): unknown => composeCalls.at(-1),
    resolvesParamTypesTo: ({ analysis }): void => {
      paramTypeHandle.onceFor([]).implement(({ root, relPath, analysis: received }) => {
        paramTypeCalls.push({ root, relPath, analysis: received });

        return analysis;
      });
    },
    paramTypeReceived: (): unknown => paramTypeCalls.at(-1),
    arrangesTo: ({ analysis }): void => {
      stubRealizeHandle.onceFor([]).implement(({ root, relPath, analysis: received }) => {
        arrangeCalls.push({ root, relPath, analysis: received });

        return analysis;
      });
    },
    arrangeReceived: (): unknown => arrangeCalls.at(-1),
    mapsTo: ({ analysis }): void => {
      composeMapHandle.onceFor([]).implement(({ root, relPath, analysis: received }) => {
        mapCalls.push({ root, relPath, analysis: received });

        return analysis;
      });
    },
    mapReceived: (): unknown => mapCalls.at(-1),
    harnessesTo: ({ analysis }): void => {
      // Annotated explicitly (from the already-imported broker's own signature, never a fresh type
      // import) because `MockStaging.implement` contextually types its callback's params as `never` —
      // every destructured field would otherwise read as `never`, which is fine for the fields merely
      // re-packaged below but makes `walked !== undefined` compare against a type with no values.
      harnessRealizeHandle.onceFor([]).implement((params: Parameters<typeof harnessRealizeBroker>[0]) => {
        const { root, relPath, analysis: received, walked } = params;

        // `walkedPassed` proves the WIRING, not merely that the overlay ran: the other four overlays
        // are always handed `walked`, and this one is the one a caller can forget — a same-reference
        // identity mock can never disagree with "the argument was dropped".
        harnessCalls.push({ root, relPath, analysis: received, walkedPassed: walked !== undefined });

        return analysis;
      });
    },
    harnessReceived: (): unknown => harnessCalls.at(-1),
  };
};
