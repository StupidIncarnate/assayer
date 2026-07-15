import type { StubArgument } from '@dungeonmaster/shared/@types';

import { runVerdictContract } from './run-verdict-contract';
import type { RunVerdict } from './run-verdict-contract';

export const RunVerdictStub = ({ ...props }: StubArgument<RunVerdict> = {}): RunVerdict =>
  runVerdictContract.parse({ passed: true, ...props });
