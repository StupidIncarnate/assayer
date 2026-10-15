import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { windowStateContract } from './window-state-contract';
import type { WindowState } from './window-state-contract';

export const WindowStateStub = ({ ...props }: StubArgument<WindowState> = {}): WindowState =>
  windowStateContract.parse({
    width: 1500,
    height: 800,
    ...props,
  });
