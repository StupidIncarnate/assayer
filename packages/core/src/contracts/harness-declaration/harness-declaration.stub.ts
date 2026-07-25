import type { StubArgument } from '@dungeonmaster/shared/@types';

import { harnessDeclarationContract } from './harness-declaration-contract';
import type { HarnessDeclaration } from './harness-declaration-contract';

export const HarnessDeclarationStub = ({ ...props }: StubArgument<HarnessDeclaration> = {}): HarnessDeclaration =>
  harnessDeclarationContract.parse({
    inputs: { audit: { report: (message: string): string => message } },
    ...props,
  });
