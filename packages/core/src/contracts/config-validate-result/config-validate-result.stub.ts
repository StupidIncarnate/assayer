/**
 * PURPOSE: Builds a valid ConfigValidateResult for tests
 *
 * USAGE:
 * ConfigValidateResultStub();
 * // Returns a valid ConfigValidateResult
 */
import { AssayerConfigStub } from "@assayer/shared/contracts/assayer-config/assayer-config.stub";

import { configValidateResultContract } from "./config-validate-result-contract";
import type { ConfigValidateResult } from "./config-validate-result-contract";

export const ConfigValidateResultStub = (): ConfigValidateResult =>
  configValidateResultContract.parse({
    success: true,
    config: AssayerConfigStub(),
  });
