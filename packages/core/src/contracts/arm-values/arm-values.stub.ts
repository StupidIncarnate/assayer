import type { StubArgument } from '@dungeonmaster/shared/@types';

import { armValuesContract } from './arm-values-contract';
import type { ArmValues } from './arm-values-contract';

export const ArmValuesStub = ({ ...props }: StubArgument<ArmValues> = {}): ArmValues =>
  armValuesContract.parse({ satisfying: [''], violating: ['a'], ...props });
