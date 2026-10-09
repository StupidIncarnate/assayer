import type { StubArgument } from '@dungeonmaster/shared/@types';

import { generateRunResultContract } from './generate-run-result-contract';
import type { GenerateRunResult } from './generate-run-result-contract';

export const GenerateRunResultStub = ({ ...props }: StubArgument<GenerateRunResult> = {}): GenerateRunResult =>
  generateRunResultContract.parse({
    exitCode: 0,
    output: 'smoke-repo is current: 1 specimens',
    ...props,
  });
