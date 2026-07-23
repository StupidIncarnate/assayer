import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stubViewContract } from './stub-view-contract';
import type { StubView } from './stub-view-contract';
import { ObjectStubStub } from '../object-stub/object-stub.stub';

export const StubViewStub = ({ ...props }: StubArgument<StubView> = {}): StubView =>
  stubViewContract.parse({
    objectStubs: [ObjectStubStub()],
    envStubs: [],
    ...props,
  });
