import { symbolNameContract } from './symbol-name-contract';
import type { SymbolName } from './symbol-name-contract';

export const SymbolNameStub = ({ value }: { value: string } = { value: 'name' }): SymbolName =>
  symbolNameContract.parse(value);
