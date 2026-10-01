/**
 * PURPOSE: Builds a valid GatherEnvReads for tests
 *
 * USAGE:
 * GatherEnvReadsStub();
 * // Returns a valid GatherEnvReads
 */

import { gatherEnvReadsContract } from "./gather-env-reads-contract";
import type { GatherEnvReads } from "./gather-env-reads-contract";

export const GatherEnvReadsStub = (): GatherEnvReads =>
  gatherEnvReadsContract.parse([]);
