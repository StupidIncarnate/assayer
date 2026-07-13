import type { StubArgument } from '@dungeonmaster/shared/@types';

import { gutterMarkerContract } from './gutter-marker-contract';
import type { GutterMarker } from './gutter-marker-contract';

export const GutterMarkerStub = ({ ...props }: StubArgument<GutterMarker> = {}): GutterMarker =>
  gutterMarkerContract.parse({
    line: 2,
    count: 2,
    ...props,
  });
