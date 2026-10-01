/**
 * PURPOSE: Handles `assayer help` — returns the CLI usage banner as CLI output.
 *
 * USAGE:
 * HelpShowResponder();
 * // Returns CliOutput, e.g. "Usage: assayer <command>\n\nCommands:\n  ..."
 */
import { cliUsageStatics } from '../../../statics/cli-usage/cli-usage-statics';


export const HelpShowResponder = (): string => cliUsageStatics.text;
