import { cliCommandContract } from './cli-command-contract';
import type { CliCommand } from './cli-command-contract';

export const CliCommandStub = (
  { value }: { value: string } = { value: 'help' },
): CliCommand => cliCommandContract.parse(value);
