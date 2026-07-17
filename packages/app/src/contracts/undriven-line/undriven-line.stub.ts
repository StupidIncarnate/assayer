import { undrivenLineContract } from './undriven-line-contract';
import type { UndrivenLine } from './undriven-line-contract';

export const UndrivenLineStub = (
  { value }: { value: string } = {
    value: 'UNDRIVEN inner — it is not exported, so nothing outside the module can call it',
  },
): UndrivenLine => undrivenLineContract.parse(value);
