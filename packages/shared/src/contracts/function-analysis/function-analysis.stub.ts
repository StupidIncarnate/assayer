import type { StubArgument } from '@dungeonmaster/shared/@types';

import { functionAnalysisContract } from './function-analysis-contract';
import type { FunctionAnalysis } from './function-analysis-contract';

export const FunctionAnalysisStub = ({ ...props }: StubArgument<FunctionAnalysis> = {}): FunctionAnalysis =>
  functionAnalysisContract.parse({
    entry: {
      name: 'formatGreeting',
      params: [{ name: 'name', type: { kind: 'string' } }],
      returnType: { kind: 'string' },
      line: 1,
    },
    branches: [
      {
        coverageId: 'formatGreeting/if:name.length===0',
        kind: 'if',
        operandParamName: 'name',
        operandType: { kind: 'string' },
        predicate: { kind: 'length-eq-zero' },
        startLine: 2,
        endLine: 4,
      },
    ],
    exits: [
      {
        coverageId: 'formatGreeting/return@if-then',
        kind: 'return',
        guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }],
        line: 3,
      },
    ],
    cases: [{ reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] }],
    ...props,
  });
