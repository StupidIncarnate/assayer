import { fileContentsContract } from './file-contents-contract';
import type { FileContents } from './file-contents-contract';

export const FileContentsStub = (
  { value }: { value: string } = { value: 'export const x = 1;\n' }
): FileContents => fileContentsContract.parse(value);
