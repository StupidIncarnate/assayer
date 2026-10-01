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
 *   What happens once the cases ran lives in RunReportLayerResponder: it saves each run's own report
 *   beside that run, and decides whether the run fails the build under the darkSpots, deadSurface and
 *   inputGaps toggles.
 *
 * USAGE:
 * await UnitRunResponder({ configDir: '/repo', root: '/repo/smoke-repo', argv: ['src/a.ts'], darkSpots: 'warn', deadSurface: 'error', inputGaps: 'error' });
 * // Returns the report, or throws it when any case failed
 */
import { runPathsBroker } from '@assayer/core/brokers';

import { analyzerRootsResolveBroker } from '../../../brokers/analyzer-roots/resolve/analyzer-roots-resolve-broker';
import { cliUsageStatics } from '../../../statics/cli-usage/cli-usage-statics';
import { CliExactOutputError } from '../../../errors/cli-exact-output/cli-exact-output-error';
import { parseArgs } from '#gateway/node/util';
import { RunReportLayerResponder } from './run-report-layer-responder';

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
}): Promise<string> => {
  const paths = parseArgs({ args: [...argv], strict: true, allowPositionals: true }).positionals.map((positional) => positional).map(String);

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

  return RunReportLayerResponder({ configDir, runs, darkSpots, deadSurface, inputGaps });
};
