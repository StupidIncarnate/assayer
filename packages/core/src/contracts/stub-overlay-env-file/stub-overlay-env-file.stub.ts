import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { stubOverlayEnvFileContract } from './stub-overlay-env-file-contract';
import type { StubOverlayEnvFile } from './stub-overlay-env-file-contract';

export const StubOverlayEnvFileStub = ({ ...props }: StubArgument<StubOverlayEnvFile> = {}): StubOverlayEnvFile =>
  stubOverlayEnvFileContract.parse({
    source: 'process.env',
    property: 'CODE',
    values: ['1', '2', 'other'],
    ...props,
  });
