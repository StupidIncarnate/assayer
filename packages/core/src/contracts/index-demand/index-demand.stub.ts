import type { StubArgument } from '@dungeonmaster/shared/@types';

import { indexDemandContract } from './index-demand-contract';
import type { IndexDemand } from './index-demand-contract';

export const IndexDemandStub = ({ ...props }: StubArgument<IndexDemand> = {}): IndexDemand =>
  indexDemandContract.parse({
    kind: 'param-index',
    param: 'index',
    operation: 'at',
    ...props,
  });
