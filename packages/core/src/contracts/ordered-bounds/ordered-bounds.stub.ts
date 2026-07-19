import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orderedBoundsContract } from './ordered-bounds-contract';
import type { OrderedBounds } from './ordered-bounds-contract';

export const OrderedBoundsStub = ({ ...props }: StubArgument<OrderedBounds> = {}): OrderedBounds =>
  orderedBoundsContract.parse({ ...props });
