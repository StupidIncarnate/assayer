import { cliOutputContract } from './cli-output-contract';
import type { CliOutput } from './cli-output-contract';

export const CliOutputStub = ({ value }: { value: string } = { value: 'assayer 1.0.0' }): CliOutput =>
  cliOutputContract.parse(value);
