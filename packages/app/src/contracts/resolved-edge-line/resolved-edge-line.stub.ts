import { resolvedEdgeLineContract } from './resolved-edge-line-contract';
import type { ResolvedEdgeLine } from './resolved-edge-line-contract';

export const ResolvedEdgeLineStub = (
  { value }: { value: string } = { value: 'name: string' },
): ResolvedEdgeLine => resolvedEdgeLineContract.parse(value);
