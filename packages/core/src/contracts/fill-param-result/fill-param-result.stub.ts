/**
 * PURPOSE: Builds a valid FillParamResult for tests
 *
 * USAGE:
 * FillParamResultStub();
 * // Returns a valid FillParamResult
 */
import { ArrangeBindingStub } from "@assayer/shared/contracts/arrange-binding/arrange-binding.stub";

import { fillParamResultContract } from "./fill-param-result-contract";
import type { FillParamResult } from "./fill-param-result-contract";

export const FillParamResultStub = (): FillParamResult =>
  fillParamResultContract.parse({
    kind: "filled",
    binding: ArrangeBindingStub(),
  });
