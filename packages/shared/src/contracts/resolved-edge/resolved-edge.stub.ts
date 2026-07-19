import type { StubArgument } from '@dungeonmaster/shared/@types';

import { resolvedEdgeContract } from './resolved-edge-contract';
import type { ResolvedEdge } from './resolved-edge-contract';

export const ResolvedEdgeStub = ({ ...props }: StubArgument<ResolvedEdge> = {}): ResolvedEdge =>
  resolvedEdgeContract.parse({
    from: 'src/a/caller.ts',
    specifier: '../b/foo',
    importedName: 'foo',
    line: 1,
    column: 1,
    target: { kind: 'local', relPath: 'src/b/foo.ts' },
    ...props,
  });
