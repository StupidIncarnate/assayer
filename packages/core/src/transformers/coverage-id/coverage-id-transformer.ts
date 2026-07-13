/**
 * PURPOSE: Builds a cache-internal coverage ID by joining a scope path and a segment with a slash.
 *   The segment encodes the branch condition or the exit's guard-path arms — NEVER a line number —
 *   so the ID survives reformatting and changes only when the logic changes.
 *
 * USAGE:
 * coverageIdTransformer({ scope: 'formatGreeting', segment: 'if:name.length===0' });
 * // Returns 'formatGreeting/if:name.length===0' (branded CoverageId)
 */
import { coverageIdContract } from '@assayer/shared/contracts';
import type { CoverageId } from '@assayer/shared/contracts';

export const coverageIdTransformer = ({ scope, segment }: { scope: string; segment: string }): CoverageId =>
  coverageIdContract.parse(`${scope}/${segment}`);
