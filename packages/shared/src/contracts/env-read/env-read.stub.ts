import type { StubArgument } from '@dungeonmaster/shared/@types';

import { envReadContract } from './env-read-contract';
import type { EnvRead } from './env-read-contract';

export const EnvReadStub = ({ ...props }: StubArgument<EnvRead> = {}): EnvRead =>
  envReadContract.parse({
    property: 'MODE',
    literals: ['production'],
    ...props,
  });
