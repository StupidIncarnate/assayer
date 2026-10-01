/**
 * PURPOSE: Builds a valid StubContradictions for tests
 *
 * USAGE:
 * StubContradictionsStub();
 * // Returns a valid StubContradictions
 */

import { stubContradictionsContract } from "./stub-contradictions-contract";
import type { StubContradictions } from "./stub-contradictions-contract";

export const StubContradictionsStub = (): StubContradictions =>
  stubContradictionsContract.parse([]);
