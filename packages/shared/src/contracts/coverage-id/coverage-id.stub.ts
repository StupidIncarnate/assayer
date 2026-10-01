import type { Coverage } from '../coverage/coverage-contract';
import { coverageContract } from '../coverage/coverage-contract';

export const CoverageIdStub = (
  { value }: { value: string } = { value: 'formatGreeting/if:name.length===0' },
): Coverage['id'] => coverageContract.shape.id.parse(value);
