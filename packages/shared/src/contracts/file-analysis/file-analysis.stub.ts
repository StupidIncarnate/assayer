import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fileAnalysisContract } from './file-analysis-contract';
import type { FileAnalysis } from './file-analysis-contract';

export const FileAnalysisStub = ({ ...props }: StubArgument<FileAnalysis> = {}): FileAnalysis =>
  fileAnalysisContract.parse({
    functions: [
      {
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
            conditionText: 'name.length === 0',
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
      },
    ],
    enrichment: [{ line: 1, symbol: 'name', typeText: 'string' }],
    ...props,
  });
