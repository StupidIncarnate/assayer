import { compileStatusContract } from './compile-status-contract';
import type { CompileStatus } from './compile-status-contract';

export const CompileStatusStub = (
  { value }: { value: string } = { value: 'ok' },
): CompileStatus => compileStatusContract.parse(value);
