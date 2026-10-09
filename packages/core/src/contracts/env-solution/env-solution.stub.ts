import type { StubArgument } from '@dungeonmaster/shared/@types';

import { envSolutionContract } from './env-solution-contract';
import type { EnvSolution } from './env-solution-contract';

export const EnvSolutionStub = ({ ...props }: StubArgument<EnvSolution> = {}): EnvSolution =>
  envSolutionContract.parse({ kind: 'set', value: '7', ...props });
