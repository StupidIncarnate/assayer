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
 *   entry, the branch line, and the deciding operand when one is nameable, then points at the repo
 *   change that drives it. The change DIFFERS by cause, which is why the cause travels here rather than
 *   being flattened into one sentence: an `unarrangeable-operand` branch decides on a value the entry
 *   has no input for, so the change is to make it a parameter or an environment read; an
 *   `unread-comparison` branch already decides on a parameter and compares it against a value the parse
 *   could not read (an enum member, an imported or computed constant), so the change is to compare
 *   against a literal. Telling a reader to make `m` a parameter when `m` is already one is advice they
 *   cannot act on. The span is the branch's own line, so a surface can mark exactly the branch a case
 *   cannot steer.
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
  undrivenBranches.map((branch) =>
    undrivenEntryContract.parse({
      name: entryName,
      startLine: branch.line,
      endLine: branch.line,
      reason:
        String(branch.cause) === 'unread-comparison'
          ? `\`${String(entryName)}\` has a branch on line ${String(branch.line)} that compares` +
            `${branch.operand === undefined ? '' : ` \`${String(branch.operand)}\``} against a value Assayer ` +
            'could not read as a literal — an enum member, an imported or computed constant, or a property ' +
            'of another object — so it has no value that satisfies the comparison and none that violates ' +
            'it: with nothing to vary, both arms would arrange the same inputs and one would fail against ' +
            'correct code. Assayer understood the branch — this is not syntax it missed — but it cannot ' +
            'yet name the value on the other side of the comparison. Compare against a literal and each ' +
            'arm becomes a case Assayer drives.'
          : `\`${String(entryName)}\` has a branch on line ${String(branch.line)} whose deciding value` +
            `${branch.operand === undefined ? '' : ` \`${String(branch.operand)}\``} is neither one of its ` +
            'parameters nor an environment variable, so no case can steer which arm runs: with nothing to ' +
            'vary, both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
            'understood the branch — this is not syntax it missed — but its execution model cannot set the ' +
            'value that decides it. Make the deciding value a parameter, or read it from the environment in ' +
            'a module scope, and each arm becomes a case Assayer drives.',
    }),
  );
