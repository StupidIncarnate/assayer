import type { StubArgument } from '@dungeonmaster/shared/@types';

import { undrivenEntryContract } from './undriven-entry-contract';
import type { UndrivenEntry } from './undriven-entry-contract';

export const UndrivenEntryStub = ({ ...props }: StubArgument<UndrivenEntry> = {}): UndrivenEntry =>
  undrivenEntryContract.parse({
    name: '*module*',
    reason: 'it runs at import time, so no case drove its branches',
    startLine: 1,
    endLine: 8,
    ...props,
  });
