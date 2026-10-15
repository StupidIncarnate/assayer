import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { valueUseContract } from './value-use-contract';
import type { ValueUse } from './value-use-contract';

export const ValueUseStub = ({ ...props }: StubArgument<ValueUse> = {}): ValueUse =>
  valueUseContract.parse({
    target: 'import',
    specifier: 'node:path',
    importedName: 'sep',
    ...props,
  });
