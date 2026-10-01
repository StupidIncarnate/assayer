/**
 * PURPOSE: Builds a valid CompilePlanStableResult for tests
 *
 * USAGE:
 * CompilePlanStableResultStub();
 * // Returns a valid CompilePlanStableResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { CompileModeStub } from "@assayer/shared/contracts/compile-mode/compile-mode.stub";

import { compilePlanStableResultContract } from "./compile-plan-stable-result-contract";
import type { CompilePlanStableResult } from "./compile-plan-stable-result-contract";

export const CompilePlanStableResultStub = ({
  ...props
}: StubArgument<CompilePlanStableResult> = {}): CompilePlanStableResult =>
  compilePlanStableResultContract.parse({
    mode: CompileModeStub(),
    targets: [],
    harnesses: [],
    ...props,
  });
