import type { StubArgument } from '@dungeonmaster/shared/@types';

import { CaseResultStub } from '../case-result/case-result.stub';
import { runResultContract } from './run-result-contract';
import type { RunResult } from './run-result-contract';

export const RunResultStub = ({ ...props }: StubArgument<RunResult> = {}): RunResult =>
  runResultContract.parse({
    runId: 'r-1784093000000',
    relPath: 'packages/syntax-repository/src/boolean/and.ts',
    cases: [CaseResultStub()],
    gaps: [],
    ...props,
  });
