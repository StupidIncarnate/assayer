import type { StubArgument } from '@dungeonmaster/shared/@types';

import { harnessIndexContract } from './harness-index-contract';
import type { HarnessIndex } from './harness-index-contract';
import { HarnessFileStub } from '../harness-file/harness-file.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const HarnessIndexStub = ({ ...props }: StubArgument<HarnessIndex> = {}): HarnessIndex =>
  harnessIndexContract.parse({
    layoutHash: EMPTY_HASH,
    tsconfigHash: EMPTY_HASH,
    harnessHash: EMPTY_HASH,
    harnesses: [HarnessFileStub()],
    ...props,
  });
