import type { RunResult } from '../run-result/run-result-contract';
import { runResultContract } from '../run-result/run-result-contract';

export const RunIdStub = ({ value }: { value: string } = { value: 'r-1784093000000' }): RunResult['runId'] =>
  runResultContract.shape.runId.parse(value);
