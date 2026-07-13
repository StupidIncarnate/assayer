import type { StubArgument } from '@dungeonmaster/shared/@types';

import { cliRunResultContract } from './cli-run-result-contract';
import type { CliRunResult } from './cli-run-result-contract';

export const CliRunResultStub = ({ ...props }: StubArgument<CliRunResult> = {}): CliRunResult =>
  cliRunResultContract.parse({ stdout: '', stderr: '', exitCode: 0, ...props });
