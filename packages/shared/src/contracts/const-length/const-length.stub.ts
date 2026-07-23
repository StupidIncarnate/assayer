import { constLengthContract } from './const-length-contract';
import type { ConstLength } from './const-length-contract';

export const ConstLengthStub = ({ value }: { value: number } = { value: 3 }): ConstLength =>
  constLengthContract.parse(value);
