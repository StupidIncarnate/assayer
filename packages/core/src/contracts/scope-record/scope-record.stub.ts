import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scopeRecordContract } from './scope-record-contract';
import type { ScopeRecord } from './scope-record-contract';

export const ScopeRecordStub = ({ ...props }: StubArgument<ScopeRecord> = {}): ScopeRecord =>
  scopeRecordContract.parse({
    scopePath: ['classify'],
    name: 'classify',
    kind: 'function',
    exported: true,
    access: { kind: 'named' },
    params: [{ name: 'value', type: { kind: 'number' } }],
    returnType: { kind: 'string' },
    startLine: 1,
    endLine: 3,
    branches: [],
    exits: [],
    ...props,
  });
