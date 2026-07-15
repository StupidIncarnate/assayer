import type { StubArgument } from '@dungeonmaster/shared/@types';

import { walkNodeContract } from './walk-node-contract';
import type { WalkNode } from './walk-node-contract';

export const WalkNodeStub = ({ ...props }: StubArgument<WalkNode> = {}): WalkNode =>
  walkNodeContract.parse({
    kind: 'IfStatement',
    scopePath: ['classify'],
    startLine: 2,
    endLine: 4,
    handled: true,
    ...props,
  });
