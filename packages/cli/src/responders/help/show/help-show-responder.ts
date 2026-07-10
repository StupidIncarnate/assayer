/**
 * PURPOSE: Handles `assayer help` — returns the CLI usage banner as CLI output.
 *
 * USAGE:
 * HelpShowResponder();
 * // Returns CliOutput, e.g. "Usage: assayer <command>\n\nCommands:\n  ..."
 */
import { cliUsageStatics } from '../../../statics/cli-usage/cli-usage-statics';

import { cliOutputContract } from '../../../contracts/cli-output/cli-output-contract';
import type { CliOutput } from '../../../contracts/cli-output/cli-output-contract';

export const HelpShowResponder = (): CliOutput => cliOutputContract.parse(cliUsageStatics.text);
