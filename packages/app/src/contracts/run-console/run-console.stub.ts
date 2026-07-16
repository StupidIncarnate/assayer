import { runConsoleContract } from './run-console-contract';
import type { RunConsole } from './run-console-contract';

export const RunConsoleStub = (
  { value }: { value: string } = { value: 'packages/a.ts  3/3 passed' },
): RunConsole => runConsoleContract.parse(value);
