import type { StubArgument } from '@dungeonmaster/shared/@types';

import { stubOverlayContract } from './stub-overlay-contract';
import type { StubOverlay } from './stub-overlay-contract';

export const StubOverlayStub = ({ ...props }: StubArgument<StubOverlay> = {}): StubOverlay =>
  stubOverlayContract.parse({
    kind: 'object',
    key: 'src/config/config.ts#Config',
    overlayPath: 'assayer/stubs/objects/src/config/config.ts/Config.json',
    properties: [{ name: 'mode', values: ['dev', 'prod', 'staging'] }],
    ...props,
  });
