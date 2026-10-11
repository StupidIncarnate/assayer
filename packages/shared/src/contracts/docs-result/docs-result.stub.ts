import type { StubArgument } from '@legendscribe/lockdown-kit-shared/@types';

import { docsResultContract } from './docs-result-contract';
import type { DocsResult } from './docs-result-contract';

export const DocsResultStub = ({ ...props }: StubArgument<DocsResult> = {}): DocsResult =>
  docsResultContract.parse({
    topic: 'overview',
    body: '# Assayer\n\nStatic test enforcement + generation for TypeScript repos.',
    ...props,
  });
