import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { constOperandReadoutContract } from './const-operand-readout-contract';
import type { ConstOperandReadout } from './const-operand-readout-contract';

export const ConstOperandReadoutStub = ({ ...props }: StubArgument<ConstOperandReadout> = {}): ConstOperandReadout =>
  constOperandReadoutContract.parse({
    value: 7,
    ...props,
  });
