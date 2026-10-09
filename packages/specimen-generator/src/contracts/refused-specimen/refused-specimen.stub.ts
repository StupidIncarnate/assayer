import type { StubArgument } from '@dungeonmaster/shared/@types';

import { refusedSpecimenContract } from './refused-specimen-contract';
import type { RefusedSpecimen } from './refused-specimen-contract';

export const RefusedSpecimenStub = ({ ...props }: StubArgument<RefusedSpecimen> = {}): RefusedSpecimen =>
  refusedSpecimenContract.parse({
    folder: 'if-number-class-body-cond-param',
    reason: "Type 'string' is not assignable to type 'number'.",
    ...props,
  });
