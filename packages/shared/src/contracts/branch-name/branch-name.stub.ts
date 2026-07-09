import { branchNameContract } from './branch-name-contract';
import type { BranchName } from './branch-name-contract';

export const BranchNameStub = ({ value }: { value: string } = { value: 'master' }): BranchName =>
  branchNameContract.parse(value);
