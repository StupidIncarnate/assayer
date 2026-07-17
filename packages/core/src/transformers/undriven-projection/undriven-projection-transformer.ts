/**
 * PURPOSE: Projects the walk's scopes that hold branch logic NOTHING WILL DRIVE into undriven
 *   entries — the analysis's admission of what it read perfectly and never drove.
 *
 *   Two ways a scope earns that, and they are the same shape at different depths: nothing can reach
 *   it (a private helper — driving it directly is not a test anyone wants), or something can reach it
 *   but nothing about it VARIES (a module scope whose branching turns only on values welded into the
 *   source). Branches are what makes either matter: a scope with no branches has no logic to miss,
 *   and admitting every private one-liner would bury the admissions that mean something.
 *
 *   A module scope reading the environment is therefore NOT here, and that is the whole point of
 *   asking `env-operands` rather than asking the access kind alone. Importing the module runs it, and
 *   the environment it reads on the way is an input like any other — so a case that writes the
 *   variable before the import picks the arm, and the case set drives it. This projection and the
 *   case set key on the same question so they stay exact complements: whatever one takes, the other
 *   must not.
 *
 *   It reads the WALK rather than the analysis because the analysis is where these scopes stop: only
 *   exported functions and a branching module scope are projected as entries, so a private helper is
 *   never an entry to filter — and asking the entries what is missing from the entries answers
 *   nothing. The walk is the only model that still holds them, which is exactly why `darkSpots` is
 *   projected from it too.
 *
 *   The reason is chosen by ACCESS because the two are undriven for genuinely different reasons and
 *   P1 forbids one vague sentence covering both. One is a debt no feature will ever pay — a `const`
 *   welded to a literal cannot be varied by anything, so its branching is decided at authoring time
 *   and there is nothing to drive it TO. The other is a missing feature, named. That is prose, not
 *   analysis: the finding above it is uniform, and no rung gets its own rule.
 *
 *   The span is the scope's own, copied straight off the walk's record of it. That is the only source
 *   there is: the walk measured the node, and a span recovered any other way — matching the name
 *   against another projection, re-reading the file — would be a second opinion about a fact this
 *   model already holds, free to drift from the scope these very branches were counted in.
 *
 * USAGE:
 * undrivenProjectionTransformer({ walked });
 * // Returns [{ name: '*module*', reason: 'nothing about it varies…', startLine: 1, endLine: 8 }]
 */
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { envOperandsTransformer } from '../env-operands/env-operands-transformer';

export const undrivenProjectionTransformer = ({ walked }: { walked: WalkFileResult }): UndrivenEntry[] =>
  walked.success
    ? walked.scopes
        .filter(
          (scope) =>
            scope.branches.length > 0 &&
            (scope.access.kind === 'unreachable' ||
              (scope.access.kind === 'module' && envOperandsTransformer({ branches: scope.branches }).length === 0)),
        )
        .map((scope) =>
          undrivenEntryContract.parse({
            name: scope.name,
            startLine: scope.startLine,
            endLine: scope.endLine,
            reason:
              scope.access.kind === 'module'
                ? 'nothing about it varies, so no case could drive its branches anywhere they do not ' +
                  'already go: it runs at import time, and every operand its top-level branching turns on ' +
                  'is welded to a value written in this file. No harness closes this and no feature will — ' +
                  'a branch with one possible outcome is decided here, in the source, not at run time. ' +
                  'Read an operand from the environment instead and Assayer drives it: a top-level ' +
                  '`const x = Number(process.env.X)` makes X an input, and each arm becomes a case that ' +
                  'sets it and imports the module fresh.'
                : 'it is not exported, so nothing outside the module can call it and no case drove its ' +
                  'branches. No harness closes this — driving a private directly is not a test anyone wants, ' +
                  'and covering it THROUGH the callers that do reach it needs call-graph following, which ' +
                  'Assayer does not do yet.',
          }),
        )
    : [];
