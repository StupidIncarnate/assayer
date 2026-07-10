import { progressBarLineContract } from './progress-bar-line-contract';
import type { ProgressBarLine } from './progress-bar-line-contract';

export const ProgressBarLineStub = (
  { value }: { value: string } = { value: 'main: -------------------- 0/10' },
): ProgressBarLine => progressBarLineContract.parse(value);
