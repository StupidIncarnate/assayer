import { cliFileTextContract } from './cli-file-text-contract';
import type { CliFileText } from './cli-file-text-contract';

export const CliFileTextStub = ({ value }: { value: string } = { value: '' }): CliFileText =>
  cliFileTextContract.parse(value);
