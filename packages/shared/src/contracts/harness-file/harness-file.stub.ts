import type { StubArgument } from '@dungeonmaster/shared/@types';

import { harnessFileContract } from './harness-file-contract';
import type { HarnessFile } from './harness-file-contract';
import { HarnessInputKeyStub } from '../harness-input-key/harness-input-key.stub';

export const HarnessFileStub = ({ ...props }: StubArgument<HarnessFile> = {}): HarnessFile =>
  harnessFileContract.parse({
    relPath: 'src/audit.harness.ts',
    targetRelPath: 'src/audit.ts',
    keys: [HarnessInputKeyStub()],
    ...props,
  });
