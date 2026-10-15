import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { argvReadContract } from './argv-read-contract';
import type { ArgvRead } from './argv-read-contract';

export const ArgvReadStub = ({ ...props }: StubArgument<ArgvRead> = {}): ArgvRead =>
  argvReadContract.parse({ shape: 'element', index: 2, steps: [], ...props });
