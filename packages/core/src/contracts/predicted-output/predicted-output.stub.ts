import { predictedOutputContract } from './predicted-output-contract';
import type { PredictedOutput } from './predicted-output-contract';

export const PredictedOutputStub = ({ value }: { value: string } = { value: '*module*/f/return@top' }): PredictedOutput =>
  predictedOutputContract.parse(value);
