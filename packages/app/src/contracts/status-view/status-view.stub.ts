import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statusViewContract } from './status-view-contract';
import type { StatusView } from './status-view-contract';

export const StatusViewStub = ({ ...props }: StubArgument<StatusView> = {}): StatusView =>
  statusViewContract.parse({
    version: '1.0.0',
    message: 'Assayer core online',
    repoPath: '/home/user/project',
    ...props,
  });
