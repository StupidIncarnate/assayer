import { harnessKeyPathContract } from './harness-key-path-contract';
import type { HarnessKeyPath } from './harness-key-path-contract';

export const HarnessKeyPathStub = ({ value = 'inputs.audit.report' }: { value?: string } = {}): HarnessKeyPath =>
  harnessKeyPathContract.parse(value);
