import type { RunResult } from '../run-result/run-result-contract';
import { runResultContract } from '../run-result/run-result-contract';

const runIdContract = runResultContract.shape.runId;

export const RunIdStub = ({ value }: { value: string } = { value: 'r-1784093000000' }): RunResult['runId'] =>
  runIdContract.parse(value);
