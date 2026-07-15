import { runIdContract } from './run-id-contract';
import type { RunId } from './run-id-contract';

export const RunIdStub = ({ value }: { value: string } = { value: 'r-1784093000000' }): RunId =>
  runIdContract.parse(value);
