/**
 * PURPOSE: Resolves the merged stub view for the current namespace out of the on-disk cache — the
 *   twin of the compiled-tree resolver. Loads the manifest, finds the current (commitless) namespace,
 *   reads that namespace's DERIVED stub index from `.assayer/cache/stubs/<namespace>.json`, loads the
 *   COMMITTED `assayer/stubs/` overlay from the SOURCE repo root (where the corrections are committed,
 *   NOT the cache dir), and combines the two at read time via `stubViewTransformer` — never persisted.
 *   The result is the StubView the `/stubs` view renders: every object/env stub in isolation, its
 *   readers, per-property values, and its `unknown` properties.
 *
 *   When no cache manifest exists yet (dev / first run before any `assayer` compile), or the namespace
 *   has no stub index, returns a contract-valid EMPTY view (no object stubs, no env stubs) so the view
 *   renders its empty-state terminal cleanly instead of the desktop main throwing ENOENT — exactly like
 *   the tree resolver.
 *
 * USAGE:
 * const view = await stubIndexResolveBroker({ repoPath: RepoPathStub({ value: '/repo' }) });
 * // Returns the validated StubView (derived stubs merged with the committed overlay) for the current namespace
 */
import { stubViewContract } from '@assayer/shared/contracts';
import type { StubView } from '@assayer/shared/contracts';
import { stubOverlayLoadBroker } from '@assayer/core/brokers';
import { stubViewTransformer } from '@assayer/core/transformers';

import { cacheLoadManifestBroker } from '../../cache/load-manifest/cache-load-manifest-broker';
import { cacheLoadStubIndexBroker } from '../../cache/load-stub-index/cache-load-stub-index-broker';
import { repoSourceRootBroker } from '../../repo/source-root/repo-source-root-broker';
import { nodeFsCacheManifestExistsAdapter } from '../../../adapters/node-fs/cache-manifest-exists/node-fs-cache-manifest-exists-adapter';
import { currentNamespaceTransformer } from '../../../transformers/current-namespace/current-namespace-transformer';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const stubIndexResolveBroker = async ({ repoPath }: { repoPath: RepoPath }): Promise<StubView> => {
  const manifestExists = await nodeFsCacheManifestExistsAdapter({ repoPath });

  if (!manifestExists) {
    return stubViewContract.parse({ objectStubs: [], envStubs: [] });
  }

  const manifest = await cacheLoadManifestBroker({ repoPath });
  const { namespaceName } = currentNamespaceTransformer({ manifest });
  const index = await cacheLoadStubIndexBroker({ repoPath, namespace: namespaceName });

  if (index === undefined) {
    return stubViewContract.parse({ objectStubs: [], envStubs: [] });
  }

  // The overlay is read from the SOURCE repo root (committed there), the derived index from the cache
  // dir --repo points at — combined here at read time, never re-derived and never persisted merged.
  const root = await repoSourceRootBroker({ repoPath });
  const overlays = await stubOverlayLoadBroker({ repoRoot: String(root) });

  return stubViewTransformer({ index, overlays });
};
