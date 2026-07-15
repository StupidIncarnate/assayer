import { traceValueTextContract } from './trace-value-text-contract';
import type { TraceValueText } from './trace-value-text-contract';

export const TraceValueTextStub = ({ value = "'pass'" }: { value?: string } = {}): TraceValueText =>
  traceValueTextContract.parse(value);
