import type { StubArgument } from '@dungeonmaster/shared/@types';

import { mapNodeContract } from './map-node-contract';
import type { MapNode } from './map-node-contract';

export const MapNodeStub = ({ ...props }: StubArgument<MapNode> = {}): MapNode =>
  mapNodeContract.parse({ kind: 'function', startLine: 1, endLine: 5, ...props });
