/**
 * PURPOSE: Builds a valid CompileStubGraphResult for tests
 *
 * USAGE:
 * CompileStubGraphResultStub();
 * // Returns a valid CompileStubGraphResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { StubIndexStub } from "@assayer/shared/contracts/stub-index/stub-index.stub";

import { compileStubGraphResultContract } from "./compile-stub-graph-result-contract";
import type { CompileStubGraphResult } from "./compile-stub-graph-result-contract";

export const CompileStubGraphResultStub = ({
  ...props
}: StubArgument<CompileStubGraphResult> = {}): CompileStubGraphResult =>
  compileStubGraphResultContract.parse({
    index: StubIndexStub(),
    guards: [],
    ...props,
  });
