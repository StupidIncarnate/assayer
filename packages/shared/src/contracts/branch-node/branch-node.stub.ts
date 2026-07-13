import type { StubArgument } from '@dungeonmaster/shared/@types';

import { branchNodeContract } from './branch-node-contract';
import type { BranchNode } from './branch-node-contract';

export const BranchNodeStub = ({ ...props }: StubArgument<BranchNode> = {}): BranchNode =>
  branchNodeContract.parse({
    coverageId: 'formatGreeting/if:name.length===0',
    kind: 'if',
    conditionText: 'name.length === 0',
    operandParamName: 'name',
    operandType: { kind: 'string' },
    predicate: { kind: 'length-eq-zero' },
    startLine: 2,
    endLine: 4,
    ...props,
  });
