import type { StubArgument } from '@dungeonmaster/shared/@types';

import { caseSetContract } from './case-set-contract';
import type { CaseSet } from './case-set-contract';

export const CaseSetStub = ({ ...props }: StubArgument<CaseSet> = {}): CaseSet =>
  caseSetContract.parse({
    relPath: 'src/boolean/and.ts',
    modulePath: '/abs/src/boolean/and.ts',
    entries: [
      {
        name: 'grade',
        access: { kind: 'named' },
        exitIds: ['grade/return@then', 'grade/return@else'],
        cases: [
          {
            reachesExit: 'grade/return@then',
            arrange: [
              { kind: 'param', param: 'score', value: 6 },
              { kind: 'param', param: 'bonus', value: 2 },
            ],
          },
        ],
      },
    ],
    gaps: [],
    darkSpots: [],
    undriven: [],
    lints: [],
    ...props,
  });
