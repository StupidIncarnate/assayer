import type { StubArgument } from '@dungeonmaster/shared/@types';

import { anonymousReachContract } from './anonymous-reach-contract';
import type { AnonymousReach } from './anonymous-reach-contract';

export const AnonymousReachStub = ({ ...props }: StubArgument<AnonymousReach> = {}): AnonymousReach =>
  anonymousReachContract.parse({
    kind: 'argument',
    receiver: 'items',
    method: 'map',
    ...props,
  });
