import type { StubArgument } from '@dungeonmaster/shared/@types';

import { entrySignatureContract } from './entry-signature-contract';
import type { EntrySignature } from './entry-signature-contract';

export const EntrySignatureStub = ({ ...props }: StubArgument<EntrySignature> = {}): EntrySignature =>
  entrySignatureContract.parse({
    name: 'formatGreeting',
    scopePath: ['formatGreeting'],
    params: [{ name: 'name', type: { kind: 'string' } }],
    returnType: { kind: 'string' },
    line: 1,
    access: { kind: 'named' },
    ...props,
  });
