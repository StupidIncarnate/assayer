import type { StubArgument } from '@dungeonmaster/shared/@types';

import { manifestEntryContract } from './manifest-entry-contract';
import type { ManifestEntry } from './manifest-entry-contract';

export const ManifestEntryStub = ({ ...props }: StubArgument<ManifestEntry> = {}): ManifestEntry =>
  manifestEntryContract.parse({
    folder: 'if-number-function-declaration-body-cond-gt-number-value-param',
    relPath:
      'packages/syntax-repository/src/if/function-declaration/if-number-function-declaration-body-cond-gt-number-value-param/if-number-function-declaration-body-cond-gt-number-value-param.ts',
    focus: 'if',
    container: 'function-declaration',
    slot: 'body',
    path: 'cond.value',
    provenance: 'param',
    uses: ['if', 'gt'],
    verdict: 'driven',
    ...props,
  });
