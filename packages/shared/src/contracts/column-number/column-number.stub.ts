import { columnNumberContract } from './column-number-contract';
import type { ColumnNumber } from './column-number-contract';

export const ColumnNumberStub = ({ value }: { value: number } = { value: 1 }): ColumnNumber =>
  columnNumberContract.parse(value);
