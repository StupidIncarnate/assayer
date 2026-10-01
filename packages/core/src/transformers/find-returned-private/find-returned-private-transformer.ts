/**
 * PURPOSE: For one exit of a scope, finds the same-file branching PRIVATE whose result that exit
 *   RETURNS — the link a named-call funnel follows. An exit `return inner(m)` is produced by the local
 *   call `inner(m)` written on the exit's own line and reached under the exit's own guard path; when
 *   that call targets a same-file unexported scope that BRANCHES, the exit funnels that private's cases
 *   up. A leaf exit — a literal return, a call to an import, or a call to a branchless helper — matches
 *   nothing, so its case stays put.
 *
 *   Matching is by AST facts the walk already recorded, never by text: the call's target link (`local`
 *   name + start line), its written line, and its guard path compared step-for-step against the exit's.
 *
 * USAGE:
 * findReturnedPrivateTransformer({ scope: outer, exit: outerReturn, scopes });
 * // Returns { privateScope: innerRecord, call: innerCallSite } or undefined
 */
import { findReturnedPrivateContract } from '../../contracts/find-returned-private/find-returned-private-contract';
import type { FindReturnedPrivate } from '../../contracts/find-returned-private/find-returned-private-contract';
import type { ExitNode } from '@assayer/shared/contracts';

import type { ScopeRecord } from '../../contracts/scope-record/scope-record-contract';

export const findReturnedPrivateTransformer = ({
  scope,
  exit,
  scopes,
}: {
  scope: ScopeRecord;
  exit: ExitNode;
  scopes: ScopeRecord[];
}): FindReturnedPrivate | undefined => {
  if (exit.kind !== 'return') {
    return undefined;
  }

  // The call written on the exit's own line, reached under the same guards — the `return <call>` whose
  // result becomes this exit's value. Guard paths are compared step-for-step so a call in one arm never
  // matches the exit of another.
  const call = scope.calls.find(
    (candidate) =>
      candidate.callee.target === 'local' &&
      candidate.position.line === exit.line &&
      candidate.guardPath.length === exit.guardPath.length &&
      candidate.guardPath.every((step, index) => {
        const exitStep = exit.guardPath[index];
        return (
          exitStep !== undefined &&
          String(step.branchCoverageId) === String(exitStep.branchCoverageId) &&
          String(step.arm) === String(exitStep.arm)
        );
      }),
  );

  if (call === undefined || call.callee.target !== 'local') {
    return undefined;
  }

  const calleeName = call.callee.name;
  const calleeLine = call.callee.startLine;

  // The private this local call links to: an unexported same-file scope matched by name + start line
  // (the walk's local-callee key) that BRANCHES — a branchless helper has no logic to funnel.
  const privateScope = scopes.find(
    (candidate) =>
      candidate.access.kind === 'unreachable' &&
      String(candidate.name) === String(calleeName) &&
      candidate.startLine === calleeLine &&
      candidate.branches.length > 0,
  );

  return privateScope === undefined ? undefined : findReturnedPrivateContract.parse({ privateScope, call });
};
