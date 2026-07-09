import { relPathContract } from './rel-path-contract';
import type { RelPath } from './rel-path-contract';

export const RelPathStub = (
  { value }: { value: string } = { value: 'packages/shared/src/index.ts' }
): RelPath => relPathContract.parse(value);
