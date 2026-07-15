import { cliPositionalContract } from './cli-positional-contract';
import type { CliPositional } from './cli-positional-contract';

export const CliPositionalStub = (
  { value }: { value: string } = { value: 'src/format-greeting.ts' },
): CliPositional => cliPositionalContract.parse(value);
