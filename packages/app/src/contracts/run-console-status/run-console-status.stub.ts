import { runConsoleStatusContract } from './run-console-status-contract';
import type { RunConsoleStatus } from './run-console-status-contract';

export const RunConsoleStatusStub = ({ value }: { value: string } = { value: 'finished' }): RunConsoleStatus =>
  runConsoleStatusContract.parse(value);
