import type { StubArgument } from '@dungeonmaster/shared/@types';

import { gitExecResultContract } from './git-exec-result-contract';
import type { GitExecResult } from './git-exec-result-contract';

export const GitExecResultStub = ({ ...props }: StubArgument<GitExecResult> = {}): GitExecResult =>
  gitExecResultContract.parse({ exitCode: 0, stdout: '', stderr: '', ...props });
