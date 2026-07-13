import { typeTextContract } from './type-text-contract';
import type { TypeText } from './type-text-contract';

export const TypeTextStub = ({ value }: { value: string } = { value: 'void' }): TypeText =>
  typeTextContract.parse(value);
