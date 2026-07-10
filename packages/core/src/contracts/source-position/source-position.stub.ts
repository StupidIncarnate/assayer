import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sourcePositionContract } from './source-position-contract';
import type { SourcePosition } from './source-position-contract';

export const SourcePositionStub = ({ ...props }: StubArgument<SourcePosition> = {}): SourcePosition =>
  sourcePositionContract.parse({
    line: 1,
    column: 1,
    ...props,
  });
