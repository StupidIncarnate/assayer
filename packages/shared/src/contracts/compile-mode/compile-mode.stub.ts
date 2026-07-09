import { compileModeContract } from './compile-mode-contract';
import type { CompileMode } from './compile-mode-contract';

export const CompileModeStub = (
  { value }: { value: string } = { value: 'net-new' },
): CompileMode => compileModeContract.parse(value);
