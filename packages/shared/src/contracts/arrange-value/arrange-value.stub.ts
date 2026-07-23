import { arrangeValueContract } from './arrange-value-contract';
import type { ArrangeValue } from './arrange-value-contract';

export const ArrangeValueStub = ({ value }: { value: unknown } = { value: 7 }): ArrangeValue =>
  arrangeValueContract.parse(value);
