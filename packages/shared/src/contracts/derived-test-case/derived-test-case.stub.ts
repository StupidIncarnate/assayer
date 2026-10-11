import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { derivedTestCaseContract } from './derived-test-case-contract';
import type { DerivedTestCase } from './derived-test-case-contract';

export const DerivedTestCaseStub = ({ ...props }: StubArgument<DerivedTestCase> = {}): DerivedTestCase =>
  derivedTestCaseContract.parse({
    reachesPath: ['formatGreeting/return@if-then'],
    arrange: [{ kind: 'param', param: 'name', value: '' }],
    arms: [],
    driven: true,
    fewestRuns: true,
    ...props,
  });
