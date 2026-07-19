import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fileModuleGraphContract } from './file-module-graph-contract';
import type { FileModuleGraph } from './file-module-graph-contract';
import { ModuleEdgeStub } from '../module-edge/module-edge.stub';
import { ModuleReferenceStub } from '../module-reference/module-reference.stub';

export const FileModuleGraphStub = ({ ...props }: StubArgument<FileModuleGraph> = {}): FileModuleGraph =>
  fileModuleGraphContract.parse({
    edges: [ModuleEdgeStub()],
    references: [ModuleReferenceStub()],
    ...props,
  });
