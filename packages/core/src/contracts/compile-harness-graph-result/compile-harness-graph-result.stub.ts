/**
 * PURPOSE: Builds a valid CompileHarnessGraphResult for tests
 *
 * USAGE:
 * CompileHarnessGraphResultStub();
 * // Returns a valid CompileHarnessGraphResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { HarnessIndexStub } from "@assayer/shared/contracts/harness-index/harness-index.stub";

import { compileHarnessGraphResultContract } from "./compile-harness-graph-result-contract";
import type { CompileHarnessGraphResult } from "./compile-harness-graph-result-contract";

export const CompileHarnessGraphResultStub = ({
  ...props
}: StubArgument<CompileHarnessGraphResult> = {}): CompileHarnessGraphResult =>
  compileHarnessGraphResultContract.parse({
    index: HarnessIndexStub(),
    errors: [],
    ...props,
  });
