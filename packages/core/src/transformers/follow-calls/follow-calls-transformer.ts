/**
 * PURPOSE: Follows same-file call edges to decide what becomes of each branching PRIVATE — a scope
 *   nothing can call directly. The trigger is always a branch: a private with no branches has no logic
 *   to miss. For each such callee it asks the reachable (named) scopes whether any REACHES it
 *   unconditionally and passes the caller's own parameters straight into it. If one does, the callee
 *   is DRIVEN through that caller (`through-caller-cases`); otherwise its branches cannot be steered
 *   and it is admitted UNDRIVEN, worded by WHY — reached only through fixed arguments, or reached by
 *   nothing at all.
 *
 *   "Passes straight through" is the v1 rung: every callee parameter is a plain reference to one of
 *   the caller's own parameters, at an unconditionally-reached call. An argument that transforms an
 *   input, a call guarded by a branch that a representative fill might route around, or a caller that
 *   is not itself directly reachable are all left for later rungs — driving any of them could arrange
 *   a caller that never reaches the call, failing a case against correct code.
 *
 *   The split between the two admissions is WHO owes the work. A private reached only through a fixed
 *   argument is UNDRIVEN — Assayer understood it and cannot steer its branch, an admission it owns. A
 *   private nothing calls at all is a dead-surface LINT — the repo's debt, because an unexported
 *   helper is reachable only from its own file and this one reaches it from nowhere.
 *
 * USAGE:
 * followCallsTransformer({ walked });
 * // Returns { followedEntries: [FunctionAnalysis], undriven: [UndrivenEntry], lints: [LintEntry] }
 */
import { lintEntryContract, undrivenEntryContract } from '@assayer/shared/contracts';
import type { FunctionAnalysis, LintEntry, UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { throughCallerCasesTransformer } from '../through-caller-cases/through-caller-cases-transformer';

const FIXED_ARG_REASON =
  'it is reached only through arguments fixed in the source, so no case can steer it to another ' +
  'branch: a caller welds a value into the call, and a branch with one possible outcome is decided ' +
  'there, not at run time. No harness closes this — a caller that passed its own input straight ' +
  'through instead would make each arm a case that sets it, and Assayer would drive it.';

const DEAD_SURFACE_MESSAGE =
  'nothing in this file calls it, so it is dead surface: an unexported helper is reachable only from ' +
  'its own file, and nothing here reaches it. Delete it, or consume it from a caller that passes an ' +
  'input straight through — which the follower would then drive.';

export const followCallsTransformer = ({
  walked,
}: {
  walked: WalkFileResult;
}): { followedEntries: FunctionAnalysis[]; undriven: UndrivenEntry[]; lints: LintEntry[] } => {
  if (!walked.success) {
    return { followedEntries: [], undriven: [], lints: [] };
  }

  const { scopes } = walked;
  const reachable = scopes.filter((scope) => scope.access.kind === 'named');

  const results = scopes
    .filter((scope) => scope.access.kind === 'unreachable' && scope.branches.length > 0)
    .map((callee) => {
      const drives = reachable.flatMap((caller) => {
        // Precomputed so the passthrough check below is a Set membership, not a nested scan.
        const callerParams = new Set(caller.params.map((param) => param.name));
        return caller.calls
          .filter(
            (call) =>
              call.callee.target === 'local' &&
              call.callee.name === callee.name &&
              call.callee.startLine === callee.startLine &&
              call.guardPath.length === 0 &&
              callee.params.every((_param, index) => {
                const arg = call.args[index];
                return arg !== undefined && arg.kind === 'param-ref' && callerParams.has(arg.paramName);
              }),
          )
          .map((call) => ({ caller, call }));
      });

      const isCalled = scopes.some((scope) =>
        scope.calls.some(
          (call) =>
            call.callee.target === 'local' && call.callee.name === callee.name && call.callee.startLine === callee.startLine,
        ),
      );

      return { callee, driver: drives[0], isCalled };
    });

  return {
    followedEntries: results.flatMap(({ callee, driver }) =>
      driver === undefined ? [] : [throughCallerCasesTransformer({ callee, caller: driver.caller, call: driver.call })],
    ),
    // Reached but unsteerable: understood, not drivable — Assayer's admission.
    undriven: results.flatMap(({ callee, driver, isCalled }) =>
      driver === undefined && isCalled
        ? [
            undrivenEntryContract.parse({
              name: callee.name,
              startLine: callee.startLine,
              endLine: callee.endLine,
              reason: FIXED_ARG_REASON,
            }),
          ]
        : [],
    ),
    // Reached by nothing: dead code — the repo's debt to change.
    lints: results.flatMap(({ callee, driver, isCalled }) =>
      driver === undefined && !isCalled
        ? [
            lintEntryContract.parse({
              rule: 'dead-surface',
              name: callee.name,
              message: DEAD_SURFACE_MESSAGE,
              startLine: callee.startLine,
              endLine: callee.endLine,
            }),
          ]
        : [],
    ),
  };
};
