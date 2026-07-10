import type { StubArgument } from '@dungeonmaster/shared/@types';

import { compileProgressEventContract } from './compile-progress-event-contract';
import type { CompileProgressEvent } from './compile-progress-event-contract';

export const CompileProgressEventStub = ({ ...props }: StubArgument<CompileProgressEvent> = {}): CompileProgressEvent =>
  compileProgressEventContract.parse({
    namespace: 'master',
    branch: 'master',
    phase: 'planned',
    current: 0,
    max: 0,
    stableMax: 0,
    currentMax: 0,
    ...props,
  });
