import { arrayCardinalityContract } from './array-cardinality-contract';
import type { ArrayCardinality } from './array-cardinality-contract';

export const ArrayCardinalityStub = (
  { value }: { value: string } = { value: 'one' },
): ArrayCardinality => arrayCardinalityContract.parse(value);
