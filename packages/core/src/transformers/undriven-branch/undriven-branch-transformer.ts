/**
 * PURPOSE: Turns the un-steerable branches `derive-cases` reports for one entry into UndrivenEntry
 *   admissions — the branch-level twin of the module and private undriven projections. A branch is
 *   un-steerable when its deciding value is neither a parameter nor an environment variable, so no
 *   case can arrange which arm runs; the entry is understood perfectly, but the runner cannot reach
 *   the value that decides the branch.
 *
 *   Shared by the same-file analyze broker and the cross-file compose overlay so both name the
 *   admission identically — the overlay rebases an imported call-guard onto a caller param, which
 *   makes a branch that was un-steerable in the per-file view steerable, so the two must agree on
 *   exactly which branches remain undriven after composition.
 *
 *   `reason` is product surface (P1) and worded as NOT DRIVEN rather than undrivable: it names the
 *   entry, the branch line, and the deciding operand when one is nameable, then points at the repo
 *   change that drives it — make the value a parameter, or read it from the environment in a module
 *   scope. The span is the branch's own line, so a surface can mark exactly the branch a case cannot
 *   steer.
 *
 * USAGE:
 * undrivenBranchTransformer({ entryName: 'opaqueIf', undrivenBranches: [{ line: 3 }] });
 * // Returns [{ name: 'opaqueIf', startLine: 3, endLine: 3, reason: '…' }]
 */
import { undrivenEntryContract } from '@assayer/shared/contracts';
import type { LineNumber, SymbolName, UndrivenEntry } from '@assayer/shared/contracts';

export const undrivenBranchTransformer = ({
  entryName,
  undrivenBranches,
}: {
  entryName: SymbolName;
  undrivenBranches: { line: LineNumber; operand?: SymbolName }[];
}): UndrivenEntry[] =>
  undrivenBranches.map((branch) =>
    undrivenEntryContract.parse({
      name: entryName,
      startLine: branch.line,
      endLine: branch.line,
      reason:
        `\`${String(entryName)}\` has a branch on line ${String(branch.line)} whose deciding value` +
        `${branch.operand === undefined ? '' : ` \`${String(branch.operand)}\``} is neither one of its ` +
        'parameters nor an environment variable, so no case can steer which arm runs: with nothing to ' +
        'vary, both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
        'understood the branch — this is not syntax it missed — but its execution model cannot set the ' +
        'value that decides it. Make the deciding value a parameter, or read it from the environment in ' +
        'a module scope, and each arm becomes a case Assayer drives.',
    }),
  );
