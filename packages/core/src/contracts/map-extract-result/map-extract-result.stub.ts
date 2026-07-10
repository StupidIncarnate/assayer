import { mapExtractResultContract } from './map-extract-result-contract';
import type { MapExtractResult } from './map-extract-result-contract';

export const MapExtractResultStub = (): MapExtractResult =>
  mapExtractResultContract.parse({ success: true, nodes: [] });
