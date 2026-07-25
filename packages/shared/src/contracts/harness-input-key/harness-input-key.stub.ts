import type { StubArgument } from '@dungeonmaster/shared/@types';

import { harnessInputKeyContract } from './harness-input-key-contract';
import type { HarnessInputKey } from './harness-input-key-contract';

export const HarnessInputKeyStub = ({ ...props }: StubArgument<HarnessInputKey> = {}): HarnessInputKey =>
  harnessInputKeyContract.parse({
    entry: 'audit',
    param: 'report',
    ...props,
  });
