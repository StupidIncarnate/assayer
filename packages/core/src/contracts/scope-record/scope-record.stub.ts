import type { StubArgument } from '@dungeonmaster/shared/@types';

import { scopeRecordContract } from './scope-record-contract';
import type { ScopeRecord } from './scope-record-contract';

export const ScopeRecordStub = ({ ...props }: StubArgument<ScopeRecord> = {}): ScopeRecord =>
  scopeRecordContract.parse({
    scopePath: ['classify'],
    name: 'classify',
    kind: 'function',
    exported: true,
    params: [{ name: 'value', type: { kind: 'number' } }],
    returnType: { kind: 'string' },
    line: 1,
    branches: [],
    exits: [],
    ...props,
  });
