import { assayerVersionContract } from './assayer-version-contract';
import type { AssayerVersion } from './assayer-version-contract';

export const AssayerVersionStub = ({ value }: { value: string } = { value: '1.0.0' }): AssayerVersion =>
  assayerVersionContract.parse(value);
