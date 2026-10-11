import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { stubEntryContract } from './stub-entry-contract';
import type { StubEntry } from './stub-entry-contract';

export const StubEntryStub = ({ ...props }: StubArgument<StubEntry> = {}): StubEntry =>
  stubEntryContract.parse({
    key: 'src/config/config.ts#Config',
    ...props,
  });
