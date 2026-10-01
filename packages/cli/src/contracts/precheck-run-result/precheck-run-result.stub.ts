/**
 * PURPOSE: Builds a valid PrecheckRunResult for tests
 *
 * USAGE:
 * PrecheckRunResultStub();
 * // Returns a valid PrecheckRunResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { AssayerConfigStub } from "@assayer/shared/contracts/assayer-config/assayer-config.stub";

import { precheckRunResultContract } from "./precheck-run-result-contract";
import type { PrecheckRunResult } from "./precheck-run-result-contract";

export const PrecheckRunResultStub = ({
  ...props
}: StubArgument<PrecheckRunResult> = {}): PrecheckRunResult =>
  precheckRunResultContract.parse({
    configDir: "sample",
    root: "sample",
    config: AssayerConfigStub(),
    ...props,
  });
