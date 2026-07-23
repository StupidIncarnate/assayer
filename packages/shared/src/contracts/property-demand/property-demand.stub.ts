import type { StubArgument } from '@dungeonmaster/shared/@types';

import { propertyDemandContract } from './property-demand-contract';
import type { PropertyDemand } from './property-demand-contract';

export const PropertyDemandStub = ({ ...props }: StubArgument<PropertyDemand> = {}): PropertyDemand =>
  propertyDemandContract.parse({
    name: 'mode',
    demand: { kind: 'demanded', values: ['a', 'abc123'] },
    ...props,
  });
