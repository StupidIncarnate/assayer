import type { StubArgument } from '@dungeonmaster/shared/@types';

import { declaredShapeContract } from './declared-shape-contract';
import type { DeclaredShape } from './declared-shape-contract';

export const DeclaredShapeStub = ({ ...props }: StubArgument<DeclaredShape> = {}): DeclaredShape =>
  declaredShapeContract.parse({
    name: 'Config',
    type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] },
    ...props,
  });
