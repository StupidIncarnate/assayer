/**
 * PURPOSE: Projects the MODULE scopes whose branch logic nothing will ever drive into undriven
 *   entries — a module scope that runs at import time but whose top-level branching turns only on
 *   values welded into its own source, so no input exists to vary. Importing it always takes the same
 *   arm; a case that claimed another would fail against correct code. This is a debt no feature pays:
 *   a branch with one possible outcome is decided in the source, not at run time.
 *
 *   A module scope reading the environment is therefore NOT here, and that is the whole point of
 *   asking `env-operands` rather than the access kind alone. Importing the module runs it, and the
 *   environment it reads on the way is an input like any other — so a case that writes the variable
 *   before the import picks the arm, and the case set drives it. This projection and the case set key
 *   on the same question so they stay exact complements: whatever one takes, the other must not.
 *
 *   PRIVATE helpers are NOT here: whether a private is driven, admitted undriven, or dead surface is a
 *   fact about its CALL EDGES, which only `follow-calls` can read (it drives a private through a
 *   caller that passes an input straight in). This projection reads the walk and knows nothing about
 *   who calls whom, so it would answer the private question wrongly — it owns only the module case,
 *   where the operand's source is the whole answer.
 *
 *   The span is the scope's own, copied straight off the walk's record of it — the only source there
 *   is, since a span recovered any other way could drift from the scope these branches were counted in.
 *
 * USAGE:
 * undrivenProjectionTransformer({ walked, relPath: 'src/sad-path/undriven-welded-const.ts' });
 * // Returns [{ name: '*module*', label: 'undriven-welded-const.ts', reason: '…', startLine: 1, endLine: 8 }]
 */
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import { envOperandsTransformer } from '../env-operands/env-operands-transformer';

export const undrivenProjectionTransformer = ({
  walked,
  relPath,
}: {
  walked: WalkFileResult;
  relPath?: string;
}): UndrivenEntry[] =>
  walked.success
    ? walked.scopes
        .filter(
          (scope) =>
            scope.access.kind === 'module' &&
            scope.branches.length > 0 &&
            envOperandsTransformer({ branches: scope.branches }).length === 0,
        )
        .map((scope) => {
          const exportName = scope.exportedBindings.length === 1 ? scope.exportedBindings[0] : undefined;
          // The module scope renders by its LABEL, never the internal `*module*`: the single exported
          // binding when there is one, else the file basename. `name` stays `*module*` because it keys
          // the driven/undriven match; `label` is DISPLAY only. Without a relPath (a synthetic caller),
          // the label falls away and the surface shows the name.
          const label =
            relPath === undefined ? undefined : moduleEntryLabelTransformer({ ...(exportName === undefined ? {} : { exportName }), relPath });
          return undrivenEntryContract.parse({
            name: scope.name,
            ...(label === undefined ? {} : { label }),
            startLine: scope.startLine,
            endLine: scope.endLine,
            reason:
              'nothing about it varies, so no case could drive its branches anywhere they do not ' +
              'already go: it runs at import time, and every operand its top-level branching turns on ' +
              'is welded to a value written in this file. No harness closes this and no feature will — ' +
              'a branch with one possible outcome is decided here, in the source, not at run time. ' +
              'Read an operand from the environment instead and Assayer drives it: a top-level ' +
              '`const x = Number(process.env.X)` makes X an input, and each arm becomes a case that ' +
              'sets it and imports the module fresh.',
          });
        })
    : [];
