import { undrivenCauseContract } from './undriven-cause-contract';
import type { UndrivenCause } from './undriven-cause-contract';

export const UndrivenCauseStub = (
  { value }: { value: string } = { value: 'unarrangeable-operand' },
): UndrivenCause => undrivenCauseContract.parse(value);
