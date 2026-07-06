import { repoPathContract } from './repo-path-contract';
import type { RepoPath } from './repo-path-contract';

export const RepoPathStub = ({ value }: { value: string } = { value: '/home/user/project' }): RepoPath =>
  repoPathContract.parse(value);
