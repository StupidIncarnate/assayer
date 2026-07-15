import type { StubArgument } from '@dungeonmaster/shared/@types';

import { walkContextContract } from './walk-context-contract';
import type { WalkContext } from './walk-context-contract';

export const WalkContextStub = ({ ...props }: StubArgument<WalkContext> = {}): WalkContext =>
  walkContextContract.parse({
    scopePath: ['classify'],
    guardPath: [],
    params: [{ name: 'value', type: { kind: 'number' } }],
    exported: true,
    tail: true,
    ...props,
  });
