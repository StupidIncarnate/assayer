import type { StubArgument } from '@dungeonmaster/shared/@types';

import { specimenOutcomeContract } from './specimen-outcome-contract';
import type { SpecimenOutcome } from './specimen-outcome-contract';

export const SpecimenOutcomeStub = ({ ...props }: StubArgument<SpecimenOutcome> = {}): SpecimenOutcome =>
  specimenOutcomeContract.parse({
    branches: [
      { kind: 'if', arm: 'then', line: 2, driven: 'driven' },
      { kind: 'if', arm: 'else', line: 2, driven: 'driven' },
    ],
    caseFailures: [],
    lints: [],
    undriven: [],
    darkSpots: [],
    gaps: [],
    ...props,
  });
