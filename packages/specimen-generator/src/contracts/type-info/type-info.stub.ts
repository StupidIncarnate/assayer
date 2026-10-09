import type { StubArgument } from '@dungeonmaster/shared/@types';

import { typeInfoContract } from './type-info-contract';
import type { TypeInfo } from './type-info-contract';

export const TypeInfoStub = ({ ...props }: StubArgument<TypeInfo> = {}): TypeInfo =>
  typeInfoContract.parse({
    known: 3,
    samples: [10, 20, 30],
    env: 'Number(process.env.KEY)',
    external: 'Number(process.argv[2])',
    ...props,
  });
