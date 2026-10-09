import type { StubArgument } from '@dungeonmaster/shared/@types';

import { generatedFileContract } from './generated-file-contract';
import type { GeneratedFile } from './generated-file-contract';

export const GeneratedFileStub = ({ ...props }: StubArgument<GeneratedFile> = {}): GeneratedFile =>
  generatedFileContract.parse({
    relPath: 'packages/syntax-repository/specimen-manifest.json',
    content: '[]',
    ...props,
  });
