/**
 * PURPOSE: Builds a valid HarnessValidate for tests
 *
 * USAGE:
 * HarnessValidateStub();
 * // Returns a valid HarnessValidate
 */

import { harnessValidateContract } from "./harness-validate-contract";
import type { HarnessValidate } from "./harness-validate-contract";

export const HarnessValidateStub = (): HarnessValidate =>
  harnessValidateContract.parse([]);
