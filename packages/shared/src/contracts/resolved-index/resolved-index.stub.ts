import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resolvedIndexContract } from './resolved-index-contract';
import type { ResolvedIndex } from './resolved-index-contract';
import { ResolvedEdgeStub } from '../resolved-edge/resolved-edge.stub';

const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

export const ResolvedIndexStub = ({ ...props }: StubArgument<ResolvedIndex> = {}): ResolvedIndex =>
  resolvedIndexContract.parse({
    layoutHash: EMPTY_HASH,
    tsconfigHash: EMPTY_HASH,
    edges: [ResolvedEdgeStub()],
    ...props,
  });
