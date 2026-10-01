/**
 * PURPOSE: Builds a valid CompileResolveGraphResult for tests
 *
 * USAGE:
 * CompileResolveGraphResultStub();
 * // Returns a valid CompileResolveGraphResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { ResolvedIndexStub } from "@assayer/shared/contracts/resolved-index/resolved-index.stub";

import { compileResolveGraphResultContract } from "./compile-resolve-graph-result-contract";
import type { CompileResolveGraphResult } from "./compile-resolve-graph-result-contract";

export const CompileResolveGraphResultStub = ({
  ...props
}: StubArgument<CompileResolveGraphResult> = {}): CompileResolveGraphResult =>
  compileResolveGraphResultContract.parse({
    index: ResolvedIndexStub(),
    errors: [],
    ...props,
  });
