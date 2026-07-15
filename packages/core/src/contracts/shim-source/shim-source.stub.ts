import { shimSourceContract } from './shim-source-contract';
import type { ShimSource } from './shim-source-contract';

export const ShimSourceStub = ({ value = "const caseSet = require('./x.cases.json');" }: { value?: string } = {}): ShimSource =>
  shimSourceContract.parse(value);
