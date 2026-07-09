import { folderNameContract } from './folder-name-contract';
import type { FolderName } from './folder-name-contract';

export const FolderNameStub = ({ value }: { value: string } = { value: 'smoke-repo' }): FolderName =>
  folderNameContract.parse(value);
