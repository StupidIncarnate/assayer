import type { StubArgument } from '../../@types/stub-argument.type';

import { coverageContract } from './coverage-contract';
import type { Coverage } from './coverage-contract';

export const CoverageStub = ({ ...props }: StubArgument<Coverage> = {}): Coverage =>
  coverageContract.parse({
    id: 'formatGreeting/if:name.length===0',
    ...props,
  });
