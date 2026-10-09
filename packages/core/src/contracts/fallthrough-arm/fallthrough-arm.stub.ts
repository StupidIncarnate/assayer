import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fallthroughArmContract } from './fallthrough-arm-contract';
import type { FallthroughArm } from './fallthrough-arm-contract';

export const FallthroughArmStub = ({ ...props }: StubArgument<FallthroughArm> = {}): FallthroughArm =>
  fallthroughArmContract.parse({
    guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }],
    startLine: 4,
    endLine: 4,
    ...props,
  });
