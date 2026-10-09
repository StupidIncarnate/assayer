import type { StubArgument } from '@dungeonmaster/shared/@types';

import { envStepContract } from './env-step-contract';
import type { EnvStep } from './env-step-contract';

export const EnvStepStub = ({ ...props }: StubArgument<EnvStep> = {}): EnvStep =>
  envStepContract.parse({ kind: 'split', separator: ',', ...props });
