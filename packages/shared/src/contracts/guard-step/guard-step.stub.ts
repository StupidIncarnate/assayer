import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { guardStepContract } from './guard-step-contract';
import type { GuardStep } from './guard-step-contract';

export const GuardStepStub = ({ ...props }: StubArgument<GuardStep> = {}): GuardStep =>
  guardStepContract.parse({
    branchCoverageId: 'formatGreeting/if:name.length===0',
    arm: 'then',
    ...props,
  });
