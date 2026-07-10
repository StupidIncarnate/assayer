import { cliErrorMessageContract } from './cli-error-message-contract';
import type { CliErrorMessage } from './cli-error-message-contract';

export const CliErrorMessageStub = (
  { value }: { value: string } = { value: 'assayer.config.json: invalid JSON at line 3 column 12: Unexpected token }' },
): CliErrorMessage => cliErrorMessageContract.parse(value);
