import { resolutionFailureReasonContract } from './resolution-failure-reason-contract';
import type { ResolutionFailureReason } from './resolution-failure-reason-contract';

export const ResolutionFailureReasonStub = (
  { value }: { value: string } = { value: 'cannot-resolve-specifier' },
): ResolutionFailureReason => resolutionFailureReasonContract.parse(value);
