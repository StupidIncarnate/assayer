/**
 * PURPOSE: Formats compile errors into a single CLI error message — one "relPath:line:column message"
 *   line per error, in the order given, so every failing location is visible at once.
 *
 * USAGE:
 * compileErrorMessageFormatTransformer({
 *   errors: [{ relPath: 'src/foo.ts', line: 10, column: 4, message: 'Unexpected token' }],
 * });
 * // Returns 'src/foo.ts:10:4 Unexpected token'
 */
import { cliErrorMessageContract } from '../../contracts/cli-error-message/cli-error-message-contract';
import type { CliErrorMessage } from '../../contracts/cli-error-message/cli-error-message-contract';

export const compileErrorMessageFormatTransformer = ({
  errors,
}: {
  errors: readonly { relPath: string; line: number; column: number; message: string }[];
}): CliErrorMessage => {
  return cliErrorMessageContract.parse(
    errors.map((error) => `${error.relPath}:${error.line}:${error.column} ${error.message}`).join('\n'),
  );
};
