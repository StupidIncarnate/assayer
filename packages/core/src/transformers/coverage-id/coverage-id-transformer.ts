/**
 * PURPOSE: Builds a cache-internal coverage ID by joining a scope PATH and a segment with slashes.
 *   The path is what distinguishes two entries that share a name — a class method
 *   (`Classifier/classify`) from a nested helper (`outer/classify`) — and it nests to any depth
 *   because the walk carries it down rather than reconstructing it.
 *
 *   The segment encodes the branch condition or the exit's guard path — NEVER a line number — so the
 *   ID survives reformatting and moves only when the logic moves.
 *
 * USAGE:
 * coverageIdTransformer({ scopePath: ['Classifier', 'classify'], segment: 'if:id:value' });
 * // Returns 'Classifier/classify/if:id:value' (branded CoverageId)
 */
import { coverageIdContract } from '@assayer/shared/contracts';
import type { CoverageId, SymbolName } from '@assayer/shared/contracts';

export const coverageIdTransformer = ({
  scopePath,
  segment,
}: {
  scopePath: SymbolName[];
  segment: string;
}): CoverageId => coverageIdContract.parse([...scopePath, segment].join('/'));
