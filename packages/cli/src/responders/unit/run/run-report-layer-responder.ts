/**
 * PURPOSE: The half of `assayer unit` that runs after the cases ran: it saves each run's own report
 *   beside that run, then returns the combined report, or throws it when the run must fail the build.
 *   UnitRunResponder parses argv and runs the cases; this layer owns every decision about what a
 *   finished run says and whether the exit code follows.
 *
 *   It saves before it decides. A failing run is exactly the one whose report a reader opens later, so
 *   throwing first would keep reports only for runs nobody needs. Each run saves only its own slice:
 *   `assayer unit a.ts b.ts` prints one report for two runs, and a reader opening `a.ts` must not be
 *   shown `b.ts`'s failures.
 *
 *   A case that did not pass always fails the build. An ERROR counts the same as a FAIL: it produced no
 *   verdict, which is less known than a wrong one. Each admission fails the build only under its own
 *   toggle set to 'error': `darkSpots` (Assayer's debt, so it defaults to warn), `deadSurface` (the
 *   repo's debt) and `inputGaps` (the caller's debt). The toggles decide the exit code alone; 'off'
 *   and 'warn' print the same report.
 *
 * USAGE:
 * await RunReportLayerResponder({ configDir: '/repo', runs, darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' });
 * // Returns the report, or throws it as a CliExactOutputError when the run fails the build
 */
import { runConsoleSaveBroker } from '@assayer/core/brokers';
import type { RunResult } from '@assayer/shared/contracts';

import { unitReportFormatTransformer } from '../../../transformers/unit-report-format/unit-report-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';

export const RunReportLayerResponder = async ({
  configDir,
  runs,
  darkSpots,
  deadSurface,
  inputGaps,
}: {
  configDir: string;
  runs: readonly RunResult[];
  darkSpots: string;
  deadSurface: string;
  inputGaps: string;
}): Promise<string> => {
  await Promise.all(
    runs.map(async (run) =>
      runConsoleSaveBroker({
        configDir,
        runId: String(run.runId),
        console: String(unitReportFormatTransformer({ runs: [run] })),
      }),
    ),
  );

  const report = unitReportFormatTransformer({ runs: [...runs] });
  const failed = runs.some((run) => run.cases.some((testCase) => String(testCase.status) !== 'passed'));
  const darkened = darkSpots === 'error' && runs.some((run) => run.darkSpots.length > 0);
  const linted = deadSurface === 'error' && runs.some((run) => run.lints.length > 0);
  const gapped = inputGaps === 'error' && runs.some((run) => run.gaps.length > 0);

  if (failed || darkened || linted || gapped) {
    throw new CliExactOutputError({ message: String(report) });
  }

  return report;
};
