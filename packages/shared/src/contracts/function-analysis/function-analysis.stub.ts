import type { StubArgument } from '@dungeonmaster/shared/@types';

import { functionAnalysisContract } from './function-analysis-contract';
import type { FunctionAnalysis } from './function-analysis-contract';

export const FunctionAnalysisStub = ({ ...props }: StubArgument<FunctionAnalysis> = {}): FunctionAnalysis =>
  functionAnalysisContract.parse({
    entry: {
      name: 'formatGreeting',
      scopePath: ['formatGreeting'],
      params: [{ name: 'name', type: { kind: 'string' } }],
      returnType: { kind: 'string' },
      line: 1,
      access: { kind: 'named' },
    },
    branches: [
      {
        coverageId: 'formatGreeting/if:name.length===0',
        kind: 'if',
        condition: {
          kind: 'leaf',
          id: 'formatGreeting/if:name.length===0#leaf',
          operandParamName: 'name',
          operandType: { kind: 'string' },
          predicate: { kind: 'length-eq', literal: 0 },
        },
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
    cases: [{ reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }] }],
    ...props,
  });
