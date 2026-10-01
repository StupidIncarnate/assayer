/**
 * PURPOSE: Builds a valid ManifestLoadResult for tests
 *
 * USAGE:
 * ManifestLoadResultStub();
 * // Returns a valid ManifestLoadResult
 */
import { AssayerCacheManifestStub } from "@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub";

import { manifestLoadResultContract } from "./manifest-load-result-contract";
import type { ManifestLoadResult } from "./manifest-load-result-contract";

export const ManifestLoadResultStub = (): ManifestLoadResult =>
  manifestLoadResultContract.parse({
    status: "ok",
    manifest: AssayerCacheManifestStub(),
  });
