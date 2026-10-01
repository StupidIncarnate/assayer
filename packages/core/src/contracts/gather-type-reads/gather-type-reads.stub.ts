/**
 * PURPOSE: Builds a valid GatherTypeReads for tests
 *
 * USAGE:
 * GatherTypeReadsStub();
 * // Returns a valid GatherTypeReads
 */

import { gatherTypeReadsContract } from "./gather-type-reads-contract";
import type { GatherTypeReads } from "./gather-type-reads-contract";

export const GatherTypeReadsStub = (): GatherTypeReads =>
  gatherTypeReadsContract.parse([]);
