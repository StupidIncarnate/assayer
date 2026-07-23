/**
 * PURPOSE: Projects the MODULE scopes whose branch logic nothing will ever drive into undriven
 *   entries — a module scope that runs at import time but whose top-level branching turns on a value
 *   the derivation can neither STEER (not a parameter, not read from the environment) nor EVALUATE
 *   (not a literal constant it can fold): an opaque call result, an imported value, a computed const.
 *   Importing it always takes the same arm and no case or evaluation can say another; a case that
 *   claimed one would fail against correct code.
 *
 *   WHICH module scopes those are is NOT decided here — it is decided by `derive-cases`, the single
 *   drivability owner (§5.12), and handed in as `undrivenModuleNames`. A module scope reading the
 *   environment DRIVES (a case writes the variable before import), and one welded to a literal const
 *   EVALUATES (a live arm plus an unreachable exit), so neither is in that set; only the genuinely
 *   opaque remainder is. This projection just turns those names into labelled entries.
 *
 *   PRIVATE helpers are NOT here: whether a private is driven, admitted undriven, or dead surface is a
 *   fact about its CALL EDGES, which only `follow-calls` can read (it drives a private through a
 *   caller that passes an input straight in). This projection reads the walk for the scope SPAN and
 *   label only.
 *
 *   The span is the scope's own, copied straight off the walk's record of it — the only source there
 *   is, since a span recovered any other way could drift from the scope these branches were counted in.
 *
 * USAGE:
 * undrivenProjectionTransformer({ walked, undrivenModuleNames: new Set(['*module*']), relPath: 'src/…/x.ts' });
 * // Returns [{ name: '*module*', label: 'x.ts', reason: '…', startLine: 1, endLine: 8 }]
 */
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';

export const undrivenProjectionTransformer = ({
  walked,
  undrivenModuleNames,
  relPath,
}: {
  walked: WalkFileResult;
  undrivenModuleNames: Set<string>;
  relPath?: string;
}): UndrivenEntry[] =>
  walked.success
    ? walked.scopes
        .filter((scope) => scope.access.kind === 'module' && scope.branches.length > 0 && undrivenModuleNames.has(String(scope.name)))
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
              'already go: it runs at import time, and its top-level branching turns on a value the ' +
              'analyzer can neither set nor resolve — not a parameter, not read from the environment, ' +
              'and not a literal constant it can fold, but an opaque one (a call result, an imported ' +
              'value, a computed expression). Read an operand from the environment instead and Assayer ' +
              'drives it: a top-level `const x = Number(process.env.X)` makes X an input, and each arm ' +
              'becomes a case that sets it and imports the module fresh.',
          });
        })
    : [];
