/**
 * PURPOSE: Routes an `assayer` invocation's argv to the matching responder and returns its CLI
 *   output. Exempt commands (help, version, docs) answer directly and NEVER run the precheck;
 *   non-exempt commands (status, bare launch, unknown) run the async precheck first — resolving the
 *   config, caching the stable branch, and compiling the surface — then dispatch. An unrecognized
 *   command runs the precheck too and only then throws an exact-output error, so a broken config or
 *   compile is reported ahead of the unknown-command message; a precheck CliExactOutputError
 *   propagates unchanged.
 *
 * USAGE:
 * await AssayerFlow({ argv: ['status'], repoPath: process.cwd() });
 * // Runs the precheck, then returns the core status CliOutput
 */
import { cliCommandNormalizeTransformer } from '../../transformers/cli-command-normalize/cli-command-normalize-transformer';
import { HelpShowResponder } from '../../responders/help/show/help-show-responder';
import { VersionShowResponder } from '../../responders/version/show/version-show-responder';
import { DocsShowResponder } from '../../responders/docs/show/docs-show-responder';
import { StatusShowResponder } from '../../responders/status/show/status-show-responder';
import { LaunchRunResponder } from '../../responders/launch/run/launch-run-responder';
import { PrecheckRunResponder } from '../../responders/precheck/run/precheck-run-responder';
import { docsOverviewStatics } from '../../statics/docs-overview/docs-overview-statics';
import { cliUsageStatics } from '../../statics/cli-usage/cli-usage-statics';
import { cliOutputContract } from '../../contracts/cli-output/cli-output-contract';
import { CliExactOutputError } from '../../errors/cli-exact-output/cli-exact-output-error';
import type { CliOutput } from '../../contracts/cli-output/cli-output-contract';

export const AssayerFlow = async ({
  argv,
  repoPath,
}: {
  argv: readonly string[];
  repoPath: string;
}): Promise<CliOutput> => {
  const command = cliCommandNormalizeTransformer(argv[0] === undefined ? {} : { arg: argv[0] });

  if (command === 'help') {
    return HelpShowResponder();
  }

  if (command === 'version') {
    return VersionShowResponder();
  }

  if (command === 'docs') {
    return argv[1] === undefined
      ? cliOutputContract.parse(docsOverviewStatics.text)
      : DocsShowResponder({ topic: argv[1] });
  }

  if (command === 'status') {
    await PrecheckRunResponder({ repoPath });

    return StatusShowResponder();
  }

  if (command === 'unknown') {
    await PrecheckRunResponder({ repoPath });

    throw new CliExactOutputError({ message: `Unknown command: ${argv[0]}\n\n${cliUsageStatics.text}` });
  }

  const configDir = await PrecheckRunResponder({ repoPath });

  return LaunchRunResponder({ repoPath: String(configDir) });
};
