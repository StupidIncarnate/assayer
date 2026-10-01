/**
 * PURPOSE: Builds a valid StableNamespaceLayerResult for tests
 *
 * USAGE:
 * StableNamespaceLayerResultStub();
 * // Returns a valid StableNamespaceLayerResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { CompileModeStub } from "@assayer/shared/contracts/compile-mode/compile-mode.stub";

import { stableNamespaceLayerResultContract } from "./stable-namespace-layer-result-contract";
import type { StableNamespaceLayerResult } from "./stable-namespace-layer-result-contract";

export const StableNamespaceLayerResultStub = ({
  ...props
}: StubArgument<StableNamespaceLayerResult> = {}): StableNamespaceLayerResult =>
  stableNamespaceLayerResultContract.parse({
    resultEntry: {
      namespace: "sample",
      branch: "sample",
      mode: CompileModeStub(),
      fileCount: 0,
    },
    manifestNamespace: { branch: "sample", files: [] },
    harnesses: [],
    errors: [],
    ...props,
  });
