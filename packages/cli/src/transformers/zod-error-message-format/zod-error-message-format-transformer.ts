/**
 * PURPOSE: Formats Zod validation issues into a single CLI error message — one "path: message" line
 *   per issue, in the order given, so every failing field is visible at once.
 *
 * USAGE:
 * zodErrorMessageFormatTransformer({
 *   issues: [{ path: 'repoRoot', message: 'Invalid input: expected string, received number' }],
 * });
 * // Returns 'repoRoot: Invalid input: expected string, received number'
 */
import { cliErrorMessageContract } from '../../contracts/cli-error-message/cli-error-message-contract';
import type { CliErrorMessage } from '../../contracts/cli-error-message/cli-error-message-contract';

export const zodErrorMessageFormatTransformer = ({
  issues,
}: {
  issues: readonly { path: string; message: string }[];
}): CliErrorMessage => {
  return cliErrorMessageContract.parse(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
};
