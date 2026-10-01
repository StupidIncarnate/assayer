/**
 * PURPOSE: Builds a valid HarnessLoadResult for tests
 *
 * USAGE:
 * HarnessLoadResultStub();
 * // Returns a valid HarnessLoadResult
 */

import { harnessLoadResultContract } from "./harness-load-result-contract";
import type { HarnessLoadResult } from "./harness-load-result-contract";

export const HarnessLoadResultStub = (): HarnessLoadResult =>
  harnessLoadResultContract.parse({ ok: true, declarations: [] });
