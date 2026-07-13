import { coverageIdContract } from './coverage-id-contract';
import type { CoverageId } from './coverage-id-contract';

export const CoverageIdStub = (
  { value }: { value: string } = { value: 'formatGreeting/if:name.length===0' },
): CoverageId => coverageIdContract.parse(value);
