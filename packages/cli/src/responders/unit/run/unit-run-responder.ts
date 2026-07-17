/**
 * PURPOSE: Handles `assayer unit <path...>` — parses the subcommand's argv, runs the derived cases
 *   for the given files, and returns the report.
 *
 *   A failing run THROWS the report rather than returning it. That is the whole point of the verb: a
 *   derived case that does not reach the exit derivation predicted is a build error, so it has to
 *   leave a non-zero exit code behind or CI goes green over it. The text is product surface — the
 *   error boundary writes it verbatim, with no `Error:` prefix.
 *
 *   It refuses an invocation with no paths instead of quietly running the whole repo: a typo'd path
 *   would otherwise look identical to a full pass.
 *
 *   `configDir` and `root` are two facts, not one: the cache lives under the config, the SOURCE lives
 *   under the root, and a config with a `repoRoot` puts them in different trees.
 *
 *   A dark spot only fails the run when the repo asked for that (`darkSpots: 'error'`). It is
 *   ASSAYER's debt — syntax it has no handler for — so failing by default would break every build
 *   over work the caller cannot do. The report says so either way; the severity decides only whether
 *   the exit code follows.
 *
 * USAGE:
 * await UnitRunResponder({ configDir: '/repo', root: '/repo/smoke-repo', argv: ['src/a.ts'], darkSpots: 'warn' });
 * // Returns the report, or throws it when any case failed
 */
import { runPathsBroker } from '@assayer/core/brokers';

import { analyzerRootsResolveAdapter } from '../../../adapters/analyzer-roots/resolve/analyzer-roots-resolve-adapter';
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
}: {
  configDir: string;
  root: string;
  argv: readonly string[];
  darkSpots: string;
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
    analyzerRoots: analyzerRootsResolveAdapter().map(String),
  });

  const report = unitReportFormatTransformer({ runs });
  const failed = runs.some((run) => run.cases.some((testCase) => String(testCase.status) === 'failed'));
  const darkened = darkSpots === 'error' && runs.some((run) => run.darkSpots.length > 0);

  if (failed || darkened) {
    throw new CliExactOutputError({ message: String(report) });
  }

  return report;
};
