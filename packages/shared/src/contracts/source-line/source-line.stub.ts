import type { StubArgument } from '@dungeonmaster/shared/@types';

import { sourceLineContract } from './source-line-contract';
import type { SourceLine } from './source-line-contract';

export const SourceLineStub = ({ ...props }: StubArgument<SourceLine> = {}): SourceLine =>
  sourceLineContract.parse({
    n: 1,
    text: 'const x = 1;',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ...props,
  });
