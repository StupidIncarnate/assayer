/**
 * PURPOSE: Builds a valid FunnelCases for tests
 *
 * USAGE:
 * FunnelCasesStub();
 * // Returns a valid FunnelCases
 */
import type { StubArgument } from "@dungeonmaster/shared/@types";

import { funnelCasesContract } from "./funnel-cases-contract";
import type { FunnelCases } from "./funnel-cases-contract";

export const FunnelCasesStub = ({
  ...props
}: StubArgument<FunnelCases> = {}): FunnelCases =>
  funnelCasesContract.parse({ cases: [], unfillable: [], ...props });
