import { fileCountContract } from './file-count-contract';
import type { FileCount } from './file-count-contract';

export const FileCountStub = ({ value }: { value: number } = { value: 0 }): FileCount =>
  fileCountContract.parse(value);
