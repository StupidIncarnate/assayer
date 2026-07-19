import type { StubArgument } from '@dungeonmaster/shared/@types';

import { globalUseContract } from './global-use-contract';
import type { GlobalUse } from './global-use-contract';

export const GlobalUseStub = ({ ...props }: StubArgument<GlobalUse> = {}): GlobalUse =>
  globalUseContract.parse({
    name: 'console',
    member: 'log',
    called: true,
    args: [{ kind: 'opaque' }],
    line: 1,
    column: 1,
    ...props,
  });
