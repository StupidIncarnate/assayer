import { runConsoleContract } from './run-console-contract';
import type { RunConsole } from './run-console-contract';

export const RunConsoleStub = ({ value = 'src/a.ts  1/1 passed\n' }: { value?: string } = {}): RunConsole =>
  runConsoleContract.parse(value);
