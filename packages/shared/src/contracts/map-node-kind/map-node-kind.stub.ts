import { mapNodeKindContract } from './map-node-kind-contract';
import type { MapNodeKind } from './map-node-kind-contract';

export const MapNodeKindStub = (
  { value }: { value: string } = { value: 'function' },
): MapNodeKind => mapNodeKindContract.parse(value);
