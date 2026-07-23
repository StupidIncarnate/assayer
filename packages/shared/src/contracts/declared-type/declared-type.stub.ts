import type { StubArgument } from '@dungeonmaster/shared/@types';

import { declaredTypeContract } from './declared-type-contract';
import type { DeclaredType } from './declared-type-contract';

export const DeclaredTypeStub = ({ ...props }: StubArgument<DeclaredType> = {}): DeclaredType =>
  declaredTypeContract.parse({
    name: 'Config',
    properties: [
      { name: 'mode', type: { kind: 'string' } },
      { name: 'retries', type: { kind: 'number' } },
    ],
    ...props,
  });
