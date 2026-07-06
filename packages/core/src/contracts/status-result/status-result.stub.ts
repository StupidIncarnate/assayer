import type { StubArgument } from '@dungeonmaster/shared/@types';

import { statusResultContract } from './status-result-contract';
import type { StatusResult } from './status-result-contract';

export const StatusResultStub = ({ ...props }: StubArgument<StatusResult> = {}): StatusResult =>
  statusResultContract.parse({
    version: '1.0.0',
    message: 'Assayer core online',
    ...props,
  });
