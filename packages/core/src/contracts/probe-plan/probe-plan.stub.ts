import type { StubArgument } from '@dungeonmaster/shared/@types';

import { probePlanContract } from './probe-plan-contract';
import type { ProbePlan } from './probe-plan-contract';

export const ProbePlanStub = ({ ...props }: StubArgument<ProbePlan> = {}): ProbePlan =>
  probePlanContract.parse({
    contentHash: 'a3f5c9d1e2b4a6f8c0d2e4b6a8f0c2d4e6b8a0f2c4d6e8b0a2f4c6d8e0b2a4f6',
    relPath: 'src/boolean/and.ts',
    sites: [{ id: 'grade/if:x#leaf', kind: 'cond', start: 64, end: 73 }],
    ...props,
  });
