import type { StubArgument } from '@dungeonmaster/shared/@types';

import { anonymousReachContract } from './anonymous-reach-contract';
import type { AnonymousReach } from './anonymous-reach-contract';

// The default is the `items.map(…)` shape. Passing any props replaces it whole, so a test can ask
// for a bare callee (`{ kind: 'argument', callee: 'register' }`) or a reach naming neither.
export const AnonymousReachStub = (
  { ...props }: StubArgument<AnonymousReach> = { kind: 'argument', receiver: 'items', method: 'map' },
): AnonymousReach =>
  anonymousReachContract.parse({
    ...props,
  });
