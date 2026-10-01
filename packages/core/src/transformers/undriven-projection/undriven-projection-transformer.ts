/**
 * PURPOSE: Projects the MODULE scopes whose branch logic nothing will ever drive into undriven
 *   entries — a module scope that runs at import time but whose top-level branching turns on a value
 *   the derivation can neither STEER (not a parameter, not read from the environment) nor EVALUATE
 *   (not a literal constant it can fold): an opaque call result, an imported value, a computed const.
 *   Importing it always takes the same arm and no case or evaluation can say another; a case that
 *   claimed one would fail against correct code.
 *
 *   WHICH module scopes those are, and WHY, is NOT decided here — it is decided by `derive-cases`, the
 *   single drivability owner (§5.12), and handed in as `undrivenModules`: one entry per wholly undriven
 *   module scope, carrying the CAUSE its first un-steerable branch reported. A module scope reading the
 *   environment DRIVES (a case writes the variable before import), and one welded to a literal const
 *   EVALUATES (a live arm plus an unreachable exit), so neither is in that set; only the genuinely
 *   opaque remainder is. This projection turns those names into labelled entries, wording the reason by
 *   the cause it was handed exactly as the branch-level admission does. `unarrangeable-typeof-member`
 *   cannot reach a module: a module's only arrangeable operand is an environment read, and an
 *   environment read's type is always the plain `number` the `Number(process.env.X)` coercion produces
 *   (§5.10), never a union, so there is no OTHER member for a tag to fail to match. The remaining three
 *   causes CAN reach a module: an opaque operand (an object-member read included — a module scope
 *   declares no parameters, so `config.mode` never resolves to one and falls to this same cause), a
 *   `typeof` read of one, or a comparison against a value Assayer could not read as a literal. The
 *   module-unreachable cause is still handled below, worded the same way the branch-level admission is,
 *   so the cause's four members stay exhaustively worded rather than falling through to a mismatched
 *   default.
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
 * undrivenProjectionTransformer({
 *   walked,
 *   undrivenModules: [{ name: '*module*', cause: 'unarrangeable-operand' }],
 *   relPath: 'src/…/x.ts',
 * });
 * // Returns [{ name: '*module*', label: 'x.ts', reason: '…', startLine: 1, endLine: 8 }]
 */
import { moduleEntryLabelTransformer } from '@assayer/shared/transformers';
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { UndrivenEntry } from '@assayer/shared/contracts';

import type { WalkFileResult } from '../../contracts/walk-file-result/walk-file-result-contract';
import type { UndrivenCause } from '../../contracts/undriven-cause/undriven-cause-contract';

export const undrivenProjectionTransformer = ({
  walked,
  undrivenModules,
  relPath,
}: {
  walked: WalkFileResult;
  undrivenModules: { name: string; cause: UndrivenCause; operand?: string }[];
  relPath?: string;
}): UndrivenEntry[] => {
  const causeByName = new Map(undrivenModules.map((module) => [module.name, module]));

  return walked.success
    ? walked.scopes.flatMap((scope) => {
        if (scope.access.kind !== 'module' || scope.branches.length === 0) {
          return [];
        }

        const undrivenModule = causeByName.get(String(scope.name));
        if (undrivenModule === undefined) {
          return [];
        }

        const exportName = scope.exportedBindings.length === 1 ? scope.exportedBindings[0] : undefined;
        // The module scope renders by its LABEL, never the internal `*module*`: the single exported
        // binding when there is one, else the file basename. `name` stays `*module*` because it keys
        // the driven/undriven match; `label` is DISPLAY only. Without a relPath (a synthetic caller),
        // the label falls away and the surface shows the name.
        const label =
          relPath === undefined ? undefined : moduleEntryLabelTransformer({ ...(exportName === undefined ? {} : { exportName }), relPath });

        if (undrivenModule.cause === 'unread-comparison') {
          // Same invariant `undrivenBranchTransformer` enforces: every leaf that reaches this cause
          // already passed the arrangeable check, and every arrangeable route (env var included, at
          // module scope) resolves through the same identifier node the operand is read off.
          if (undrivenModule.operand === undefined) {
            throw new Error(`unreachable: an 'unread-comparison' undriven module \`${String(scope.name)}\` carries no operand`);
          }

          return [
            undrivenEntryContract.parse({
              name: scope.name,
              ...(label === undefined ? {} : { label }),
              startLine: scope.startLine,
              endLine: scope.endLine,
              reason:
                'nothing about it varies, so no case could drive its branches anywhere they do not already go: ' +
                `it runs at import time, and its top-level branching compares \`${undrivenModule.operand}\` ` +
                'against a value Assayer could not read as a literal — an enum member, an imported or computed ' +
                'constant, or a property of another object — so it has no value that satisfies the comparison and ' +
                'none that violates it. Assayer understood the branch — this is not syntax it missed — but it ' +
                'cannot yet name the value on the other side of the comparison. Compare against a literal and ' +
                'each arm becomes a case Assayer drives.',
            }),
          ];
        }

        // `typeof x === 'string'` reads as opaque to the steerability gate even at module scope: the
        // operand it names is the whole `typeof` expression, not `x`. Telling the reader to read `x`
        // from the environment would be advice about a state that may already hold — the real limit
        // is that Assayer does not decompose a `typeof` read into the per-type case it names.
        if (undrivenModule.cause === 'unarrangeable-typeof') {
          return [
            undrivenEntryContract.parse({
              name: scope.name,
              ...(label === undefined ? {} : { label }),
              startLine: scope.startLine,
              endLine: scope.endLine,
              reason:
                'nothing about it varies, so no case could drive its branches anywhere they do not already go: ' +
                'it runs at import time, and its top-level branching turns on a `typeof` read, so no case can ' +
                'steer which arm runs. Assayer understood the branch — this is not syntax it missed — but it ' +
                'does not decompose a `typeof` comparison into the case each result names; the value `typeof` ' +
                'narrows may already be read from the environment.',
            }),
          ];
        }

        // `unarrangeable-typeof-member` never reaches a module scope in practice: a module's only
        // arrangeable operand is an environment read, and an environment read's type is always the
        // plain `number` the `Number(process.env.X)` coercion produces (§5.10) — never a union, so
        // there is no OTHER member for a tag to fail to match. Handled anyway so the cause's four
        // members stay exhaustively worded rather than falling through to a mismatched default.
        if (undrivenModule.cause === 'unarrangeable-typeof-member') {
          // Same invariant as `unread-comparison`: every leaf reaching this cause already passed the
          // arrangeable check, so it always carries an operand.
          if (undrivenModule.operand === undefined) {
            throw new Error(
              `unreachable: an 'unarrangeable-typeof-member' undriven module \`${String(scope.name)}\` carries no operand`,
            );
          }

          return [
            undrivenEntryContract.parse({
              name: scope.name,
              ...(label === undefined ? {} : { label }),
              startLine: scope.startLine,
              endLine: scope.endLine,
              reason:
                'nothing about it varies, so no case could drive its branches anywhere they do not already go: it ' +
                `runs at import time, and its top-level branching reads \`typeof ${undrivenModule.operand}\`, ` +
                `narrowing ${undrivenModule.operand}'s own type by runtime tag — but on at least one side, ` +
                'every matching member is a shape Assayer cannot yet select on its own from a union with more than ' +
                'one member. Assayer understood the branch and read the comparison; only picking the union member ' +
                'is unbuilt.',
            }),
          ];
        }

        return [
          undrivenEntryContract.parse({
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
          }),
        ];
      })
    : [];
};
