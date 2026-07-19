import { stringLengthContract } from './string-length-contract';
import type { StringLength } from './string-length-contract';

export const StringLengthStub = ({ value = 0 }: { value?: number } = {}): StringLength =>
  stringLengthContract.parse(value);
