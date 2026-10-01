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
 *     result, a closed-over binding), so the change is to make it a parameter or an environment read. An
 *     object-member read (`config.mode`, `config.db.retry`, at any depth) reaches this cause too: `config`
 *     already is a parameter, but its property is not scalar-arrangeable per-file (§5.12), and it is
 *     closed later, at consume time, by `stub-realize` — so the reader owes no repo change here either.
 *   - `unread-comparison` — the operand already is a parameter, but the comparison against it names a
 *     value the parse could not read (an enum member, an imported or computed constant), so the change is
 *     to compare against a literal.
 *   - `unarrangeable-typeof` — the operand is a `typeof` read whose OWN operand is opaque (a call result,
 *     a member access with no parameter root), so Assayer cannot even ask what the comparison narrows; a
 *     followup capability rather than a repo change.
 *   - `unarrangeable-typeof-member` — the operand is a `typeof` read of a real parameter, and the
 *     comparison DOES narrow the parameter's type by runtime tag; on at least one side, every member
 *     carrying that tag is a shape (an object, an array) with no scalar point this engine can select from
 *     a union on its own yet, a followup capability rather than a repo change.
 *
 *   Telling a reader to make `m` a parameter when `m` is already one is advice they cannot act on — which
 *   the last two causes exist to stop printing. The span is the branch's own line, so a surface can mark
 *   exactly the branch a case cannot steer.
 *
 * USAGE:
 * undrivenBranchTransformer({ entryName: 'opaqueIf', undrivenBranches: [{ line: 3, cause: 'unarrangeable-operand' }] });
 * // Returns [{ name: 'opaqueIf', startLine: 3, endLine: 3, reason: '…' }]
 */
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { UndrivenEntry } from '@assayer/shared/contracts';

import type { UndrivenCause } from '../../contracts/undriven-cause/undriven-cause-contract';

export const undrivenBranchTransformer = ({
  entryName,
  undrivenBranches,
}: {
  entryName: string;
  undrivenBranches: { line: number; cause: UndrivenCause; operand?: string }[];
}): UndrivenEntry[] =>
  undrivenBranches.map((branch) => {
    // `unread-comparison` and `unarrangeable-typeof-member` both fire only once EVERY leaf of the
    // branch already passed the arrangeable check (`derive-cases`'s gate), and every arrangeable route —
    // a plain param, an env var, or a welded const — resolves through the same identifier node
    // `operandParamName` is read off. So a leaf reaching either cause always carries an operand; the
    // check below is the invariant, not a real branch of behaviour.
    if (
      (branch.cause === 'unread-comparison' || branch.cause === 'unarrangeable-typeof-member') &&
      branch.operand === undefined
    ) {
      throw new Error(
        `unreachable: an '${branch.cause}' branch on line ${String(branch.line)} of \`${entryName}\` carries no operand`,
      );
    }

    const named = `\`${entryName}\` has a branch on line ${String(branch.line)}`;

    if (branch.cause === 'unread-comparison') {
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

    // A `typeof` read whose OWN operand Assayer cannot arrange — a call result, a member access with no
    // parameter root — never gets far enough to ask what the comparison narrows. This is the SAME limit
    // an opaque non-`typeof` operand has, worded to say so: Assayer read the `typeof`, it is the thing
    // `typeof` applies to that has no input a case can set.
    if (branch.cause === 'unarrangeable-typeof') {
      return undrivenEntryContract.parse({
        name: entryName,
        startLine: branch.line,
        endLine: branch.line,
        reason:
          `${named} whose deciding value is a \`typeof\` read, so no case can steer which arm runs: with ` +
          'nothing to vary, both arms would arrange the same inputs and one would fail against correct ' +
          'code. Assayer understood the branch — this is not syntax it missed — but the value `typeof` ' +
          'applies to is neither one of this entry\'s parameters nor an environment variable, so Assayer ' +
          'cannot yet ask what the comparison narrows. Make that value a parameter and each arm becomes a ' +
          'case Assayer drives.',
      });
    }

    // `target` already is a parameter, and the comparison DOES narrow `target`'s type by runtime tag —
    // Assayer reads exactly which union member each arm needs. What is missing is the fill: at least one
    // arm's matching member is a shape (an object, an array), and Assayer cannot yet pick ONE member of a
    // union to build a value from on its own, only the union's first fillable member regardless of which
    // arm asked. Telling the reader to make `target` a parameter, or to compare against a literal, would
    // both be advice about a state that already holds.
    if (branch.cause === 'unarrangeable-typeof-member') {
      return undrivenEntryContract.parse({
        name: entryName,
        startLine: branch.line,
        endLine: branch.line,
        reason:
          `${named} that reads \`typeof ${String(branch.operand)}\`, so no case can steer which arm runs: ` +
          'with nothing to vary, both arms would arrange the same inputs and one would fail against correct ' +
          `code. Assayer understood the branch and read the comparison: it narrows \`${String(branch.operand)}\` ` +
          "to the union member whose runtime type matches on one arm and to the rest on the other. On at " +
          'least one side, every matching member is a shape Assayer cannot yet select on its own from a ' +
          'union with more than one member — building the object or array is not the gap, choosing WHICH ' +
          'member to build is. There is no repo change that closes this today; it is a followup capability.',
      });
    }

    return undrivenEntryContract.parse({
      name: entryName,
      startLine: branch.line,
      endLine: branch.line,
      reason:
        `${named} whose deciding value` +
        `${branch.operand === undefined ? '' : ` \`${branch.operand}\``} is neither one of its ` +
        'parameters nor an environment variable, so no case can steer which arm runs: with nothing to ' +
        'vary, both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
        'understood the branch — this is not syntax it missed — but its execution model cannot set the ' +
        'value that decides it. Make the deciding value a parameter, or read it from the environment in ' +
        'a module scope, and each arm becomes a case Assayer drives.',
    });
  });
