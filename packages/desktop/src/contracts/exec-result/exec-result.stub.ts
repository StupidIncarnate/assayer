import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { execResultContract } from './exec-result-contract';
import type { ExecResult } from './exec-result-contract';

export const ExecResultStub = ({ ...props }: StubArgument<ExecResult> = {}): ExecResult =>
  execResultContract.parse({
    exitCode: 0,
    stdout: '',
    stderr: '',
    ...props,
  });
