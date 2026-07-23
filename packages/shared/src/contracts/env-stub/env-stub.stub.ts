import type { StubArgument } from '@dungeonmaster/shared/@types';

import { envStubContract } from './env-stub-contract';
import type { EnvStub } from './env-stub-contract';

export const EnvStubStub = ({ ...props }: StubArgument<EnvStub> = {}): EnvStub =>
  envStubContract.parse({
    key: 'process.env#MODE',
    property: 'MODE',
    values: ['production'],
    guessed: true,
    readers: ['src/config/config.ts'],
    ...props,
  });
