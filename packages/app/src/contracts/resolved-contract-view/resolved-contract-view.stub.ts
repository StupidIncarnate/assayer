import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resolvedContractViewContract } from './resolved-contract-view-contract';
import type { ResolvedContractView } from './resolved-contract-view-contract';

export const ResolvedContractViewStub = (
  { ...props }: StubArgument<ResolvedContractView> = {},
): ResolvedContractView =>
  resolvedContractViewContract.parse({
    symbol: 'greet',
    source: 'pkg vendored-pkg',
    inputs: ['name: string'],
    output: 'returns string',
    ...props,
  });
