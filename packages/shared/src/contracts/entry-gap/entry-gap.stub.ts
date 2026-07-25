import type { StubArgument } from '@dungeonmaster/shared/@types';

import { entryGapContract } from './entry-gap-contract';
import type { EntryGap } from './entry-gap-contract';

export const EntryGapStub = ({ ...props }: StubArgument<EntryGap> = {}): EntryGap =>
  entryGapContract.parse({
    name: 'find',
    reason: 'its class needs constructor arguments, so no instance can be built to drive it — needs a harness',
    ...props,
  });
