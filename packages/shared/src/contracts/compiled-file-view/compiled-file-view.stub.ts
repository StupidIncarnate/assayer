import type { StubArgument } from '@dungeonmaster/shared/@types';

import { compiledFileViewContract } from './compiled-file-view-contract';
import type { CompiledFileView } from './compiled-file-view-contract';

export const CompiledFileViewStub = ({ ...props }: StubArgument<CompiledFileView> = {}): CompiledFileView =>
  compiledFileViewContract.parse({
    relPath: 'src/foo.ts',
    displayLines: [
      { n: 1, text: 'export const foo = 1;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { n: 2, text: 'export const bar = 2;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
    ],
    nodes: [{ kind: 'function', startLine: 1, endLine: 2 }],
    ...props,
  });
