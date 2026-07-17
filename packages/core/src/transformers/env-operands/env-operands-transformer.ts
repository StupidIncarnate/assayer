/**
 * PURPOSE: Names the environment variables a set of branches is actually DECIDED by — the operands
 *   the walk recorded as environment reads, deduped, in first-seen order.
 *
 *   It exists so that "is this scope drivable?" has ONE answer rather than two that can drift. The
 *   question is asked from both sides: the case set drives what it can, and the undriven projection
 *   admits what it cannot, and those are complements — a scope both drove and admitted, or neither,
 *   is the reads-as-complete lie either way round. Keying both on this keeps them exact opposites by
 *   construction.
 *
 *   It reads the BRANCHES rather than the derived cases, because the undriven projection has no
 *   cases to read: it works off the walk, where a private helper still exists and an entry does not
 *   yet. Branches are the one model both callers hold.
 *
 *   Non-empty is what makes a module scope worth driving. A module whose branching turns only on
 *   values welded into the source — `const value = 7` — takes no input, so every case it derives
 *   arranges nothing, and the two of them are identical setups claiming different exits: at most one
 *   could ever hold. Driving those would fail a case against correct code. Reading even one operand
 *   from the environment is what makes the arms choosable, and this is the question that says so.
 *
 * USAGE:
 * envOperandsTransformer({ branches: scope.branches });
 * // Returns ['VALUE'] for a module scope branching on Number(process.env.VALUE), or []
 */
import type { BranchNode, EnvVarName } from '@assayer/shared/contracts';

import { conditionLeavesTransformer } from '../condition-leaves/condition-leaves-transformer';

export const envOperandsTransformer = ({ branches }: { branches: readonly BranchNode[] }): EnvVarName[] => [
  ...new Set(
    branches.flatMap((branch) =>
      conditionLeavesTransformer({ condition: branch.condition }).flatMap((leaf) =>
        leaf.operandEnvVarName === undefined ? [] : [leaf.operandEnvVarName],
      ),
    ),
  ),
];
