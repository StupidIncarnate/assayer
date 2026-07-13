import type { StubArgument } from '@dungeonmaster/shared/@types';

import { exitNodeContract } from './exit-node-contract';
import type { ExitNode } from './exit-node-contract';

export const ExitNodeStub = ({ ...props }: StubArgument<ExitNode> = {}): ExitNode =>
  exitNodeContract.parse({
    coverageId: 'formatGreeting/return@if-then',
    kind: 'return',
    guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }],
    line: 3,
    ...props,
  });
