import { filePathContract } from './file-path-contract';
import type { FilePath } from './file-path-contract';

export const FilePathStub = (
  { value }: { value: string } = { value: '/repo/src/index.ts' }
): FilePath => filePathContract.parse(value);
