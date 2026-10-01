/**
 * PURPOSE: Builds a valid CrossFileMapReaches for tests
 *
 * USAGE:
 * CrossFileMapReachesStub();
 * // Returns a valid CrossFileMapReaches
 */

import { crossFileMapReachesContract } from "./cross-file-map-reaches-contract";
import type { CrossFileMapReaches } from "./cross-file-map-reaches-contract";

export const CrossFileMapReachesStub = (): CrossFileMapReaches =>
  crossFileMapReachesContract.parse([]);
