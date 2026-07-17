import { arrangeTextContract } from './arrange-text-contract';
import type { ArrangeText } from './arrange-text-contract';

export const ArrangeTextStub = ({ value }: { value: string } = { value: 'LEVEL="6"' }): ArrangeText =>
  arrangeTextContract.parse(value);
