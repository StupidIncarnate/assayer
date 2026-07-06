import type { StubArgument } from '@dungeonmaster/shared/@types';

import { desktopStatusContract } from './desktop-status-contract';
import type { DesktopStatus } from './desktop-status-contract';

export const DesktopStatusStub = ({ ...props }: StubArgument<DesktopStatus> = {}): DesktopStatus =>
  desktopStatusContract.parse({
    version: '1.0.0',
    message: 'Assayer core online',
    repoPath: '/home/user/project',
    ...props,
  });
