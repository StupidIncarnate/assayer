import type { StubArgument } from '@dungeonmaster/shared/@types';

import { specimenTypeErrorContract } from './specimen-type-error-contract';
import type { SpecimenTypeError } from './specimen-type-error-contract';

export const SpecimenTypeErrorStub = ({ ...props }: StubArgument<SpecimenTypeError> = {}): SpecimenTypeError =>
  specimenTypeErrorContract.parse({
    relPath: 'src/if/a/a.ts',
    messages: ["'x' is declared but its value is never read."],
    ...props,
  });
