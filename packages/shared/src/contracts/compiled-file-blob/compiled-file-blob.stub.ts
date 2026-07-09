import type { StubArgument } from '@dungeonmaster/shared/@types';

import { compiledFileBlobContract } from './compiled-file-blob-contract';
import type { CompiledFileBlob } from './compiled-file-blob-contract';

export const CompiledFileBlobStub = ({ ...props }: StubArgument<CompiledFileBlob> = {}): CompiledFileBlob =>
  compiledFileBlobContract.parse({
    relPath: 'packages/shared/src/index.ts',
    contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    nodes: [{ kind: 'function', startLine: 1, endLine: 5 }],
    lines: [{ n: 1, text: 'export const x = 1;', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }],
    ...props,
  });
