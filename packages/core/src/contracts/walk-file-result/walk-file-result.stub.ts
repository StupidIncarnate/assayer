import type { StubArgument } from '@dungeonmaster/shared/@types';

import { walkFileResultContract } from './walk-file-result-contract';
import type { WalkFileResult } from './walk-file-result-contract';

export const WalkFileResultStub = ({ ...props }: StubArgument<WalkFileResult> = {}): WalkFileResult =>
  walkFileResultContract.parse({
    success: true,
    scopes: [],
    nodes: [],
    probeSites: [],
    ...props,
  });
