import type { StubArgument } from '@dungeonmaster/shared/@types';

import { paramDescriptorContract } from './param-descriptor-contract';
import type { ParamDescriptor } from './param-descriptor-contract';

export const ParamDescriptorStub = ({ ...props }: StubArgument<ParamDescriptor> = {}): ParamDescriptor =>
  paramDescriptorContract.parse({ name: 'name', type: { kind: 'string' }, ...props });
