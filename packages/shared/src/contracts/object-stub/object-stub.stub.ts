import type { StubArgument } from '@dungeonmaster/shared/@types';

import { objectStubContract } from './object-stub-contract';
import type { ObjectStub } from './object-stub-contract';

export const ObjectStubStub = ({ ...props }: StubArgument<ObjectStub> = {}): ObjectStub =>
  objectStubContract.parse({
    key: 'src/config/config.ts#Config',
    definitionRelPath: 'src/config/config.ts',
    typeName: 'Config',
    properties: [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }],
    readers: ['src/config/config.ts'],
    ...props,
  });
