import { caseRunStatusContract } from './case-run-status-contract';
import type { CaseRunStatus } from './case-run-status-contract';

export const CaseRunStatusStub = ({ value }: { value: string } = { value: 'not-run' }): CaseRunStatus =>
  caseRunStatusContract.parse(value);
