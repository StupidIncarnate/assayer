import { darkSpotLineContract } from './dark-spot-line-contract';
import type { DarkSpotLine } from './dark-spot-line-contract';

export const DarkSpotLineStub = (
  { value }: { value: string } = {
    value:
      'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it is covered',
  },
): DarkSpotLine => darkSpotLineContract.parse(value);
