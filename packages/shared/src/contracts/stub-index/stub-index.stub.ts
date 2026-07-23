import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stubIndexContract } from './stub-index-contract';
import type { StubIndex } from './stub-index-contract';
import { ObjectStubStub } from '../object-stub/object-stub.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const StubIndexStub = ({ ...props }: StubArgument<StubIndex> = {}): StubIndex =>
  stubIndexContract.parse({
    layoutHash: EMPTY_HASH,
    tsconfigHash: EMPTY_HASH,
    objectStubs: [ObjectStubStub()],
    envStubs: [],
    ...props,
  });
