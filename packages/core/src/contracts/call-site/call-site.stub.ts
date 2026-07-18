import type { StubArgument } from '@dungeonmaster/shared/@types';

import { callSiteContract } from './call-site-contract';
import type { CallSite } from './call-site-contract';

export const CallSiteStub = ({ ...props }: StubArgument<CallSite> = {}): CallSite =>
  callSiteContract.parse({
    callee: { target: 'local', name: 'inner', startLine: 2 },
    args: [{ kind: 'param-ref', paramName: 'value' }],
    guardPath: [],
    ...props,
  });
