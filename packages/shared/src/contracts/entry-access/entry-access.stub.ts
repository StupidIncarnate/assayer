import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { entryAccessContract } from './entry-access-contract';
import type { EntryAccess } from './entry-access-contract';

export const EntryAccessStub = ({ ...props }: StubArgument<EntryAccess> = {}): EntryAccess =>
  entryAccessContract.parse({
    kind: 'named',
    ...props,
  });
