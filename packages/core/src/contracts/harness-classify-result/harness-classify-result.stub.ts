/**
 * PURPOSE: Builds a valid HarnessClassifyResult for tests
 *
 * USAGE:
 * HarnessClassifyResultStub();
 * // Returns a valid HarnessClassifyResult
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";

import { harnessClassifyResultContract } from "./harness-classify-result-contract";
import type { HarnessClassifyResult } from "./harness-classify-result-contract";

export const HarnessClassifyResultStub = ({
  ...props
}: StubArgument<HarnessClassifyResult> = {}): HarnessClassifyResult =>
  harnessClassifyResultContract.parse({ targets: [], harnesses: [], ...props });
