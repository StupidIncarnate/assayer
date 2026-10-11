import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { typeDescriptorContract } from './type-descriptor-contract';
import type { TypeDescriptor } from './type-descriptor-contract';

export const TypeDescriptorStub = ({ ...props }: StubArgument<TypeDescriptor> = {}): TypeDescriptor =>
  typeDescriptorContract.parse({ kind: 'string', ...props });
