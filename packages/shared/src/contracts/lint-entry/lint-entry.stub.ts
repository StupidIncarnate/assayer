import type { StubArgument } from '@dungeonmaster/shared/@types';

import { lintEntryContract } from './lint-entry-contract';
import type { LintEntry } from './lint-entry-contract';

export const LintEntryStub = ({ ...props }: StubArgument<LintEntry> = {}): LintEntry =>
  lintEntryContract.parse({
    rule: 'dead-surface',
    name: 'decide',
    message: 'nothing in this file calls it, so it is dead surface',
    startLine: 1,
    endLine: 7,
    ...props,
  });
