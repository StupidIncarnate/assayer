import type { StubArgument } from '@dungeonmaster/shared/@types';

import { darkSpotContract } from './dark-spot-contract';
import type { DarkSpot } from './dark-spot-contract';

export const DarkSpotStub = ({ ...props }: StubArgument<DarkSpot> = {}): DarkSpot =>
  darkSpotContract.parse({
    kind: 'ForStatement',
    scopePath: ['sumAll'],
    reason: 'unhandled-syntax',
    startLine: 3,
    endLine: 5,
    ...props,
  });
