/**
 * PURPOSE: Turns the un-steerable branches `derive-cases` reports for one entry into UndrivenEntry
 *   admissions — the branch-level twin of the module and private undriven projections. A branch is
 *   un-steerable when no case can arrange which arm runs; the entry is understood perfectly, but the
 *   runner cannot reach the value that decides the branch.
 *
 *   Shared by the same-file analyze broker and the cross-file compose overlay so both name the
 *   admission identically — the overlay rebases an imported call-guard onto a caller param, which
 *   makes a branch that was un-steerable in the per-file view steerable, so the two must agree on
 *   exactly which branches remain undriven after composition.
 *
 *   `reason` is product surface (P1) and worded as NOT DRIVEN rather than undrivable: it names the
 *   entry, the branch line, and the deciding operand when one is nameable, then states the limit that
 *   actually blocks it. The limit DIFFERS by cause, which is why the cause travels here rather than being
 *   flattened into one sentence:
 *
 *   - `unarrangeable-operand` — the branch decides on a value the entry has no input for at all (a call
 *     result, a closed-over binding), so the change is to make it a parameter or an environment read.
 *   - `unread-comparison` — the operand already is a parameter, but the comparison against it names a
 *     value the parse could not read (an enum member, an imported or computed constant), so the change is
 *     to compare against a literal.
 *   - `unarrangeable-typeof` — the operand is a `typeof` read, and the value it narrows may already be a
 *     parameter; Assayer does not yet decompose the comparison into a case per branch, a followup
 *     capability rather than a repo change.
 *   - `unarrangeable-property-depth` — the operand is an object-member read more than one segment deep
 *     (`config.db.retry`); `config` already is a parameter, and `object-arrange` matches a property path
 *     only one segment deep at consume time, a followup capability rather than a repo change.
 *
 *   Telling a reader to make `m` a parameter when `m` is already one, or to make `config` a parameter when
 *   a `typeof`/property-depth read is the real limit, is advice they cannot act on — which the last two
 *   causes exist to stop printing. The span is the branch's own line, so a surface can mark exactly the
 *   branch a case cannot steer.
 *
 * USAGE:
 * undrivenBranchTransformer({ entryName: 'opaqueIf', undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand' }] });
 * // Returns [{ name: 'opaqueIf', startLine: 3, endLine: 3, reason: '…' }]
 */
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { LineNumber, SymbolName, UndrivenEntry } from '@assayer/shared/contracts';

import type { UndrivenCause } from '../../contracts/undriven-cause/undriven-cause-contract';

export const undrivenBranchTransformer = ({
  entryName,
  undrivenBranches,
}: {
  entryName: SymbolName;
  undrivenBranches: { line: LineNumber; cause: UndrivenCause; operand?: SymbolName }[];
}): UndrivenEntry[] =>
  undrivenBranches.map((branch) => {
    // `unread-comparison` fires only once EVERY leaf of the branch already passed the arrangeable
    // check (`derive-cases`'s gate), and every arrangeable route — a plain param, an env var, or a
    // welded const — resolves through the same identifier node `operandParamName` is read off. So a
    // leaf reaching this cause always carries an operand; the check below is the invariant, not a
    // real branch of behaviour.
    if (String(branch.cause) === 'unread-comparison' && branch.operand === undefined) {
      throw new Error(
        `unreachable: an 'unread-comparison' branch on line ${String(branch.line)} of \`${String(entryName)}\` carries no operand`,
      );
    }

    const named = `\`${String(entryName)}\` has a branch on line ${String(branch.line)}`;

    if (String(branch.cause) === 'unread-comparison') {
      return undrivenEntryContract.parse({
        name: entryName,
        startLine: branch.line,
        endLine: branch.line,
        reason:
          `${named} that compares \`${String(branch.operand)}\` against a value Assayer ` +
          'could not read as a literal — an enum member, an imported or computed constant, or a property ' +
          'of another object — so it has no value that satisfies the comparison and none that violates ' +
          'it: with nothing to vary, both arms would arrange the same inputs and one would fail against ' +
          'correct code. Assayer understood the branch — this is not syntax it missed — but it cannot ' +
          'yet name the value on the other side of the comparison. Compare against a literal and each ' +
          'arm becomes a case Assayer drives.',
      });
    }

    // `typeof target === 'string'` reads as opaque to the steerability gate: the operand it names is
    // the whole `typeof` expression, not `target`, so `target` being a parameter does not make the
    // comparison arrangeable. Telling the reader to make the deciding value a parameter would be advice
    // about a state that may already hold — the real limit is that Assayer does not decompose a `typeof`
    // read into the per-type cases it names, which is a followup capability, not a repo change.
    if (String(branch.cause) === 'unarrangeable-typeof') {
      return undrivenEntryContract.parse({
        name: entryName,
        startLine: branch.line,
        endLine: branch.line,
        reason:
          `${named} whose deciding value is a \`typeof\` read, so no case can steer which arm runs: with ` +
          'nothing to vary, both arms would arrange the same inputs and one would fail against correct ' +
          'code. Assayer understood the branch — this is not syntax it missed — but it does not decompose ' +
          'a `typeof` comparison into the case each result names; the value `typeof` narrows may already be ' +
          'a parameter this entry declares.',
      });
    }

    // An object-member path more than one segment deep (`config.db.retry`) already names a parameter
    // (`config`) — the gap is DEPTH, not the absence of a parameter, and `object-arrange` matches a
    // property path only one segment deep at consume time. A one-segment path never reaches this cause:
    // it stays `unarrangeable-operand` and is closed later by `stub-realize`.
    if (String(branch.cause) === 'unarrangeable-property-depth') {
      return undrivenEntryContract.parse({
        name: entryName,
        startLine: branch.line,
        endLine: branch.line,
        reason:
          `${named} whose deciding value${branch.operand === undefined ? '' : ` \`${String(branch.operand)}\``} ` +
          'reads a property more than one level deep off one of its parameters, so no case can steer which ' +
          'arm runs: with nothing to vary, both arms would arrange the same inputs and one would fail ' +
          'against correct code. Assayer understood the branch — this is not syntax it missed — but it ' +
          'matches an object-member comparison only ONE property level deep (`config.mode`), never a path ' +
          'this long.',
      });
    }

    return undrivenEntryContract.parse({
      name: entryName,
      startLine: branch.line,
      endLine: branch.line,
      reason:
        `${named} whose deciding value` +
        `${branch.operand === undefined ? '' : ` \`${String(branch.operand)}\``} is neither one of its ` +
        'parameters nor an environment variable, so no case can steer which arm runs: with nothing to ' +
        'vary, both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
        'understood the branch — this is not syntax it missed — but its execution model cannot set the ' +
        'value that decides it. Make the deciding value a parameter, or read it from the environment in ' +
        'a module scope, and each arm becomes a case Assayer drives.',
    });
  });
