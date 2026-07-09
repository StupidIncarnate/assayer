import type { StubArgument } from '@dungeonmaster/shared/@types';

import { compileResultContract } from './compile-result-contract';
import type { CompileResult } from './compile-result-contract';

export const CompileResultStub = ({ ...props }: StubArgument<CompileResult> = {}): CompileResult =>
  compileResultContract.parse({
    status: 'ok',
    results: [{ namespace: 'master', branch: 'master', mode: 'net-new', fileCount: 1 }],
    errors: [],
    ...props,
  });
