import type { StubArgument } from '@dungeonmaster/shared/@types';

import { moduleEdgeContract } from './module-edge-contract';
import type { ModuleEdge } from './module-edge-contract';

export const ModuleEdgeStub = ({ ...props }: StubArgument<ModuleEdge> = {}): ModuleEdge =>
  moduleEdgeContract.parse({
    kind: 'import',
    specifier: './other',
    bindings: [{ kind: 'named', name: 'foo' }],
    line: 1,
    column: 1,
    ...props,
  });
