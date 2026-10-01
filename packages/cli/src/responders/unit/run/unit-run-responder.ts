/**
 * PURPOSE: Handles `assayer unit <path...>` — parses the subcommand's argv, runs the derived cases
 *   for the given files, and returns the report.
 *
 *   A failing run THROWS the report rather than returning it. That is the whole point of the verb: a
 *   derived case that does not reach the exit derivation predicted is a build error, so it has to
 *   leave a non-zero exit code behind or CI goes green over it. The text is product surface — the
 *   error boundary writes it verbatim, with no `Error:` prefix. A case that ERRORED counts the same:
 *   it produced no verdict, which is less known than a wrong one, never more.
 *
 *   It refuses an invocation with no paths instead of quietly running the whole repo: a typo'd path
 *   would otherwise look identical to a full pass.
 *
 *   `configDir` and `root` are two facts, not one: the cache lives under the config, the SOURCE lives
 *   under the root, and a config with a `repoRoot` puts them in different trees.
 *
 *   It SAVES each run's report beside that run's artifact before deciding the exit code. That is what
 *   lets the desktop show what a run said without re-running it, and it is saved from here — the one
 *   place the CLI's own text exists — so both surfaces read the same bytes rather than the UI
 *   re-formatting the artifact into a second telling that can drift.
 *
 *   A dark spot only fails the run when the repo asked for that (`darkSpots: 'error'`). It is
 *   ASSAYER's debt — syntax it has no handler for — so failing by default would break every build
 *   over work the caller cannot do. The report says so either way; the severity decides only whether
 *   the exit code follows.
 *
 *   A dead-surface LINT follows the same shape but flips the default: `deadSurface: 'error'` fails the
 *   run because dead code is the REPO's debt, the party that can fix it. The report always names it;
 *   the severity decides whether the exit code does.
 *
 *   A GAP fails the run on the same reasoning as the lint, pointed at the other party: `inputGaps:
 *   'error'` is the default because a gap is the CALLER's debt — an input Assayer cannot construct, or
 *   an entry the runner cannot reach through its access — and a harness the caller writes closes either.
 *   Failing the build asks the one party who can act.
 *
 *   Every one of the three toggles governs the EXIT CODE alone. `off` and `warn` produce the same
 *   report bytes, because a run that dropped an admission would print `1/1 passed` for a file with an
 *   unconstructable input — indistinguishable from one with nothing left to say. The severity answers
 *   "does this break the build", never "does the reader get told".
 *
 * USAGE:
 * await UnitRunResponder({ configDir: '/repo', root: '/repo/smoke-repo', argv: ['src/a.ts'], darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' });
 * // Returns the report, or throws it when any case failed
 */
import { runConsoleSaveBroker, runPathsBroker } from '@assayer/core/brokers';

import { analyzerRootsResolveBroker } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker';
import { utilParseArgsAdapter } from '../../../adapters/util/parse-args/util-parse-args-adapter';
import { cliUsageStatics } from '../../../statics/cli-usage/cli-usage-statics';
import { unitReportFormatTransformer } from '../../../transformers/unit-report-format/unit-report-format-transformer';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const UnitRunResponder = async ({
  configDir,
  root,
  argv,
  darkSpots,
  deadSurface,
  inputGaps,
}: {
  configDir: string;
  root: string;
  argv: readonly string[];
  darkSpots: string;
  deadSurface: string;
  inputGaps: string;
}): Promise<CliOutput> => {
  const paths = utilParseArgsAdapter({ argv }).map(String);

  if (paths.length === 0) {
    throw new CliExactOutputError({
      message: `assayer unit: no paths given.\n\nUsage: assayer unit <path...>\n\n${cliUsageStatics.text}`,
    });
  }

  const runs = await runPathsBroker({
    configDir,
    root,
    relPaths: paths,
    analyzerRoots: analyzerRootsResolveBroker().map(String),
  });

  // Each run's OWN slice of the report is saved beside its artifact, so the desktop can show what a
  // run said without re-running it — and shows the CLI's real bytes rather than a second telling of
  // the same run. Sliced per file rather than saved whole because `assayer unit a.ts b.ts` produces
  // one report for two runs, and a reader opening `a.ts` must not be shown `b.ts`'s failures.
  await Promise.all(
    runs.map(async (run) =>
      runConsoleSaveBroker({
        configDir,
        runId: String(run.runId),
        console: String(unitReportFormatTransformer({ runs: [run] })),
      }),
    ),
  );

  const report = unitReportFormatTransformer({ runs });
  // Anything that did not pass fails the build. An ERROR is not a lesser FAIL — it is a case that
  // produced no verdict at all, which is strictly less known than a wrong one.
  const failed = runs.some((run) => run.cases.some((testCase) => String(testCase.status) !== 'passed'));
  const darkened = darkSpots === 'error' && runs.some((run) => run.darkSpots.length > 0);
  const linted = deadSurface === 'error' && runs.some((run) => run.lints.length > 0);
  const gapped = inputGaps === 'error' && runs.some((run) => run.gaps.length > 0);

  if (failed || darkened || linted || gapped) {
    throw new CliExactOutputError({ message: String(report) });
  }

  return report;
};
