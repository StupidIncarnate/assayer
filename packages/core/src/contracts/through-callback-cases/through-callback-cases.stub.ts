/**
 * PURPOSE: Builds a valid ThroughCallbackCases for tests
 *
 * USAGE:
 * ThroughCallbackCasesStub();
 * // Returns a valid ThroughCallbackCases
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";
import { FunctionAnalysisStub } from "@assayer/shared/contracts/function-analysis/function-analysis.stub";

import { throughCallbackCasesContract } from "./through-callback-cases-contract";
import type { ThroughCallbackCases } from "./through-callback-cases-contract";

export const ThroughCallbackCasesStub = ({
  ...props
}: StubArgument<ThroughCallbackCases> = {}): ThroughCallbackCases =>
  throughCallbackCasesContract.parse({
    analysis: FunctionAnalysisStub(),
    unfillable: [],
    ...props,
  });
