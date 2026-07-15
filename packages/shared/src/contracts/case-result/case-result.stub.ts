import type { StubArgument } from '@dungeonmaster/shared/@types';

import { caseResultContract } from './case-result-contract';
import type { CaseResult } from './case-result-contract';

export const CaseResultStub = ({ ...props }: StubArgument<CaseResult> = {}): CaseResult =>
  caseResultContract.parse({
    entryName: 'grade',
    testCase: {
      reachesExit: 'grade/return@then',
      arrange: [
        { param: 'score', value: 6 },
        { param: 'bonus', value: 2 },
      ],
    },
    status: 'passed',
    observedExit: 'grade/return@then',
    trace: [
      { id: 'grade/if:x#leaf.0', kind: 'cond', outcome: true, valueText: 'true' },
      { id: 'grade/if:x#leaf.1', kind: 'cond', outcome: true, valueText: 'true' },
      { id: 'grade/return@then', kind: 'exit', valueText: "'pass'" },
    ],
    ...props,
  });
