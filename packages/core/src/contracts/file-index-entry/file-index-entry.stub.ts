import type { StubArgument } from '@dungeonmaster/shared/@types';

import { fileIndexEntryContract } from './file-index-entry-contract';
import type { FileIndexEntry } from './file-index-entry-contract';

export const FileIndexEntryStub = ({ ...props }: StubArgument<FileIndexEntry> = {}): FileIndexEntry =>
  fileIndexEntryContract.parse({ relPath: 'a.ts', ...props });
