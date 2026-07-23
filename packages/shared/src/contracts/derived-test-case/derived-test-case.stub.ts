import type { StubArgument } from '@dungeonmaster/shared/@types';

import { derivedTestCaseContract } from './derived-test-case-contract';
import type { DerivedTestCase } from './derived-test-case-contract';

export const DerivedTestCaseStub = ({ ...props }: StubArgument<DerivedTestCase> = {}): DerivedTestCase =>
  derivedTestCaseContract.parse({
    reachesExit: 'formatGreeting/return@if-then',
    arrange: [{ kind: 'param', param: 'name', value: '' }],
    salient: true,
    ...props,
  });
