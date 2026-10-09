import type { StubArgument } from '@dungeonmaster/shared/@types';

import { envOperandReadoutContract } from './env-operand-readout-contract';
import type { EnvOperandReadout } from './env-operand-readout-contract';

export const EnvOperandReadoutStub = ({ ...props }: StubArgument<EnvOperandReadout> = {}): EnvOperandReadout =>
  envOperandReadoutContract.parse({
    name: 'VALUE',
    steps: [{ kind: 'number' }],
    ...props,
  });
