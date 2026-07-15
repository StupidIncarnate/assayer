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
 * USAGE:
 * unitReportFormatTransformer({ runs: [RunResultStub()] });
 * // Returns the full report text
 */
import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';
import type { RunResult } from '@assayer/shared/contracts';

export const unitReportFormatTransformer = ({ runs }: { runs: readonly RunResult[] }): CliOutput => {
  const lines = runs.flatMap((run) => {
    const failures = run.cases.filter((testCase) => String(testCase.status) === 'failed');
    const header = `${String(run.relPath)}  ${run.cases.length - failures.length}/${run.cases.length} passed`;

    const failed = failures.map((testCase) => {
      const args = testCase.testCase.arrange.map((binding) => JSON.stringify(binding.value)).join(', ');
      const observed = testCase.observedExit === undefined ? 'reached no exit' : `reached ${String(testCase.observedExit)}`;
      const why = testCase.message === undefined ? observed : String(testCase.message);

      return [
        `  FAIL ${String(testCase.entryName)}(${args})`,
        `    predicted ${String(testCase.testCase.reachesExit)}`,
        `    ${why}`,
      ].join('\n');
    });

    const gaps = run.gaps.map((gap) => `  GAP  ${String(gap.name)} — ${String(gap.reason)}`);
    const link = failures.length === 0 ? [] : [`  assayer detail ${String(run.runId)}`];

    return [header, ...failed, ...gaps, ...link];
  });

  return cliOutputContract.parse(lines.join('\n'));
};
