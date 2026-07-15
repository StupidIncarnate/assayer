/**
 * PURPOSE: Projects the walk's unhandled nodes into dark spots — the map's admission of what it
 *   could not follow. It is a filter, not a search: the walk already recorded every load-bearing
 *   node it failed to claim, so honesty here costs nothing and cannot be forgotten. That is the
 *   point of recording them at dispatch time rather than inferring them later — a blind spot the
 *   analyzer has to go looking for is one it will eventually stop finding.
 *
 * USAGE:
 * darkSpotProjectionTransformer({ walked });
 * // Returns [{ kind: 'ForOfStatement', scopePath: ['*module*', 'sumAll'], reason: 'unhandled-syntax', … }]
 */
import { darkSpotContract } from '@assayer/shared/contracts';
import type { DarkSpot } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

export const darkSpotProjectionTransformer = ({ walked }: { walked: WalkFileResult }): DarkSpot[] =>
  walked.success
    ? walked.nodes
        .filter((node) => !node.handled)
        .map((node) =>
          darkSpotContract.parse({
            kind: node.kind,
            scopePath: node.scopePath,
            reason: 'unhandled-syntax',
            startLine: node.startLine,
            endLine: node.endLine,
          }),
        )
    : [];
