import { repoNameContract } from './repo-name-contract';
import type { RepoName } from './repo-name-contract';

export const RepoNameStub = ({ value }: { value: string } = { value: 'assayer' }): RepoName =>
  repoNameContract.parse(value);
