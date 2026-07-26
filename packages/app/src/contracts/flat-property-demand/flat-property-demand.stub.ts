import type { StubArgument } from '@dungeonmaster/shared/@types';

import { flatPropertyDemandContract } from './flat-property-demand-contract';
import type { FlatPropertyDemand } from './flat-property-demand-contract';

export const FlatPropertyDemandStub = ({ ...props }: StubArgument<FlatPropertyDemand> = {}): FlatPropertyDemand =>
  flatPropertyDemandContract.parse({
    name: 'mode',
    demand: { kind: 'demanded', values: ['a', 'abc123'] },
    ...props,
  });
