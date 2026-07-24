/**
 * PURPOSE: Stamps a welded-value map onto every branch's condition — the branch-list twin of
 *   `stamp-const-leaves` (which stamps ONE condition). A caller that welds a literal into a callee's
 *   parameter pins the single value that operand can take, so each branch reading it EVALUATES to its
 *   live arm (a case) and its dead arm (an unreachable exit) instead of being admitted undriven. Every
 *   follower that drives a callee through welded arguments needs the whole branch list stamped, so this
 *   is the one place that maps `stamp-const-leaves` across it.
 *
 * USAGE:
 * stampBranchesTransformer({ branches, welds: new Map([['value', 3]]) });
 * // Returns the branches with the welded value stamped onto every leaf that reads `value`
 */
import type { BranchNode, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import { stampConstLeavesTransformer } from '../stamp-const-leaves/stamp-const-leaves-transformer';

export const stampBranchesTransformer = ({
  branches,
  welds,
}: {
  branches: BranchNode[];
  welds: Map<SymbolName, RepresentativeValue>;
}): BranchNode[] =>
  welds.size === 0
    ? branches
    : branches.map((branch) => ({ ...branch, condition: stampConstLeavesTransformer({ condition: branch.condition, welds }) }));
