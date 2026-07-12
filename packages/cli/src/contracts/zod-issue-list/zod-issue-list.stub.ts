import type { StubArgument } from '@dungeonmaster/shared/@types';

import { zodIssueListContract } from './zod-issue-list-contract';
import type { ZodIssueList } from './zod-issue-list-contract';

export const ZodIssueListStub = ({ ...props }: StubArgument<ZodIssueList> = {}): ZodIssueList =>
  zodIssueListContract.parse({
    issues: [{ path: ['repoRoot'], message: 'Expected string, received number' }],
    ...props,
  });
