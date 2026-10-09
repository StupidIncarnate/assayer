import type { StubArgument } from '@dungeonmaster/shared/@types';

import { walkFactsContract } from './walk-facts-contract';
import type { WalkFacts } from './walk-facts-contract';

export const WalkFactsStub = ({ ...props }: StubArgument<WalkFacts> = {}): WalkFacts =>
  walkFactsContract.parse({
    scopes: [],
    looseBranches: [],
    looseExits: [],
    looseCalls: [],
    looseValueUses: [],
    looseExportedBindings: [],
    looseIndexDemands: [],
    looseFallthroughArms: [],
    nodes: [],
    probeSites: [],
    moduleEdges: [],
    declaredShapes: [],
    globalUses: [],
    envReads: [],
    reachedFns: [],
    invokedFns: [],
    ...props,
  });
