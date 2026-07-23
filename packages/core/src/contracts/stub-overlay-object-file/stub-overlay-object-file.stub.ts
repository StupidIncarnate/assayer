import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stubOverlayObjectFileContract } from './stub-overlay-object-file-contract';
import type { StubOverlayObjectFile } from './stub-overlay-object-file-contract';

export const StubOverlayObjectFileStub = ({
  ...props
}: StubArgument<StubOverlayObjectFile> = {}): StubOverlayObjectFile =>
  stubOverlayObjectFileContract.parse({
    type: 'src/config/config.ts#Config',
    properties: { mode: { values: ['dev', 'prod', 'staging'] } },
    ...props,
  });
