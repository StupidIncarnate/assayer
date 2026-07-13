import { representativeValueContract } from './representative-value-contract';
import type { RepresentativeValue } from './representative-value-contract';

export const RepresentativeValueStub = (
  { value }: { value: string | number | boolean } = { value: '' },
): RepresentativeValue => representativeValueContract.parse(value);
