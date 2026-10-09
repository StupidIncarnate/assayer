import type { StubArgument } from '@dungeonmaster/shared/@types';

import { specimenDriftContract } from './specimen-drift-contract';
import type { SpecimenDrift } from './specimen-drift-contract';

export const SpecimenDriftStub = ({ ...props }: StubArgument<SpecimenDrift> = {}): SpecimenDrift =>
  specimenDriftContract.parse({
    relPath: 'src/if/function-declaration/a/a.ts',
    problem: 'differs',
    ...props,
  });
