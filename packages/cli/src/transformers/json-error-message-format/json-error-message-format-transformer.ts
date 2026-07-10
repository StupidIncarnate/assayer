/**
 * PURPOSE: Formats a JSON.parse SyntaxError into a single-line CLI error message naming the file,
 *   the failing line/column, and a cleaned-up reason (Node's trailing "in JSON at position N" noise
 *   stripped, since the line/column already localize the failure).
 *
 * USAGE:
 * jsonErrorMessageFormatTransformer({
 *   fileName: 'assayer.config.json',
 *   message: 'Unexpected token } in JSON at position 40',
 *   line: 3,
 *   column: 12,
 * });
 * // Returns 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }'
 */
import { cliErrorMessageContract } from '../../contracts/cli-error-message/cli-error-message-contract';
import type { CliErrorMessage } from '../../contracts/cli-error-message/cli-error-message-contract';

export const jsonErrorMessageFormatTransformer = ({
  fileName,
  message,
  line,
  column,
}: {
  fileName: string;
  message: string;
  line: number;
  column: number;
}): CliErrorMessage => {
  const reason = message.replace(/ in JSON at position .*$/su, '').trim();

  return cliErrorMessageContract.parse(`${fileName}: invalid JSON at line ${line} column ${column}: ${reason}`);
};
