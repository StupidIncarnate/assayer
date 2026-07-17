/**
 * PURPOSE: Formats run results into the text `assayer unit` prints — product surface, written for an
 *   LLM to act on without a human.
 *
 *   A failure names the ARRANGE that drove it, the exit derivation PREDICTED, and what actually
 *   happened, because "L3 != L6" is unreadable on its own: the reader needs the values and the
 *   claim, not two line numbers. Each failing file ends with the one command that shows its whole
 *   trace — a review backstop nobody can reach in one step stops being used.
 *
 *   Gaps print even when every case passed. A gap is Assayer saying what it could NOT drive; a run
 *   that reports only its passes reads as complete coverage of the file, which is the exact lie
 *   `darkSpots` exists to prevent.
 *
 *   Dark spots print on their own line, worded to name ASSAYER as the one who owes the work. A GAP is
 *   the reader's to close — build an instance, write a harness. A dark spot is syntax Assayer has no
 *   handler for, so telling the reader to fix their own for-loop would be advice they cannot act on,
 *   and unactionable text is the one thing this report may never be.
 *
 *   UNDRIVEN prints on a third line for the same reason, and never as one of the other two. It is
 *   logic Assayer read perfectly and cannot yet call — a module scope, a private helper — so filing
 *   it as a gap would order a harness nobody can write, and filing it as a dark spot would blame a
 *   parser that saw the code fine. Without this line, `0/0 passed` is all a file of pure module-scope
 *   branching ever says, which is what a file with nothing in it says too.
 *
 * USAGE:
 * unitReportFormatTransformer({ runs: [RunResultStub()] });
 * // Returns the full report text
 */
import { arrangeTextTransformer } from '@assayer/shared/transformers';

import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';
import type { RunResult } from '@assayer/shared/contracts';

export const unitReportFormatTransformer = ({ runs }: { runs: readonly RunResult[] }): CliOutput => {
  const lines = runs.flatMap((run) => {
    const failures = run.cases.filter((testCase) => String(testCase.status) === 'failed');
    const header = `${String(run.relPath)}  ${run.cases.length - failures.length}/${run.cases.length} passed`;

    const failed = failures.map((testCase) => {
      const args = arrangeTextTransformer({ arrange: testCase.testCase.arrange });
      const observed = testCase.observedExit === undefined ? 'reached no exit' : `reached ${String(testCase.observedExit)}`;
      const why = testCase.message === undefined ? observed : String(testCase.message);

      return [
        `  FAIL ${String(testCase.entryName)}(${args})`,
        `    predicted ${String(testCase.testCase.reachesExit)}`,
        `    ${why}`,
      ].join('\n');
    });

    const gaps = run.gaps.map((gap) => `  GAP  ${String(gap.name)} — ${String(gap.reason)}`);
    const darkSpots = run.darkSpots.map(
      (darkSpot) =>
        `  DARK ${String(darkSpot.kind)} at L${String(darkSpot.startLine)}-L${String(darkSpot.endLine)} in ` +
        `${darkSpot.scopePath.map((segment) => String(segment)).join('/')} — Assayer has no handler for it, so ` +
        'nothing inside it is covered',
    );
    const undriven = run.undriven.map((entry) => `  UNDRIVEN ${String(entry.name)} — ${String(entry.reason)}`);
    const link = failures.length === 0 ? [] : [`  assayer detail ${String(run.runId)}`];

    return [header, ...failed, ...gaps, ...darkSpots, ...undriven, ...link];
  });

  return cliOutputContract.parse(lines.join('\n'));
};
