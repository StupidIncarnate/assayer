import type { Coverage } from '../coverage/coverage-contract';
import { coverageContract } from '../coverage/coverage-contract';

const coverageIdContract = coverageContract.shape.id;

export const CoverageIdStub = (
  { value }: { value: string } = { value: 'formatGreeting/if:name.length===0' },
): Coverage['id'] => coverageIdContract.parse(value);
