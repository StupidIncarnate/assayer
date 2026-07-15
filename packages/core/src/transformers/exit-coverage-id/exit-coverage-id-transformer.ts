/**
 * PURPOSE: Builds an exit's coverage ID from the guard path that reaches it. The segment names the
 *   BRANCHES crossed, not just the arms taken, and that distinction is the whole point: an exit
 *   keyed `return@if-then` collides with every other `then`-return in the same scope, and the
 *   ref-to-ref diff keys on exactly these IDs — so a collision silently merges two different exits
 *   into one and the diff stops being able to show you that one of them changed.
 *
 *   Each branch ID is already a structural projection of its condition, so reordering two DISTINCT
 *   branches leaves every ID untouched (the diff must show nothing for a reorder) while two branches
 *   that genuinely differ produce genuinely different exits. The scope prefix is stripped from each
 *   step because the ID already carries it once.
 *
 * USAGE:
 * exitCoverageIdTransformer({ kind: 'return', guardPath, scopePath: ['Classifier', 'classify'] });
 * // Returns 'Classifier/classify/return@if:id:value,GreaterThanToken,num:5#then' (branded CoverageId)
 */
import type { CoverageId, GuardStep, SymbolName } from '@assayer/shared/contracts';

import { coverageIdTransformer } from '../coverage-id/coverage-id-transformer';

export const exitCoverageIdTransformer = ({
  kind,
  guardPath,
  scopePath,
}: {
  kind: string;
  guardPath: GuardStep[];
  scopePath: SymbolName[];
}): CoverageId => {
  const prefix = `${scopePath.join('/')}/`;

  const steps = guardPath.map((step) => {
    const local = step.branchCoverageId.startsWith(prefix)
      ? step.branchCoverageId.slice(prefix.length)
      : step.branchCoverageId;
    return `${local}#${step.arm}`;
  });

  return coverageIdTransformer({
    scopePath,
    segment: steps.length === 0 ? `${kind}@top` : `${kind}@${steps.join('/')}`,
  });
};
