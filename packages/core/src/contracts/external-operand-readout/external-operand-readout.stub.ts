import type { StubArgument } from '@legendscribe/pokayoke/shared/@types';

import { externalOperandReadoutContract } from './external-operand-readout-contract';
import type { ExternalOperandReadout } from './external-operand-readout-contract';

export const ExternalOperandReadoutStub = ({ ...props }: StubArgument<ExternalOperandReadout> = {}): ExternalOperandReadout =>
  externalOperandReadoutContract.parse({
    root: { kind: 'env', name: 'VALUE' },
    steps: [{ kind: 'number' }],
    ...props,
  });
