import { lineNumberContract } from './line-number-contract';
import type { LineNumber } from './line-number-contract';

export const LineNumberStub = ({ value }: { value: number } = { value: 1 }): LineNumber =>
  lineNumberContract.parse(value);
