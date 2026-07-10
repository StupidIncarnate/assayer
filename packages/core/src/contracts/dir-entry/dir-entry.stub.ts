import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dirEntryContract } from './dir-entry-contract';
import type { DirEntry } from './dir-entry-contract';

export const DirEntryStub = ({ ...props }: StubArgument<DirEntry> = {}): DirEntry =>
  dirEntryContract.parse({ name: 'index.ts', isDirectory: false, ...props });
